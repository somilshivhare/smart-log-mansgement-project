// Lightweight test harness for fallbackExtractFields
import { readFileSync } from "fs";
import { fallbackExtractFields } from "../Controllers/DocumentController.js";

const samples = [
  {
    name: "Passport sample",
    text: `Name: JOHN DOE\nPassport No.: A1234567\nDate of Birth: 1990-01-02\nAddress: 123 Main St\nCity`,
    expected: {
      name: "JOHN DOE",
      passport_number: "A1234567",
      date_of_birth: "1990-01-02",
    },
  },
  {
    name: "Email phone sample",
    text: `Full Name: Jane Smith\nEmail: jane@example.com\nPhone: +1 555-123-4567`,
    expected: {
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "+1 555-123-4567",
    },
  },
];

for (const s of samples) {
  const out = fallbackExtractFields(s.text);
  console.log("Sample:", s.name);
  console.log("Output:", out);
  console.log(
    "Match expected keys:",
    Object.keys(s.expected).every((k) => out[k])
  );
  console.log("---");
}
