import assert from "node:assert/strict";
import { test } from "node:test";
import {
  documentKinds,
  fields,
  sellerDestination,
  validateStep,
  validateUpload,
  MAX_FILE_SIZE,
} from "../src/lib/seller/model.ts";
const valid = fields.map((step) =>
  Object.fromEntries(
    step.map((f) => [
      f.key,
      f.choices?.[0] ??
        (f.type === "email"
          ? "buyer@example.com"
          : f.type === "tel"
            ? "+254712345678"
            : f.type === "url"
              ? "https://example.com"
              : f.type === "number"
                ? "4"
                : f.type === "date"
                  ? "1990-01-01"
                  : f.key === "store_slug"
                    ? "coastal-store"
                    : "Example"),
    ]),
  ),
);
const docs = documentKinds
  .filter((d) => d.required)
  .map((d) => ({
    kind: d.kind,
    path: "test",
    bucket: "seller-documents",
    name: "test.pdf",
    mime: "application/pdf",
    size: 10,
  }));
valid[3]!["bank_name"] = "Bank";
valid[3]!["account_number"] = "123";
valid[3]!["account_name"] = "Owner";
valid[3]!["branch"] = "Coast";
valid[0]!["gps_location"] = "-4.0435, 39.6682";
test("valid business, owner, documents, payment, and store steps", () => {
  for (let i = 0; i < 5; i++) assert.deepEqual(validateStep(i, valid, docs), []);
});
test("every required field is enforced", () => {
  for (const [i, step] of fields.entries())
    for (const f of step.filter((f) => !f.optional)) {
      const data = structuredClone(valid);
      data[i]![f.key] = "";
      assert.ok(validateStep(i, data, docs).length, `${i}: ${f.key}`);
    }
});
test("impossible calendar dates fail before the owner step can advance", () => {
  for (const date of ["1990-02-31", "1990-13-01", "1990-00-01", "not-a-date", "9999-01-01"]) {
    const data = structuredClone(valid);
    data[1]!["date_of_birth"] = date;
    assert.ok(validateStep(1, data, docs).some((e) => e.includes("Date of Birth")));
  }
  const data = structuredClone(valid);
  data[1]!["date_of_birth"] = "2000-02-29";
  assert.deepEqual(validateStep(1, data, docs), []);
});
test("company registration is conditional and missing documents block completion", () => {
  assert.ok(validateStep(2, valid, []).length === 3);
  const data = structuredClone(valid);
  data[0]!["business_type"] = "Company";
  assert.ok(validateStep(2, data, docs).some((e) => e.includes("Company Registration")));
});
test("payment destination and store slug validation", () => {
  const data = structuredClone(valid);
  data[3]!["preferred_payment_method"] = "Mobile money";
  data[3]!["mobile_money_number"] = "";
  assert.ok(validateStep(3, data, docs).length);
  data[4]!["store_slug"] = "Bad Slug";
  assert.ok(validateStep(4, data, docs).length);
});
test("eligibility routes cover all states and account restrictions override approval", () => {
  for (const s of ["SUBMITTED", "PENDING_REVIEW", "UNDER_REVIEW"])
    assert.equal(sellerDestination(s), "/seller/status");
  for (const s of [undefined, "DRAFT", "REJECTED", "MORE_INFORMATION_REQUIRED"])
    assert.equal(sellerDestination(s), "/seller/register");
  assert.equal(sellerDestination("APPROVED"), "/seller/dashboard");
  for (const s of ["SUSPENDED", "BLOCKED", "DISABLED"])
    assert.equal(sellerDestination("APPROVED", s), "/seller/status");
});
test("upload checks reject oversized, unsupported, empty and spoofed files", async () => {
  await assert.rejects(() => validateUpload(new File([], "a.pdf", { type: "application/pdf" })));
  await assert.rejects(() =>
    validateUpload(new File(["x".repeat(MAX_FILE_SIZE + 1)], "a.pdf", { type: "application/pdf" })),
  );
  await assert.rejects(() => validateUpload(new File(["x"], "a.svg", { type: "image/svg+xml" })));
  await assert.rejects(() =>
    validateUpload(new File(["hello"], "a.pdf", { type: "application/pdf" })),
  );
  await assert.rejects(() =>
    validateUpload(new File(["%PDF-1.4"], "a.pdf", { type: "application/pdf" }), true),
  );
  await validateUpload(new File(["%PDF-1.4"], "a.pdf", { type: "application/pdf" }));
  await validateUpload(
    new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], "a.png", { type: "image/png" }),
    true,
  );
});
