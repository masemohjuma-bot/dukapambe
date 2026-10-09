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
  if (
    typeof next !== "string" ||
    !next.startsWith("/") ||
    next.startsWith("//") ||
    Array.from(next).some((character) => character.charCodeAt(0) < 32)
  )
    return "/";
  try {
    const url = new URL(next, origin);
    if (
      url.origin !== origin ||
      authGuestPaths.has(
        decodeURIComponent(url.pathname).replace(/\/+/g, "/").replace(/\/$/, "").toLowerCase(),
      ) ||
      /%25|%2f|%5c|\\/i.test(url.pathname)
    )
      return "/";
    return url.pathname + url.search;
  } catch {
    return "/";
  }
}
// The callback owns session recovery; re-running other guards during it can
// interrupt a one-use verification code. Auth forms and protected Seller pages
// must otherwise respond to logout, token refresh and account changes.
export function shouldRecheckAuthRoutes(event: string, pathname: string): boolean {
  return (
    ["SIGNED_IN", "SIGNED_OUT", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event) &&
    [
      "/login",
      "/signup",
      "/reset-password",
      "/seller/register",
      "/seller/status",
      "/seller/dashboard",
    ].includes(pathname.replace(/\/+/g, "/").replace(/\/$/, "").toLowerCase())
  );
}
export function authCallbackUrl(next: string, origin: string, recovery = false) {
  return `${origin}/auth/callback?next=${encodeURIComponent(safeNext(next, origin))}${recovery ? "&type=recovery" : ""}`;
}
