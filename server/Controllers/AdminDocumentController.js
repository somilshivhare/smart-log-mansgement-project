import { Document } from "../Models/Document.js";
import { Verification } from "../Models/Verification.js";
import { Citizen } from "../Models/CitizenModel.js";
import { ActivityHistory } from "../Models/ActivityHistory.js";

const bytesToMB = (bytes) => {
  if (typeof bytes !== "number" || Number.isNaN(bytes)) return "-";
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const fetchDocumentById = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id)
      return res
        .status(400)
        .json({ success: false, message: "Document id is required" });

    const doc = await Document.findById(id).lean();
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });

    // Prefer the latest AI-generated verification when available. Admin-created verifications (manual) should not overwrite AI analysis.
    // Try to fetch the latest verification that is not a manual admin verification first.
    let latest = await Verification.findOne({
      documentId: doc._id,
      AnalysisData: { $ne: "Manual admin verification" },
    })
      .sort({ verifiedAt: -1 })
      .lean();
    if (!latest) {
      // fallback to any latest verification (existing records)
      latest = await Verification.findOne({ documentId: doc._id })
        .sort({ verifiedAt: -1 })
        .lean();
    }

    const uploader = await Citizen.findById(doc.uploadedBy)
      .select("name email")
      .lean();

    let feedbackText = null;
    let parsedFeedback = null;
    // warnings array (moved higher so transient extraction can push into it)
    const warnings = [];

    // Prefer a verification that contains ExtractedData; if latest lacks it, try to find a previous verification that has it
    let displayVerification = latest;
    try {
      if (
        latest &&
        (!latest.ExtractedData ||
          (typeof latest.ExtractedData === "object" &&
            Object.keys(latest.ExtractedData).length === 0))
      ) {
        const alt = await Verification.findOne({
          documentId: doc._id,
          ExtractedData: { $ne: null },
        })
          .sort({ verifiedAt: -1 })
          .lean();
        if (alt) {
          displayVerification = alt;
          warnings.push(
            "Using extracted data from previous verification (verify carefully)"
          );
        }
      }
    } catch (e) {
      // ignore lookup errors
    }

    // Parse feedback and extracted data using the selected verification
    try {
      if (displayVerification?.Feedback) {
        parsedFeedback = JSON.parse(displayVerification.Feedback);
        if (Array.isArray(parsedFeedback?.issues))
          feedbackText = parsedFeedback.issues.join("; ");
        else
          feedbackText =
            typeof parsedFeedback === "string"
              ? parsedFeedback
              : JSON.stringify(parsedFeedback);
      }
    } catch (_) {
      feedbackText = String(displayVerification?.Feedback || "");
    }

    // Parse extracted data (LLM-processed) if available from the selected verification
    let extractedText = null;
    try {
      if (displayVerification?.ExtractedData) {
        extractedText =
          typeof displayVerification.ExtractedData === "string"
            ? JSON.parse(displayVerification.ExtractedData)
            : displayVerification.ExtractedData;
      }
    } catch (_) {
      extractedText = null;
    }

    // If there's no extractedText stored, attempt a transient heuristic extraction from the selected verification's AnalysisData so admins can see something
    if (
      !extractedText &&
      displayVerification?.AnalysisData &&
      typeof displayVerification.AnalysisData === "string"
    ) {
      try {
        const t = String(displayVerification.AnalysisData);
        const lines = t
          .split(/\n+/)
          .map((l) => l.trim())
          .filter(Boolean);
        const fallback = {};
        const pushIfFound = (key, value) => {
          if (!value) return;
          if (!fallback[key]) fallback[key] = value;
        };
        for (const line of lines) {
          let m;
          if ((m = line.match(/(?:Name\s*[:\-]?|Full Name\s*[:\-]?)(.+)/i)))
            pushIfFound("name", m[1].trim());
          if (
            (m = line.match(
              /(?:Date\s*of\s*Birth|DOB|Birth\s*Date)[:\-\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\-]\d{1,2}[\-]\d{1,2})/i
            ))
          )
            pushIfFound("date_of_birth", m[1].trim());
          if (
            (m = line.match(
              /(?:ID\s*No\.?|ID\s*Number|Identification|Passport\s*No\.?|Document\s*No\.?|Passport)[:\-\s]*([A-Z0-9\-]{5,30})/i
            ))
          )
            pushIfFound("id_number", m[1].trim());
          if ((m = line.match(/(?:Address|Addr)[:\-]?\s*(.+)/i)))
            pushIfFound("address", m[1].trim());
          if (
            !fallback.expiry_date &&
            (m = line.match(
              /(?:Expiry|Expiry Date|Expires)[:\-\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\-]\d{1,2}[\-]\d{1,2})/i
            ))
          )
            pushIfFound("expiry_date", m[1].trim());
        }
        if (Object.keys(fallback).length > 0) {
          extractedText = {
            ...fallback,
            _meta: { source: "heuristic-transient" },
          };
          warnings.push(
            "Transient heuristic extraction applied (verify carefully)"
          );
        }
      } catch (e) {
        // ignore
      }
    }

    // Build a sanitized verification object to avoid returning raw OCR text (use displayVerification as source for extracted data)
    const sanitizedVerification = displayVerification
      ? {
          _id: displayVerification._id,
          confiedenceScore: displayVerification.confiedenceScore,
          verifiedAt: displayVerification.verifiedAt,
          Feedback: displayVerification.Feedback,
        }
      : null;

    // Compute warnings for admin UI when AI parsing failed or returned no structured data
    if (
      displayVerification &&
      (extractedText == null ||
        (typeof extractedText === "object" &&
          Object.keys(extractedText).length === 0))
    ) {
      warnings.push(
        "AI parsing returned no structured data or encountered an error; raw AI response saved for audit."
      );
    }

    // If heuristic fallback was used, add an informational warning
    try {
      if (
        extractedText &&
        extractedText._meta &&
        extractedText._meta.source === "heuristic"
      ) {
        warnings.push(
          "Structured data produced by heuristic fallback (verify carefully)"
        );
      }
    } catch (_) {}

    // Extract any raw LLM excerpt saved in feedback for audit/debug
    let aiRawExcerpt = null;
    try {
      if (parsedFeedback && parsedFeedback.raw) {
        aiRawExcerpt = String(parsedFeedback.raw);
      }
    } catch (_) {
      aiRawExcerpt = null;
    }

    return res.status(200).json({
      success: true,
      document: {
        _id: doc._id,
        name: doc.name,
        type: doc.type,
        status: doc.status,
        fileSize: bytesToMB(doc.fileSize),
        uploadDate: doc.uploadedAt
          ? new Date(doc.uploadedAt).toISOString().slice(0, 10)
          : null,
        url: doc.url,
        uploader: uploader
          ? { _id: uploader._id, name: uploader.name, email: uploader.email }
          : null,
        verificationDate: latest?.verifiedAt
          ? new Date(latest.verifiedAt).toISOString().slice(0, 10)
          : null,
        confidence:
          typeof latest?.confiedenceScore === "number"
            ? latest.confiedenceScore
            : null,
        feedback: feedbackText || null,
        // expose extracted/processed fields (no raw OCR)
        extractedText: extractedText || null,
        extractionSource:
          (extractedText &&
            extractedText._meta &&
            extractedText._meta.source) ||
          displayVerification?.extractionSource ||
          latest?.extractionSource ||
          null,
        warnings,
        aiRawExcerpt,
        // sanitized verification metadata (no AnalysisData/raw OCR)
        rawVerification: sanitizedVerification,
        // admin remarks are stored on the document separately and should not overwrite AI analysis
        remarks: doc.adminRemarks || null,
      },
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

export const approveDocument = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id)
      return res
        .status(400)
        .json({ success: false, message: "Document id is required" });

    const doc = await Document.findById(id);
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });

    // Update status and store admin remarks separately so AI analysis is preserved
    doc.status = "approved";
    const { feedback = "Approved by admin" } = req.body || {};
    doc.adminRemarks = String(feedback);
    doc.adminBy = req.user?._id;
    doc.adminAt = new Date();
    await doc.save();

    // Log activity: document approved (include admin remarks)
    await ActivityHistory.create({
      userId: doc.uploadedBy,
      documentId: doc._id,
      action: "approve",
      details: `Document '${doc.name}' approved by admin. Remarks: ${feedback}`,
      performedBy: req.user?._id,
      performedByModel: "Admin",
    });
    try {
      const { LogsAndAudit } = await import("../Models/LogsAndAudit.js");
      await LogsAndAudit.log({
        level: "INFO",
        module: "Document Verification",
        message: `Document ${doc._id} approved by admin ${
          req.user?.email || req.user?.name || req.user?._id
        }`,
        userId: doc.uploadedBy,
        username: req.user?.email || req.user?.name,
      });
    } catch (err) {
      console.warn("Failed to write approval log", err?.message || err);
    }

    return res
      .status(200)
      .json({ success: true, message: "Document approved" });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

export const rejectDocument = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id)
      return res
        .status(400)
        .json({ success: false, message: "Document id is required" });

    const doc = await Document.findById(id);
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });

    // Update status and store admin remarks separately so AI analysis is preserved
    doc.status = "rejected";
    const { reason = "Rejected by admin" } = req.body || {};
    doc.adminRemarks = String(reason);
    doc.adminBy = req.user?._id;
    doc.adminAt = new Date();
    await doc.save();

    // Log activity: document rejected (include admin reason)
    await ActivityHistory.create({
      userId: doc.uploadedBy,
      documentId: doc._id,
      action: "reject",
      details: `Document '${doc.name}' rejected by admin. Reason: ${reason}`,
      performedBy: req.user?._id,
      performedByModel: "Admin",
    });
    try {
      const { LogsAndAudit } = await import("../Models/LogsAndAudit.js");
      await LogsAndAudit.log({
        level: "INFO",
        module: "Document Verification",
        message: `Document ${doc._id} rejected by admin ${
          req.user?.email || req.user?.name || req.user?._id
        } - ${reason}`,
        userId: doc.uploadedBy,
        username: req.user?.email || req.user?.name,
        metadata: { reason },
      });
    } catch (err) {
      console.warn("Failed to write rejection log", err?.message || err);
    }

    return res
      .status(200)
      .json({ success: true, message: "Document rejected" });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

export const fetchAllDocuments = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    // Build match filter from query params (status and type only)
    const { status, type, search } = req.query;
    const match = {};
    if (status && status !== "all") match.status = status;
    if (type && type !== "all") match.type = type;

    // Total count for pagination (apply same match for status/type)
    const countMatch = { ...match };
    const total = await Document.countDocuments(countMatch);

    // Aggregation pipeline: prioritize pending documents first (statusPriority: 0), then others (1)
    const pipeline = [];
    if (Object.keys(match).length) pipeline.push({ $match: match });

    // then add remaining stages
    pipeline.push(
      {
        $addFields: {
          statusPriority: {
            $cond: [{ $eq: ["$status", "pending"] }, 0, 1],
          },
        },
      },
      { $sort: { statusPriority: 1, uploadedAt: 1 } },
      // attach latest verification
      {
        $lookup: {
          from: "verifications",
          let: { docId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$documentId", "$$docId"] } } },
            { $sort: { verifiedAt: -1 } },
            { $limit: 1 },
          ],
          as: "latestVerification",
        },
      },
      {
        $unwind: {
          path: "$latestVerification",
          preserveNullAndEmptyArrays: true,
        },
      },
      // attach uploader (citizen) info
      {
        $lookup: {
          from: "citizens",
          let: { uid: "$uploadedBy" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$uid"] } } },
            { $project: { name: 1, email: 1 } },
          ],
          as: "uploader",
        },
      },
      { $unwind: { path: "$uploader", preserveNullAndEmptyArrays: true } }
    );

    // apply search after uploader lookup so we can search by uploader.name/email as well
    if (search) {
      const regex = new RegExp(search, "i");
      pipeline.push({
        $match: {
          $or: [
            { name: regex },
            { "uploader.name": regex },
            { "uploader.email": regex },
            {
              $expr: {
                $regexMatch: {
                  input: { $toString: "$_id" },
                  regex: search,
                  options: "i",
                },
              },
            },
          ],
        },
      });
    }

    // continue pipeline
    pipeline.push(
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          name: 1,
          type: 1,
          status: 1,
          fileSize: 1,
          uploadedAt: 1,
          url: 1,
          "verification._id": "$latestVerification._id",
          "verification.confiedenceScore":
            "$latestVerification.confiedenceScore",
          "verification.verifiedAt": "$latestVerification.verifiedAt",
          "verification.Feedback": "$latestVerification.Feedback",
          "uploader._id": "$uploader._id",
          "uploader.name": "$uploader.name",
          "uploader.email": "$uploader.email",
        },
      }
    );

    const docs = await Document.aggregate(pipeline);

    // Format results to a friendly API shape
    const items = docs.map((d) => {
      let feedbackText = null;
      try {
        if (d.verification?.Feedback) {
          const parsed = JSON.parse(d.verification.Feedback);
          if (Array.isArray(parsed?.issues))
            feedbackText = parsed.issues.join("; ");
          else
            feedbackText =
              typeof parsed === "string" ? parsed : JSON.stringify(parsed);
        }
      } catch (_) {
        feedbackText = String(d.verification?.Feedback || "");
      }

      return {
        _id: d._id,
        name: d.name,
        type: d.type,
        status: d.status,
        fileSize: bytesToMB(d.fileSize),
        uploadDate: d.uploadedAt
          ? new Date(d.uploadedAt).toISOString().slice(0, 10)
          : null,
        url: d.url,
        uploader: d.uploader
          ? {
              _id: d.uploader._id,
              name: d.uploader.name,
              email: d.uploader.email,
            }
          : null,
        verificationDate: d.verification?.verifiedAt
          ? new Date(d.verification.verifiedAt).toISOString().slice(0, 10)
          : null,
        confidence:
          typeof d.verification?.confiedenceScore === "number"
            ? d.verification.confiedenceScore
            : null,
        feedback: feedbackText || null,
      };
    });

    return res.status(200).json({
      success: true,
      documents: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};
