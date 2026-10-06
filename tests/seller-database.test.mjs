import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";
const a = "11111111-1111-4111-8111-111111111111",
  b = "22222222-2222-4222-8222-222222222222";
const db = new PGlite();
await db.exec(await readFile(new URL("./seller-baseline.sql", import.meta.url), "utf8"));
await db.exec(
  await readFile(
    new URL("../supabase/migrations/20261006110000_seller_onboarding.sql", import.meta.url),
    "utf8",
  ),
);
await db.exec(
  `INSERT INTO profiles(id) VALUES('${a}'),('${b}');INSERT INTO buyer_profiles(user_id) VALUES('${a}'),('${b}');`,
);
async function asUser(id) {
  await db.exec(
    `RESET ROLE;SELECT set_config('test.user_id','${id ?? ""}',false);SET ROLE ${id ? "authenticated" : "anon"};`,
  );
}
async function rpc(name, args = []) {
  return (
    await db.query(
      `SELECT to_jsonb(public.${name}(${args.map((_, i) => `$${i + 1}`).join(",")})) AS result`,
      args,
    )
  ).rows[0].result;
}
async function app() {
  return (await db.query("SELECT * FROM seller_onboarding")).rows[0];
}
const data = [
  {
    business_name: "Coast business",
    business_type: "Sole proprietor",
    business_category: "Fashion",
    country: "Kenya",
    region: "Mombasa",
    district: "Mvita",
    physical_address: "Coast road",
    business_description: "Fashion shop",
    years_in_business: "4",
    business_email: "buyer@example.com",
    business_phone: "+254712345678",
    registration_number: "LICENSE-ONE",
  },
  {
    owner_name: "Owner",
    nationality: "Kenyan",
    national_id: "ID-ONE",
    date_of_birth: "1990-01-01",
    gender: "Female",
    phone: "+254712345678",
    email: "buyer@example.com",
    residential_address: "Coast",
  },
  {},
  {
    preferred_payment_method: "Bank",
    bank_name: "Bank",
    account_name: "Owner",
    account_number: "123456",
    branch: "Coast",
  },
  {
    store_name: "Coast shop",
    store_slug: "coast-shop",
    store_description: "Fashion",
    business_hours: "Mon-Fri 9-5",
    delivery_options: "Delivery",
    pickup_available: "No",
    shipping_regions: "Mombasa",
  },
];
async function save(i, values = data[i], complete = true) {
  return rpc("seller_save_step", [i, JSON.stringify(values), (await app()).revision, complete]);
}
async function doc(kind, path = `${a}/${kind}/document.pdf`) {
  await db.query(
    'INSERT INTO storage.objects(bucket_id,name,metadata) VALUES(\'seller-documents\',$1,\'{"mimetype":"application/pdf","size":12}\')',
    [path],
  );
  await rpc("seller_set_document", [
    kind,
    "seller-documents",
    path,
    "document.pdf",
    "application/pdf",
    12,
  ]);
  return path;
}
test("migration compiles; anonymous and cross-account access fail", async () => {
  await asUser(null);
  await assert.rejects(() => rpc("seller_start"));
  await asUser(a);
  await rpc("seller_start");
  assert.equal((await app()).user_id, a);
  await asUser(b);
  assert.equal((await db.query("SELECT * FROM seller_onboarding")).rows.length, 0);
  await assert.rejects(() => rpc("seller_save_step", [0, JSON.stringify(data[0]), 0, true]));
  await asUser(a);
});
test("required-step validation, autosave, resume and stale-revision checks", async () => {
  await assert.rejects(() => save(1));
  await save(0, { business_name: "Partial" }, false);
  assert.equal((await app()).data[0].business_name, "Partial");
  await assert.rejects(() => save(0, { business_name: "Partial" }, true));
  await save(0);
  await assert.rejects(() => rpc("seller_save_step", [0, JSON.stringify(data[0]), 0, true]));
  await rpc("seller_start");
  assert.equal((await app()).data[0].registration_number, "LICENSE-ONE");
  await save(1);
  await assert.rejects(() => save(2));
});
test("document ownership, immutable uploads, required files and replacement", async () => {
  await assert.rejects(() => doc("national_id", `${b}/national_id/wrong.pdf`));
  const path = await doc("business_license");
  await doc("national_id");
  await doc("proof_of_address");
  assert.equal(
    (
      await db.query("UPDATE storage.objects SET name=$1 WHERE name=$2 RETURNING *", [
        `${a}/modified.pdf`,
        path,
      ])
    ).rows.length,
    0,
  );
  assert.equal(
    (await db.query("DELETE FROM storage.objects WHERE name=$1 RETURNING *", [path])).rows.length,
    0,
  );
  await asUser(b);
  assert.equal((await db.query("SELECT * FROM storage.objects")).rows.length, 0);
  await assert.rejects(() =>
    db.query("INSERT INTO storage.objects(bucket_id,name) VALUES('seller-documents',$1)", [
      `${a}/bad.pdf`,
    ]),
  );
  await asUser(null);
  assert.equal((await db.query("SELECT * FROM storage.objects")).rows.length, 0);
  await asUser(a);
  await rpc("seller_set_document", ["business_license", null, null, null, null, null]);
  assert.equal(
    (await db.query("DELETE FROM storage.objects WHERE name=$1 RETURNING *", [path])).rows.length,
    1,
  );
  await assert.rejects(() => save(2));
  await doc("business_license", `${a}/business_license/replacement.pdf`);
  await save(2);
});
test("submission is atomic, requires agreement, locks edits and creates store", async () => {
  await save(3);
  await save(4);
  await assert.rejects(async () => rpc("seller_submit", [(await app()).revision, false, true]));
  const submitted = await rpc("seller_submit", [(await app()).revision, true, true]);
  assert.ok(submitted.submitted_at);
  assert.equal(submitted.completed_steps.length, 6);
  assert.equal((await db.query("SELECT * FROM seller_stores")).rows.length, 1);
  await assert.rejects(() => save(0));
  await assert.rejects(() => rpc("seller_activate"));
  assert.equal((await db.query("SELECT * FROM seller_preferences")).rows.length, 0);
});
test("external rejection allows resubmission; duplicate registration/store roll back", async () => {
  await db.exec(
    `RESET ROLE;SELECT set_config('test.user_id','',false);UPDATE seller_profiles SET application_status='REJECTED' WHERE user_id='${a}';`,
  );
  await asUser(a);
  await save(0);
  await rpc("seller_submit", [(await app()).revision, true, true]);
  await asUser(b);
  await rpc("seller_start");
  for (let i = 0; i < 5; i++) {
    if (i === 2)
      for (const kind of ["business_license", "national_id", "proof_of_address"])
        await doc(kind, `${b}/${kind}/document.pdf`);
    await save(i);
  }
  await assert.rejects(
    async () => rpc("seller_submit", [(await app()).revision, true, true]),
    /seller_registration_unique/,
  );
  const independent = { ...data[0], registration_number: "LICENSE-TWO" };
  await save(0, independent);
  await assert.rejects(
    async () => rpc("seller_submit", [(await app()).revision, true, true]),
    /seller_stores_name_unique/,
  );
  await save(4, { ...data[4], store_name: "Different store", store_slug: "coast-shop" });
  await assert.rejects(
    async () => rpc("seller_submit", [(await app()).revision, true, true]),
    /seller_stores_slug_unique/,
  );
  await save(4, { ...data[4], store_name: "Different store", store_slug: "different-store" });
  await rpc("seller_submit", [(await app()).revision, true, true]);
});
test("approval provisions real roles once; suspension blocks seller access", async () => {
  await db.exec(
    `RESET ROLE;SELECT set_config('test.user_id','',false);UPDATE seller_profiles SET application_status='APPROVED' WHERE user_id='${a}';`,
  );
  assert.equal(
    (await db.query("SELECT role FROM profiles WHERE id=$1", [a])).rows[0].role,
    "SELLER",
  );
  await asUser(a);
  assert.equal(await rpc("seller_is_approved", [a]), true);
  await rpc("seller_activate");
  await rpc("seller_activate");
  assert.equal((await db.query("SELECT * FROM seller_notifications")).rows.length, 1);
  assert.equal((await db.query("SELECT * FROM seller_preferences")).rows.length, 1);
  await db.exec(
    `RESET ROLE;SELECT set_config('test.user_id','',false);UPDATE seller_profiles SET application_status='SUSPENDED' WHERE user_id='${a}';`,
  );
  await asUser(a);
  assert.equal(await rpc("seller_is_approved", [a]), false);
  assert.equal((await db.query("SELECT * FROM seller_notifications")).rows.length, 0);
  await assert.rejects(() => rpc("seller_activate"));
  await assert.rejects(() => save(0));
  await db.close();
});
