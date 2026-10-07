import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const a = "11111111-1111-4111-8111-111111111111",
  b = "22222222-2222-4222-8222-222222222222";
const baseline = await readFile(new URL("./seller-baseline.sql", import.meta.url), "utf8");
const onboarding = await readFile(
  new URL("../supabase/migrations/20261006110000_seller_onboarding.sql", import.meta.url),
  "utf8",
);
const integration = await readFile(
  new URL("../supabase/migrations/20261006175100_backend_integration.sql", import.meta.url),
  "utf8",
);
const db = new PGlite();
await db.exec(baseline);
await db.exec(onboarding);
await db.exec(integration);
await db.exec(
  `INSERT INTO profiles(id) VALUES('${a}'),('${b}');INSERT INTO buyer_profiles(user_id) VALUES('${a}'),('${b}');INSERT INTO seller_profiles(user_id) VALUES('${a}');INSERT INTO seller_onboarding(user_id) VALUES('${a}');`,
);
async function asUser(id) {
  await db.exec(
    `RESET ROLE;SELECT set_config('test.user_id','${id ?? ""}',false);SET ROLE ${id ? "authenticated" : "anon"};`,
  );
}
test("canonical buckets are defined without removing legacy artwork buckets", async () => {
  const buckets = (await db.query("SELECT * FROM storage.buckets")).rows;
  for (const name of [
    "buyer-profile-images",
    "seller-documents",
    "seller-logos",
    "seller-banners",
    "product-images",
    "category-images",
    "brand-assets",
    "store-logos",
    "store-banners",
  ])
    assert.ok(buckets.some((b) => b.id === name));
  assert.equal(buckets.find((b) => b.id === "buyer-profile-images").file_size_limit, 2097152);
  for (const name of ["buyer-profile-images", "seller-documents", "seller-logos", "seller-banners"])
    assert.equal(buckets.find((b) => b.id === name).public, false);
});
test("canonical seller artwork is private, owned and supports existing metadata service", async () => {
  await asUser(a);
  const path = `${a}/logo/a.png`;
  await db.query(
    'INSERT INTO storage.objects(bucket_id,name,metadata) VALUES(\'seller-logos\',$1,\'{"mimetype":"image/png","size":8}\')',
    [path],
  );
  await db.query("SELECT seller_set_document('logo','seller-logos',$1,'a.png','image/png',8)", [
    path,
  ]);
  assert.equal(
    (await db.query("SELECT bucket FROM seller_documents")).rows[0].bucket,
    "seller-logos",
  );
  await asUser(b);
  assert.equal(
    (await db.query("SELECT * FROM storage.objects WHERE bucket_id='seller-logos'")).rows.length,
    0,
  );
  await asUser(null);
  assert.equal(
    (await db.query("SELECT * FROM storage.objects WHERE bucket_id='seller-logos'")).rows.length,
    0,
  );
});
test("buyer avatar ownership blocks foreign paths and unauthorized readers", async () => {
  await asUser(a);
  await db.query(
    'INSERT INTO storage.objects(bucket_id,name,metadata) VALUES(\'buyer-profile-images\',$1,\'{"mimetype":"image/png","size":8}\')',
    [`${a}/avatar.png`],
  );
  await db.query("UPDATE buyer_profiles SET avatar_path=$1 WHERE user_id=$2", [
    `${a}/avatar.png`,
    a,
  ]);
  await assert.rejects(
    () =>
      db.query("UPDATE buyer_profiles SET avatar_path=$1 WHERE user_id=$2", [`${b}/avatar.png`, a]),
    /buyer_avatar_ownership/,
  );
  assert.equal(
    (
      await db.query(
        "DELETE FROM storage.objects WHERE bucket_id='buyer-profile-images' RETURNING *",
      )
    ).rows.length,
    0,
  );
  await asUser(b);
  assert.equal(
    (await db.query("SELECT * FROM storage.objects WHERE bucket_id='buyer-profile-images'")).rows
      .length,
    0,
  );
  await assert.rejects(() =>
    db.query("INSERT INTO storage.objects(bucket_id,name) VALUES('buyer-profile-images',$1)", [
      `${a}/bad.png`,
    ]),
  );
  await asUser(null);
  assert.equal(
    (await db.query("SELECT * FROM storage.objects WHERE bucket_id='buyer-profile-images'")).rows
      .length,
    0,
  );
});
test("unapproved Buyers cannot upload product/category/brand images despite broad old policy", async () => {
  await asUser(a);
  for (const bucket of ["product-images", "category-images", "brand-assets"])
    await assert.rejects(() =>
      db.query("INSERT INTO storage.objects(bucket_id,name) VALUES($1,$2)", [
        bucket,
        `${a}/forbidden.png`,
      ]),
    );
});
test("canonical artwork replacement releases the old object and blocks overwrite", async () => {
  await asUser(a);
  const oldPath = `${a}/logo/a.png`,
    newPath = `${a}/logo/replacement.png`;
  await db.query(
    "INSERT INTO storage.objects(bucket_id,name,metadata) VALUES('seller-logos',$1,$2)",
    [newPath, JSON.stringify({ mimetype: "image/png", size: 8 })],
  );
  assert.equal(
    (
      await db.query(
        "DELETE FROM storage.objects WHERE bucket_id='seller-logos' AND name=$1 RETURNING *",
        [oldPath],
      )
    ).rows.length,
    0,
  );
  await db.query("SELECT seller_set_document('logo','seller-logos',$1,'new.png','image/png',8)", [
    newPath,
  ]);
  assert.equal(
    (
      await db.query(
        "DELETE FROM storage.objects WHERE bucket_id='seller-logos' AND name=$1 RETURNING *",
        [oldPath],
      )
    ).rows.length,
    1,
  );
  assert.equal(
    (
      await db.query(
        "UPDATE storage.objects SET name=$1 WHERE bucket_id='seller-logos' AND name=$2 RETURNING *",
        [`${a}/logo/overwrite.png`, newPath],
      )
    ).rows.length,
    0,
  );
  await db.query("SELECT seller_set_document('logo',NULL,NULL,NULL,NULL,NULL)");
  assert.equal(
    (
      await db.query(
        "DELETE FROM storage.objects WHERE bucket_id='seller-logos' AND name=$1 RETURNING *",
        [newPath],
      )
    ).rows.length,
    1,
  );
});
test("Buyer avatar replacement releases only the previous owned object", async () => {
  await asUser(a);
  const path = `${a}/avatar-new.png`;
  await db.query(
    "INSERT INTO storage.objects(bucket_id,name,metadata) VALUES('buyer-profile-images',$1,$2)",
    [path, JSON.stringify({ mimetype: "image/png", size: 8 })],
  );
  await db.query("UPDATE buyer_profiles SET avatar_path=$1 WHERE user_id=$2", [path, a]);
  assert.equal(
    (
      await db.query(
        "DELETE FROM storage.objects WHERE bucket_id='buyer-profile-images' AND name=$1 RETURNING *",
        [`${a}/avatar.png`],
      )
    ).rows.length,
    1,
  );
  assert.equal(
    (
      await db.query(
        "DELETE FROM storage.objects WHERE bucket_id='buyer-profile-images' AND name=$1 RETURNING *",
        [path],
      )
    ).rows.length,
    0,
  );
  await db.query("UPDATE buyer_profiles SET avatar_path=NULL WHERE user_id=$1", [a]);
  assert.equal(
    (
      await db.query(
        "DELETE FROM storage.objects WHERE bucket_id='buyer-profile-images' AND name=$1 RETURNING *",
        [path],
      )
    ).rows.length,
    1,
  );
});
test("status history records transitions and is owner readable only", async () => {
  await db.exec(
    `RESET ROLE;SELECT set_config('test.user_id','',false);UPDATE seller_profiles SET application_status='REJECTED' WHERE user_id='${a}';`,
  );
  await asUser(a);
  const history = (await db.query("SELECT * FROM seller_status_history ORDER BY changed_at")).rows;
  assert.equal(history[0].to_status, "DRAFT");
  assert.equal(history.at(-1).to_status, "REJECTED");
  await asUser(b);
  assert.equal((await db.query("SELECT * FROM seller_status_history")).rows.length, 0);
  await assert.rejects(() =>
    db.query("INSERT INTO seller_status_history(user_id,to_status) VALUES($1,'APPROVED')", [b]),
  );
  await db.close();
});
test("live schema collision preflight aborts before any onboarding objects are created", async () => {
  const isolated = new PGlite();
  await isolated.exec(baseline);
  await isolated.exec("CREATE TABLE seller_applications(id uuid PRIMARY KEY);");
  await assert.rejects(() => isolated.exec(onboarding), /Existing seller_applications detected/);
  assert.equal(
    (await isolated.query("SELECT to_regclass('public.seller_onboarding') AS table_name")).rows[0]
      .table_name,
    null,
  );
  await isolated.close();
});
