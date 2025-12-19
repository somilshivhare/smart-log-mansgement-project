import cloudinary from "../Config/cloudinary.js";
import Tesseract from "tesseract.js";
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
        const {
          data: { text },
        } = await Tesseract.recognize(req.file.buffer, "eng");
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
        let geminiData;
        try {
          geminiData = JSON.parse(jsonText);
        } catch {
          return res.status(502).json({
            success: false,
            message: "Server error",
            error: "Gemini returned invalid JSON",
          });
        }
        const verification = await Verification.create({
          citizenId: userId,
          documentId: doc._id,
          status: "pending",
          confiedenceScore: geminiData.confidence_score,
          AnalysisData: text,
          Feedback: JSON.stringify(geminiData.feedback),
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
