/*
Simple backfill script to populate `ExtractedData` + `extractionSource` for existing verifications.
Usage: node Utils/backfillExtraction.js

Notes:
- Respects process.env and will use GEMINI_API_KEY if available to call the LLM.
- Runs in batches and logs progress. Designed to be safe and idempotent: it only updates verifications where ExtractedData is null or empty.
*/
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { Verification } from "../Models/Verification.js";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.DATABASE_URL ||
  "mongodb://localhost:27017/mern-class";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const extractJsonObject = (value) => {
  if (typeof value !== "string") return null;
  let text = value.trim();
  text = text.replace(/^```(?:json)?\s*/i, "");
  text = text.replace(/```\s*$/i, "");
  text = text.trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace)
    return null;
  return text.slice(firstBrace, lastBrace + 1);
};

const fallbackExtractFields = (text) => {
  if (!text || typeof text !== "string") return {};
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const result = {};
  const pushIfFound = (k, v) => {
    if (!v) return;
    if (!result[k]) result[k] = v;
  };
  const namePattern =
    /(?:Name\s*[:\-]?|Full Name\s*[:\-]?|Surname\s*[:\-]?|Given Names\s*[:\-]?)(.+)/i;
  const dobPattern =
    /(?:Date\s*of\s*Birth|DOB|Birth\s*Date)[:\-\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\-]\d{1,2}[\-]\d{1,1})/i;
  const idPattern =
    /(?:ID\s*No\.?|ID\s*Number|Identification|NIN|SSN|TIN|PAN|Passport\s*No\.?|Document\s*No\.?|Document\s*Number)[:\-\s]*([A-Z0-9\-\/]{4,40})/i;
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const phonePattern = /(\+?\d[\d\s\-()]{6,}\d)/i;
  const addressPattern = /(?:Address|Addr|Residence|Street)[:\-]?\s*(.+)/i;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m;
    if ((m = line.match(namePattern))) pushIfFound("name", m[1].trim());
    if ((m = line.match(dobPattern))) pushIfFound("date_of_birth", m[1].trim());
    if ((m = line.match(idPattern))) pushIfFound("id_number", m[1].trim());
    if ((m = line.match(emailPattern))) pushIfFound("email", m[1].trim());
    if ((m = line.match(phonePattern))) pushIfFound("phone", m[1].trim());
    if ((m = line.match(addressPattern))) pushIfFound("address", m[1].trim());
  }
  return result;
};

const run = async () => {
  console.log("Backfill started...");
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to DB");

  const cursor = Verification.find({
    $or: [
      { ExtractedData: { $exists: false } },
      { ExtractedData: null },
      { ExtractedData: {} },
    ],
  }).cursor();
  let count = 0;
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    try {
      console.log(`Processing verification ${doc._id} doc:${doc.documentId}`);
      if (!doc.AnalysisData) {
        console.log("  no AnalysisData, skipping");
        continue;
      }

      // Try LLM extraction if API key available
      let extracted = null;
      let source = null;
      if (ai) {
        try {
          const prompt = `You are a JSON extractor. Given OCR text, extract common key/value pairs. Return JSON only in the form {"extracted": {...}} or {"extracted": {}} if nothing can be extracted.`;
          const res = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `${prompt}\n\nText:\n${doc.AnalysisData}`,
          });
          const jsonText = extractJsonObject(res.text) ?? res.text;
          const parsed = JSON.parse(jsonText);
          extracted = parsed && parsed.extracted ? parsed.extracted : parsed;
          if (extracted && Object.keys(extracted).length > 0) source = "llm";
        } catch (e) {
          console.warn("LLM extraction failed for", doc._id, e?.message || e);
        }
      }

      if (!extracted || Object.keys(extracted).length === 0) {
        const fallback = fallbackExtractFields(doc.AnalysisData);
        if (fallback && Object.keys(fallback).length > 0) {
          extracted = fallback;
          source = source || "heuristic";
        }
      }

      if (extracted && Object.keys(extracted).length > 0) {
        await Verification.updateOne(
          { _id: doc._id },
          { $set: { ExtractedData: extracted, extractionSource: source } }
        );
        console.log(`  updated verification ${doc._id} source=${source}`);
        count++;
      } else {
        console.log(`  no extraction found for ${doc._id}`);
      }

      // rate-limit a bit to avoid hitting LLM too fast
      await delay(250);
    } catch (err) {
      console.warn("Failed to process doc", err?.message || err);
    }
  }

  console.log(`Backfill finished. Updated ${count} verifications.`);
  mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
