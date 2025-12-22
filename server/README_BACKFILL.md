Backfill & Extraction Notes

Purpose
- One-time backfill script `Utils/backfillExtraction.js` populates `Verification.ExtractedData` and `extractionSource` for verifications that don't have it.

Usage
- From `server/` run:
  - `node Utils/backfillExtraction.js`
- The script will connect to the DB using `process.env.MONGO_URI` or `process.env.DATABASE_URL`.
- If `GEMINI_API_KEY` is set, the script will try the LLM first, then fall back to heuristics.

Safety & Notes
- Designed to be idempotent: it only updates verifications where `ExtractedData` is missing or empty.
- The LLM call is rate-limited and logs progress. Monitor usage if running with an API key.

Local testing
- Run `node Utils/testFallback.js` to exercise the local heuristic extractor.

Follow-ups
- Optional: run migration on a staging DB first and spot-check results before running in production.
