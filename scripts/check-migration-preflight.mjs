import { readFile, readdir } from "node:fs/promises";
const names = (await readdir("supabase/migrations"))
  .filter((n) => /^\d{14}_.*\.sql$/.test(n))
  .sort();
const evidenceFlag = process.argv.indexOf("--evidence");
if (evidenceFlag !== -1 && !process.argv[evidenceFlag + 1])
  throw new Error("--evidence requires a JSON file path.");
const evidencePath =
  evidenceFlag === -1 ? "docs/PHASE_2A4_PUBLIC_EVIDENCE.json" : process.argv[evidenceFlag + 1];
const evidence = JSON.parse(await readFile(evidencePath, "utf8"));
const collisions = [
  "seller_stores",
  "seller_applications",
  "seller_preferences",
  "seller_notifications",
].filter((name) =>
  evidence.results.some(
    (r) => r.endpoint.startsWith(`/rest/v1/${name}?`) && (r.status === 200 || r.code === "42501"),
  ),
);
console.log(
  JSON.stringify(
    {
      state: "BLOCKED",
      evidenceFile: evidencePath,
      evidenceCheckedAt: evidence.checkedAt,
      migrationFiles: names,
      appliedMigrations: "UNVERIFIED — privileged migration history required",
      collisions,
      action:
        "Run supabase/verification/phase_2a4_inventory.sql against the linked project. Reconcile existing application/store/preferences/notification schemas and migration history before db push. Do not repair migration history or create parallel tables blindly.",
    },
    null,
    2,
  ),
);
// This command is intentionally a failing release gate until privileged review.
process.exitCode = 1;
