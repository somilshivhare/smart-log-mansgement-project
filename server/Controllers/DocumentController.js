import cloudinary from "../Config/cloudinary.js";
import Tesseract from "tesseract.js";
import sharp from "sharp";
import { Document } from "../Models/Document.js";
import { Verification } from "../Models/Verification.js";
import { ActivityHistory } from "../Models/ActivityHistory.js";

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const extractJsonObject = (value) => {
  if (typeof value !== "string") return null;

  // Strip common markdown code fences: ```json ... ``` or ``` ... ```
  let text = value.trim();
  text = text.replace(/^```(?:json)?\s*/i, "");
  text = text.replace(/```\s*$/i, "");
  text = text.trim();

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  return text.slice(firstBrace, lastBrace + 1);
};

// Preprocess image buffer to improve OCR results (grayscale, normalize, resize, sharpen, threshold)
// Returns a Buffer suitable for Tesseract.recognize
const preprocessImageForOCR = async (buffer) => {
  try {
    const processed = await sharp(buffer)
      .rotate() // auto-orient using EXIF
      .grayscale()
      .normalise()
      .resize({ width: 2000, withoutEnlargement: false })
      .sharpen()
      .threshold(140)
      .toFormat("png")
      .toBuffer();
    return processed;
  } catch (err) {
    console.warn(
      "Image preprocessing failed, falling back to original buffer",
      err?.message || err
    );
    return buffer;
  }
};

// Simple cleanup of OCR output: remove soft hyphens, fix hyphenated line breaks, collapse whitespace
const cleanOcrText = (text) => {
  if (!text || typeof text !== "string") return "";
  let t = text.replace(/\u00AD/g, ""); // soft hyphen
  t = t.replace(/-\s*\n\s*/g, ""); // join hyphenated line breaks
  t = t.replace(/\r/g, "\n");
  t = t.replace(/\n{2,}/g, "\n"); // collapse multiple newlines
  t = t.replace(/[^\x00-\x7F]+/g, " "); // replace non-ascii chars with spaces
  t = t.replace(/[ \t]{2,}/g, " ");
  return t.trim();
};

// Heuristic fallback extractor: attempts to find common fields when LLM fails
export const fallbackExtractFields = (text) => {
  if (!text || typeof text !== "string") return {};
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const result = {};

  const pushIfFound = (key, value) => {
    if (!value) return;
    if (!result[key]) result[key] = value;
  };

  // Patterns expanded: name, dob, ids, passport, driver's license, national ids, email, phone, address, dates
  const namePattern =
    /(?:Name\s*[:\-]?|Full Name\s*[:\-]?|Surname\s*[:\-]?|Given Names\s*[:\-]?)(.+)/i;
  const dobPattern =
    /(?:Date\s*of\s*Birth|DOB|Birth\s*Date)[:\-\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\-]\d{1,2}[\-]\d{1,2})/i;
  const idPattern =
    /(?:ID\s*No\.?|ID\s*Number|Identification|NIN|SSN|TIN|PAN|Passport\s*No\.?|Document\s*No\.?|Document\s*Number)[:\-\s]*([A-Z0-9\-\/]{4,40})/i;
  const driversPattern =
    /(?:Driver\'?s?\s*License|DL)[:\-\s]*([A-Z0-9\-]{4,30})/i;
  const passportPattern = /(?:Passport)[:\-\s]*([A-Z0-9\-]{4,20})/i;
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const phonePattern = /(\+?\d[\d\s\-()]{6,}\d)/i;
  const datePattern =
    /(\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}[\-]\d{1,2}[\-]\d{1,2}\b)/;
  const addressPattern = /(?:Address|Addr|Residence|Street)[:\-]?\s*(.+)/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m;

    if ((m = line.match(namePattern))) pushIfFound("name", m[1].trim());
    if ((m = line.match(dobPattern))) pushIfFound("date_of_birth", m[1].trim());
    if ((m = line.match(idPattern))) pushIfFound("id_number", m[1].trim());
    if ((m = line.match(driversPattern)))
      pushIfFound("drivers_license", m[1].trim());
    if ((m = line.match(passportPattern)))
      pushIfFound("passport_number", m[1].trim());
    if ((m = line.match(emailPattern))) pushIfFound("email", m[1].trim());
    if ((m = line.match(phonePattern))) pushIfFound("phone", m[1].trim());
    if ((m = line.match(addressPattern))) {
      let address = m[1].trim();
      const next = lines[i + 1];
      if (
        next &&
        next.length > 10 &&
        /[A-Za-z0-9]/.test(next) &&
        !/^(DOB|Date|Passport|ID|Document|Expiry)/i.test(next)
      ) {
        address += ", " + next;
      }
      pushIfFound("address", address);
    }

    // generic expiry/date
    if (
      !result.expiry_date &&
      (m = line.match(
        /(?:Expiry|Expiry Date|Expires)[:\-\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\-]\d{1,2}[\-]\d{1,1})/i
      ))
    )
      pushIfFound("expiry_date", m[1].trim());

    // generic date capture
    if (!result.any_date && datePattern.test(line))
      pushIfFound("any_date", (line.match(datePattern) || [])[0]);
  }

  // Last resort: pick long numeric tokens that could be document numbers
  if (!result.id_number) {
    const numericToken = text.match(/\b[A-Z0-9]{6,}\b/gi);
    if (numericToken) pushIfFound("possible_document_number", numericToken[0]);
  }

  return result;
};

export const uploadDocument = async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: "Missing GEMINI_API_KEY",
      });
    }
    const userId = req.user._id;
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const documentType = req.body?.documentType;
    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: "Document type is required",
      });
    }

    const uploadResult = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "documents",
      },
      async (error, result) => {
        if (error) {
          return res.status(500).json({
            success: false,
            message: "Cloudinary upload failed",
            error,
          });
        }
        const preprocessedBuffer = await preprocessImageForOCR(req.file.buffer);
        const {
          data: { text: rawText },
        } = await Tesseract.recognize(preprocessedBuffer, "eng");
        const text = cleanOcrText(rawText);
        const doc = await Document.create({
          name: req.file.originalname,
          url: result.secure_url,
          fileSize: req.file.size,
          uploadedBy: userId,
          type: documentType,
          status: "pending",
        });
        // Log activity: document upload
        await ActivityHistory.create({
          userId,
          documentId: doc._id,
          action: "upload",
          details: `Document '${doc.name}' uploaded`,
          performedBy: userId,
          performedByModel: "Citizen",
        });
        try {
          const { LogsAndAudit } = await import("../Models/LogsAndAudit.js");
          await LogsAndAudit.log({
            level: "INFO",
            module: "Document Upload",
            message: `New document uploaded - ${doc._id}`,
            userId,
          });
        } catch (err) {
          console.warn(
            "Failed to write document upload log",
            err?.message || err
          );
        }
        const prompt = `You are an AI document analysis assistant.

I will provide you with text that has been extracted from a document.
The original document may have been a PDF or an image, and the text you receive is the result of OCR or text extraction.

The file type is: ${req.file.mimetype}.

Your task is to analyze the provided text and evaluate the overall quality, clarity, and reliability of the document.

Return your response as STRICT VALID JSON ONLY.
- Do NOT wrap the JSON in markdown.
- Do NOT use markdown code fences (for example: triple-backtick blocks).
- Do NOT add any explanation outside JSON.

JSON schema (must match exactly):
{
  "confidence_score": number (0-100),
  "confidence_level": "Low" | "Medium" | "High",
  "feedback": {
    "issues": ["Issue 1", "Issue 2", "..."]
  }
}

Rules:
- Base your analysis only on the extracted text provided.
- If text seems incomplete/corrupted, lower the score and add issues.
- If the document appears identity-related/legal/official, apply stricter criteria.
- Do not include summary/strengths/improvement_suggestions; only include feedback.issues.
`;
        const geminiRes = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `${prompt}\n\nExtracted Text:\n${text}`,
        });
        const jsonText = extractJsonObject(geminiRes.text) ?? geminiRes.text;
        let geminiData = null;
        let geminiParseFailed = false;
        const rawGeminiText = String(geminiRes.text || "");
        try {
          geminiData = JSON.parse(jsonText);
        } catch (err) {
          geminiParseFailed = true;
          console.warn(
            "Gemini returned invalid JSON - saving raw response for audit",
            err?.message || err
          );
          try {
            const { LogsAndAudit } = await import("../Models/LogsAndAudit.js");
            await LogsAndAudit.log({
              level: "ERROR",
              module: "AI Service",
              message: "Gemini returned invalid JSON",
              userId,
              metadata: { response: rawGeminiText.slice(0, 2000) },
            });
          } catch (logErr) {
            console.warn(
              "Failed to write AI parse error log",
              logErr?.message || logErr
            );
          }
          // create a fallback geminiData object so downstream code can still run
          geminiData = {
            confidence_score: null,
            feedback: { issues: ["LLM returned invalid JSON"] },
          };
        }

        // Second LLM pass: extract structured key/value pairs from the cleaned OCR text
        let extractedData = null;
        let extractionRetryUsed = false;
        try {
          const extractionPromptBase = `You are a JSON extractor. Given OCR text, extract any identifiable key/value pairs (for example: name, document_number, id_number, date_of_birth, address, expiry_date, phone, email, gender, place_of_birth, expiry_date, etc.).\nReturn STRICT JSON ONLY in the following format:\n{\n  "extracted": {"field_name": "value", "another_field": "value"}\n}\nIf nothing obvious can be extracted, return {"extracted": {}}.\nRules:\n- Do NOT include the original raw text in the output.\n- Do NOT include any explanation or markdown - ONLY return JSON.`;

          const runExtraction = async (promptSeed) => {
            const extractRes = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: `${promptSeed}\n\nText:\n${text}`,
            });
            return extractRes;
          };

          // First attempt
          const extractRes1 = await runExtraction(extractionPromptBase);
          let extractedJson =
            extractJsonObject(extractRes1.text) ?? extractRes1.text;
          try {
            const parsed = JSON.parse(extractedJson);
            extractedData =
              parsed && parsed.extracted ? parsed.extracted : parsed;
          } catch (err) {
            // Retry once with a clarifying prompt if parsing failed or produced empty extraction
            console.warn(
              "Initial extraction parse failed or returned empty, retrying extraction once",
              err?.message || err
            );
            extractionRetryUsed = true;
            const retryPrompt = `Previous response was not valid JSON or contained no fields. Return STRICT JSON ONLY in the exact format {"extracted": {...}} and do NOT include any other text. Repeat only the JSON.`;
            try {
              const extractRes2 = await runExtraction(
                `${retryPrompt}\n\n${extractionPromptBase}`
              );
              const extractedJson2 =
                extractJsonObject(extractRes2.text) ?? extractRes2.text;
              const parsed2 = JSON.parse(extractedJson2);
              extractedData =
                parsed2 && parsed2.extracted ? parsed2.extracted : parsed2;
            } catch (err2) {
              console.warn("Retry extraction failed", err2?.message || err2);
              extractedData = null;
            }
          }
        } catch (err) {
          console.warn("Failed to run extraction LLM", err?.message || err);
          extractedData = null;
        }

        // If extraction returned empty, run heuristic fallback
        let usedFallback = false;
        if (
          !extractedData ||
          (typeof extractedData === "object" &&
            Object.keys(extractedData).length === 0)
        ) {
          try {
            const fallback = fallbackExtractFields(text);
            if (fallback && Object.keys(fallback).length > 0) {
              extractedData = { ...fallback, _meta: { source: "heuristic" } };
              usedFallback = true;
              console.info(
                "Fallback extraction produced fields",
                Object.keys(fallback)
              );
            }
          } catch (err) {
            console.warn("Fallback extraction failed", err?.message || err);
          }
        }

        // If the initial LLM parse failed, include a short raw excerpt in feedback for audits
        let feedbackToSave =
          geminiData && geminiData.feedback
            ? geminiData.feedback
            : { issues: ["LLM returned invalid JSON"] };
        if (geminiParseFailed) {
          feedbackToSave = {
            ...feedbackToSave,
            raw: rawGeminiText.slice(0, 2000),
          };
        }
        if (usedFallback) {
          feedbackToSave = {
            ...feedbackToSave,
            _note: "Structured data produced by heuristic fallback",
          };
        }
        if (extractionRetryUsed && !usedFallback) {
          feedbackToSave = {
            ...feedbackToSave,
            _note: feedbackToSave._note
              ? `${feedbackToSave._note}; LLM retry used`
              : "LLM retry used",
          };
        }

        // Determine extraction source to help admin UI & debugging
        const extractionSource = usedFallback
          ? "heuristic"
          : extractedData &&
            typeof extractedData === "object" &&
            Object.keys(extractedData).length > 0
          ? "llm"
          : null;

        // Ensure extraction metadata is attached to extractedData object when possible
        try {
          if (extractedData && typeof extractedData === "object") {
            extractedData._meta = extractedData._meta || {};
            if (extractionRetryUsed) extractedData._meta.retry = true;
            if (extractionSource) extractedData._meta.source = extractionSource;
          }
        } catch (e) {
          // ignore
        }

        const verification = await Verification.create({
          citizenId: userId,
          documentId: doc._id,
          status: "pending",
          confiedenceScore: geminiData?.confidence_score ?? null,
          AnalysisData: text,
          ExtractedData: extractedData,
          extractionSource,
          Feedback: JSON.stringify(feedbackToSave),
        });
        // Log AI confidence warnings if below threshold
        try {
          const score = Number(geminiData.confidence_score);
          const threshold = 80;
          if (!Number.isNaN(score) && score < threshold) {
            const { LogsAndAudit } = await import("../Models/LogsAndAudit.js");
            await LogsAndAudit.log({
              level: "WARN",
              module: "AI Service",
              message: `AI confidence score below threshold (${score}%) for ${doc._id}`,
              userId,
            });
          }
        } catch (err) {
          console.warn("Failed to write AI warning log", err?.message || err);
        }
        // Log activity: document sent for verification
        await ActivityHistory.create({
          userId,
          documentId: doc._id,
          action: "verify",
          details: `Document '${doc.name}' sent for AI verification`,
          performedBy: userId,
          performedByModel: "Citizen",
        });
        res.status(200).json({ success: true, document: doc, verification });
      }
    );
    uploadResult.end(req.file.buffer);
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

export const fetchDocuments = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const documents = await Document.find({ uploadedBy: userId })
      .sort({ uploadedAt: -1 })
      .lean();

    const documentIds = documents.map((d) => d._id);
    const verifications = await Verification.find({
      citizenId: userId,
      documentId: { $in: documentIds },
    })
      .sort({ verifiedAt: -1 })
      .lean();

    const latestVerificationByDocId = new Map();
    for (const v of verifications) {
      const key = String(v.documentId);
      if (!latestVerificationByDocId.has(key)) {
        latestVerificationByDocId.set(key, v);
      }
    }

    const items = documents.map((doc) => ({
      ...doc,
      verification: latestVerificationByDocId.get(String(doc._id)) || null,
    }));

    return res.status(200).json({ success: true, documents: items });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

export const getDocumentDetails = async (req, res) => {
  try {
    const userId = req.user?._id;
    const documentId = req.params?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!documentId) {
      return res
        .status(400)
        .json({ success: false, message: "Document id is required" });
    }

    const doc = await Document.findOne({
      _id: documentId,
      uploadedBy: userId,
    }).lean();

    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    const verification = await Verification.findOne({
      citizenId: userId,
      documentId: doc._id,
    })
      .sort({ verifiedAt: -1 })
      .lean();

    const formatDateTime = (value) => {
      if (!value) return null;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return null;
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const hh = String(date.getHours()).padStart(2, "0");
      const min = String(date.getMinutes()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    };

    const bytesToMB = (bytes) => {
      if (typeof bytes !== "number" || Number.isNaN(bytes)) return "-";
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    let feedbackText = "";
    let remarksText = "";
    if (verification?.Feedback) {
      try {
        const parsed = JSON.parse(verification.Feedback);
        if (Array.isArray(parsed?.issues) && parsed.issues.length > 0) {
          feedbackText = parsed.issues.join("\n");
          remarksText = parsed.issues[0];
        } else {
          feedbackText =
            typeof parsed === "string" ? parsed : JSON.stringify(parsed);
        }
      } catch {
        feedbackText = String(verification.Feedback);
      }
    }

    const history = [];
    const uploadedAt =
      doc.uploadedAt || doc.uploadedAt === 0 ? doc.uploadedAt : doc.uploadedAt;
    if (doc.uploadedAt) {
      history.push({
        date: formatDateTime(doc.uploadedAt),
        event: "Document uploaded to system",
      });
      history.push({
        date: formatDateTime(doc.uploadedAt),
        event: "Document submitted for verification",
      });
    }
    if (verification?.verifiedAt) {
      const score =
        typeof verification.confiedenceScore === "number"
          ? verification.confiedenceScore
          : null;
      history.push({
        date: formatDateTime(verification.verifiedAt),
        event:
          score === null
            ? "AI verification completed"
            : `AI verification completed with ${score}% confidence`,
      });
    }
    if (doc.status === "approved") {
      history.push({
        date: formatDateTime(verification?.verifiedAt || doc.uploadedAt),
        event: "Document approved",
      });
    }
    if (doc.status === "rejected") {
      history.push({
        date: formatDateTime(verification?.verifiedAt || doc.uploadedAt),
        event: "Document rejected",
      });
    }

    const responseDocument = {
      _id: doc._id,
      name: doc.name,
      type: doc.type,
      uploadDate: doc.uploadedAt
        ? new Date(doc.uploadedAt).toISOString().slice(0, 10)
        : "-",
      status: doc.status,
      fileSize: bytesToMB(doc.fileSize),
      url: doc.url,
      verificationDate: verification?.verifiedAt
        ? new Date(verification.verifiedAt).toISOString().slice(0, 10)
        : null,
      verifiedBy: verification ? "AI Verification" : null,
      confidence:
        typeof verification?.confiedenceScore === "number"
          ? verification.confiedenceScore
          : null,
      feedback: feedbackText || "No feedback available.",
      remarks: remarksText || "N/A",
      history: history.filter((h) => h.date),
    };

    return res.status(200).json({ success: true, document: responseDocument });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};
