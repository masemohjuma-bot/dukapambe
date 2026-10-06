const authGuestPaths = new Set([
  "/login",
  "/signup",
  "/auth/callback",
  "/forgot-password",
  "/reset-password",
  "/logout",
]);
// Prevent external redirects and self-referential guest/protected-route loops.
export function safeNext(next: unknown, origin: string): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) return "/";
  try {
    const url = new URL(next, origin);
    if (
      url.origin !== origin ||
      authGuestPaths.has(decodeURIComponent(url.pathname).replace(/\/$/, ""))
    )
      return "/";
    return url.pathname + url.search;
  } catch {
    return "/";
  }
}
export function authCallbackUrl(next: string, origin: string, recovery = false) {
  return `${origin}/auth/callback?next=${encodeURIComponent(safeNext(next, origin))}${recovery ? "&type=recovery" : ""}`;
}
