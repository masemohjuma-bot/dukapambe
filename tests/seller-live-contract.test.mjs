import assert from "node:assert/strict";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
const server = await createServer({
  configFile: false,
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  server: { middlewareMode: true, hmr: false, watch: null },
});
after(() => server.close());
const contract = await server.ssrLoadModule("/src/lib/seller/live-contract.ts");
const model = await server.ssrLoadModule("/src/lib/seller/model.ts");
const service = await server.ssrLoadModule("/src/lib/seller/service.ts");
test("the adapter converts the verified flat schema and one-based steps", () => {
  const result = contract.fromLive({
    id: "application",
    user_id: "buyer",
    status: "DRAFT",
    updated_at: "2026-10-09T00:00:00Z",
    completed_steps: [1, 2],
    submitted_at: null,
    owner_full_name: "Owner",
    bank_account_name: "Account",
    business_hours: { schedule: "Mon–Fri" },
    shipping_regions: ["Mombasa", "Kwale"],
    delivery_options: ["Delivery", "Pickup"],
    pickup_available: true,
  });
  assert.deepEqual(result.completed_steps, [0, 1]);
  assert.equal(result.data[1].owner_name, "Owner");
  assert.equal(result.data[3].account_name, "Account");
  assert.equal(result.data[4].business_hours, "Mon–Fri");
  assert.equal(result.data[4].delivery_options, "Delivery and pickup");
  assert.equal(result.revision, "2026-10-09T00:00:00Z");
});
test("step writes use real live columns without ownership or approval fields", () => {
  const patch = contract.stepPatch(1, {
    owner_name: "Owner",
    national_id: "test-number",
    phone: "0700000000",
    date_of_birth: "",
  });
  assert.equal(patch.owner_full_name, "Owner");
  assert.equal(patch.owner_identity_number, "test-number");
  assert.equal(patch.owner_date_of_birth, null);
  assert.equal(patch.user_id, undefined);
  assert.equal(patch.status, undefined);
  assert.throws(() => contract.stepPatch(0, { years_in_business: "201" }), /0 to 200/);
});
test("artwork and company certificate are required by the live submission guard", () => {
  assert.ok(model.validateStep(4, [], []).includes("Store logo is required."));
  assert.ok(
    model
      .validateStep(2, [{ business_type: "Limited Company" }], [])
      .includes("Company Registration Certificate is required."),
  );
  assert.equal(contract.liveDocumentTypes.company_registration, "COMPANY_REGISTRATION_CERTIFICATE");
});
test("roles and restrictions route through the existing application status", () => {
  assert.equal(model.sellerDestination("SUBMITTED", "ACTIVE"), "/seller/status");
  assert.equal(model.sellerDestination("APPROVED", "ACTIVE"), "/seller/dashboard");
  assert.equal(model.sellerDestination("APPROVED", "SUSPENDED"), "/seller/status");
  assert.equal(model.sellerDestination("REJECTED", "ACTIVE"), "/seller/register");
});
test("real absent-session guard preserves Seller intent for every protected route", async () => {
  for (const page of ["register", "status", "dashboard"])
    await assert.rejects(
      () => service.guardSeller(page),
      (error) => error.options.href === `/login?next=${encodeURIComponent(`/seller/${page}`)}`,
    );
});
