import { loadEnv } from "vite";
import { createClient } from "@supabase/supabase-js";
const env = { ...loadEnv("production", process.cwd(), ""), ...process.env };
const email = env.SUPABASE_TEST_BUYER_EMAIL,
  password = env.SUPABASE_TEST_BUYER_PASSWORD;
if (!email || !password) {
  console.log(
    JSON.stringify(
      {
        state: "BLOCKED",
        reason:
          "A designated, email-confirmed test Buyer account is required. Set SUPABASE_TEST_BUYER_EMAIL and SUPABASE_TEST_BUYER_PASSWORD in a secure shell environment. No account or email was created.",
      },
      null,
      2,
    ),
  );
  process.exit(2);
}
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.SUPABASE_PUBLISHABLE_KEY;
const url = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL;
if (!url || !key || key.startsWith("sb_secret_"))
  throw new Error("A configured public Supabase URL/key is required.");
function client() {
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
const primary = client(),
  recovered = client();
const results = [];
async function check(name, fn) {
  try {
    await fn();
    results.push({ test: name, state: "PASSED" });
  } catch (error) {
    results.push({ test: name, state: "FAILED", code: error.code ?? error.name ?? "ERROR" });
    throw error;
  }
}
let signedIn = false;
try {
  await check("Login with designated Buyer credentials", async () => {
    const r = await primary.auth.signInWithPassword({ email, password });
    if (r.error) throw r.error;
    if (!r.data.session) throw new Error("No authenticated session");
    signedIn = true;
  });
  await check("Auth server validates authenticated user", async () => {
    const r = await primary.auth.getUser();
    if (r.error) throw r.error;
    if (!r.data.user?.email_confirmed_at) throw new Error("Email is not confirmed");
  });
  const {
    data: { session },
  } = await primary.auth.getSession();
  await check("Session recovery in a second real Supabase client", async () => {
    const r = await recovered.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    if (r.error) throw r.error;
    const verified = await recovered.auth.getUser();
    if (verified.error) throw verified.error;
    if (verified.data.user?.id !== session.user.id) throw new Error("User mismatch");
  });
  await check("Own profile and Buyer role relationship", async () => {
    const r = await primary
      .from("profiles")
      .select("id,role,status")
      .eq("id", session.user.id)
      .single();
    if (r.error) throw r.error;
    if (!["BUYER", "SELLER"].includes(r.data.role))
      throw new Error("Not a Buyer/Seller test account");
    const b = await primary
      .from("buyer_profiles")
      .select("user_id")
      .eq("user_id", session.user.id)
      .single();
    if (b.error) throw b.error;
  });
  await check("Logout revokes the test session and clears client state", async () => {
    const r = await primary.auth.signOut({ scope: "local" });
    if (r.error) throw r.error;
    signedIn = false;
    const state = await primary.auth.getSession();
    if (state.data.session) throw new Error("Session was not cleared");
  });
} catch {
  /* Sanitized failure details are recorded above; never print credentials/tokens. */
} finally {
  if (signedIn) await primary.auth.signOut({ scope: "local" });
  await recovered.auth.signOut({ scope: "local" });
}
console.log(
  JSON.stringify(
    {
      state:
        results.length === 5 && results.every((r) => r.state === "PASSED")
          ? "READY_FOR_BROWSER_TESTS"
          : "BLOCKED",
      results,
      notCovered: [
        "Signup/inbox verification",
        "Password reset/inbox delivery",
        "Actual browser persistence/refresh",
        "Seller business fields/documents/submission/approval",
        "Cross-account production RLS",
      ],
    },
    null,
    2,
  ),
);
if (results.length !== 5 || results.some((r) => r.state === "FAILED")) process.exitCode = 1;
