import { loadEnv } from "vite";
import { readFile, writeFile } from "node:fs/promises";
const env = { ...loadEnv("production", process.cwd(), ""), ...process.env };
const project = (await readFile("supabase/config.toml", "utf8")).match(
  /project_id\s*=\s*"([^"]+)"/,
)?.[1];
const url = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL;
const key =
  env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.SUPABASE_PUBLISHABLE_KEY ?? env.SUPABASE_ANON_KEY;
const configuration = {
  project,
  urlPresent: !!url,
  keyPresent: !!key,
  matchingUrlAliases:
    !env.SUPABASE_URL || !env.VITE_SUPABASE_URL || env.SUPABASE_URL === env.VITE_SUPABASE_URL,
  matchingKeyAliases:
    !env.SUPABASE_PUBLISHABLE_KEY ||
    !env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY === env.VITE_SUPABASE_PUBLISHABLE_KEY,
};
if (!url || !key) throw new Error("Supabase URL and public key are required.");
const origin = new URL(url).origin;
configuration.projectHostMatches = origin === `https://${project}.supabase.co`;
if (!configuration.projectHostMatches)
  throw new Error("Configured URL differs from the linked project. Review before testing.");
if (key.startsWith("sb_secret_"))
  throw new Error("A secret key must never be used as the browser key.");
if (!key.startsWith("sb_publishable_")) {
  try {
    const claims = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString());
    configuration.keyRole = claims.role;
    if (claims.role !== "anon") throw new Error("NOT_PUBLIC");
  } catch {
    throw new Error("Configured browser key is not a recognized public/anon key.");
  }
}
const headers = {
  apikey: key,
  ...(!key.startsWith("sb_publishable_") ? { Authorization: `Bearer ${key}` } : {}),
};
async function probe(path) {
  try {
    const response = await fetch(origin + path, { headers, signal: AbortSignal.timeout(15000) });
    const body = await response.json().catch(() => null);
    return { endpoint: path, status: response.status, body };
  } catch (error) {
    return { endpoint: path, error: error.name, cause: error.cause?.code ?? null };
  }
}
const tables = [
  "profiles",
  "buyer_profiles",
  "seller_profiles",
  "seller_stores",
  "seller_onboarding",
  "seller_documents",
  "seller_status_history",
  "seller_preferences",
  "seller_notifications",
  "seller_verification",
  "stores",
  "seller_applications",
  "notifications",
  "user_roles",
];
const results = await Promise.all(
  [
    "/auth/v1/health",
    "/auth/v1/settings",
    "/storage/v1/bucket",
    ...tables.map((t) => `/rest/v1/${t}?select=*&limit=0`),
  ].map(probe),
);
const settings = results.find((r) => r.endpoint === "/auth/v1/settings");
const report = {
  checkedAt: new Date().toISOString(),
  scope:
    "Publishable-key requests only; no users created, emails sent, objects uploaded, migrations applied, or admin configuration changed.",
  configuration,
  auth:
    settings?.status === 200
      ? {
          status: 200,
          emailProvider: settings.body?.external?.email,
          signupEnabled: settings.body?.disable_signup === false,
          emailConfirmationRequired: settings.body?.mailer_autoconfirm === false,
        }
      : { status: settings?.status ?? null, error: settings?.error ?? null },
  results: results.map((r) => ({
    endpoint: r.endpoint,
    status: r.status ?? null,
    error: r.error ?? null,
    code: r.body?.code ?? r.body?.error ?? null,
    ...(r.endpoint === "/storage/v1/bucket"
      ? {
          visibleBuckets: Array.isArray(r.body) ? r.body.map((b) => b.id) : null,
          note: "Anonymous visibility is not an administrative bucket inventory.",
        }
      : {}),
  })),
  unverified: [
    "Migration history",
    "Database catalog/RLS/indexes/constraints/triggers",
    "Complete bucket configuration and ownership policies",
    "Site URL and redirect allowlist",
    "SMTP deliverability",
    "Authenticated and email-inbox end-to-end flows",
  ],
};
if (process.argv.includes("--write"))
  await writeFile("docs/PHASE_2A4_PUBLIC_EVIDENCE.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
if (
  report.auth.status !== 200 ||
  !configuration.matchingUrlAliases ||
  !configuration.matchingKeyAliases
)
  process.exitCode = 1;
