import { fallbackExtractFields } from "../Controllers/DocumentController.js";

describe("fallbackExtractFields", () => {
  test("extracts passport, name and dob", () => {
    const text = `Name: JOHN DOE\nPassport No.: A1234567\nDate of Birth: 1990-01-02\nAddress: 123 Main St`;
    const out = fallbackExtractFields(text);
    expect(out.name).toBe("JOHN DOE");
    expect(out.passport_number || out.id_number).toBeTruthy();
    expect(out.date_of_birth).toBe("1990-01-02");
  });

  test("extracts email and phone", () => {
    const text = `Full Name: Jane Smith\nEmail: jane@example.com\nPhone: +1 555-123-4567`;
    const out = fallbackExtractFields(text);
    expect(out.email).toBe("jane@example.com");
    expect(out.phone).toBe("+1 555-123-4567");
  });
});
