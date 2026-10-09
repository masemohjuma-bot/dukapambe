import { supabase } from "@/integrations/supabase/client";
import { authCallbackUrl, safeNext } from "./navigation";
export function authError(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "Unable to complete this request. Please try again.";
  if (/fetch|network/i.test(message)) return "Connection interrupted. Reconnect and try again.";
  return message;
}
export async function requestPasswordReset(email: string, next: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: authCallbackUrl(next, window.location.origin, true),
  });
  if (error) throw error;
}
export async function updatePassword(password: string) {
  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!data.session)
    throw new Error("This reset link has expired. Request a new password reset email.");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
export async function completeAuthCallback() {
  const url = new URL(window.location.href);
  const next = safeNext(url.searchParams.get("next"), url.origin);
  const fragment = new URLSearchParams(url.hash.slice(1));
  const type = url.searchParams.get("type") ?? fragment.get("type");
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const callbackError =
    url.searchParams.get("error_description") ?? fragment.get("error_description");
  try {
    if (callbackError) throw new Error(callbackError);
    // The existing client may already consume a PKCE code during initialization.
    const initial = await supabase.auth.getSession();
    if (initial.error) throw initial.error;
    if (code && new URL(window.location.href).searchParams.has("code")) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } else if (tokenHash) {
      if (type !== "email" && type !== "signup" && type !== "recovery")
        throw new Error("Unsupported verification link. Please request a new email.");
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (error) throw error;
    }
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session)
      throw new Error("This verification link is invalid or expired. Request a new email.");
    // Validate the recovered/confirmed session with the Auth server.
    const { error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    return type === "recovery" ? `/reset-password?next=${encodeURIComponent(next)}` : next;
  } finally {
    window.history.replaceState({}, "", `${url.pathname}?next=${encodeURIComponent(next)}`);
  }
}
export async function loadAccount() {
  const user = await authenticatedUser();
  if (!user) return null;
  const result = await supabase
    .from("profiles")
    .select("id,role,status")
    .eq("id", user.id)
    .single();
  if (result.error) throw result.error;
  return result.data;
}

export async function authenticatedUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session) return null;
  const verified = await supabase.auth.getUser();
  if (verified.error) {
    if (
      verified.error.status === 401 ||
      verified.error.status === 403 ||
      verified.error.code === "session_not_found" ||
      verified.error.name === "AuthSessionMissingError"
    ) {
      const cleared = await supabase.auth.signOut({ scope: "local" });
      if (cleared.error) throw cleared.error;
      return null;
    }
    throw verified.error;
  }
  return verified.data.user;
}

export async function guestDestination(next: unknown) {
  return (await authenticatedUser()) ? safeNext(next, window.location.origin) : null;
}

export async function signIn(email: string, password: string) {
  const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (result.error) throw result.error;
  if (!result.data.session || !(await authenticatedUser()))
    throw new Error("Sign in did not establish a session. Please try again.");
}
