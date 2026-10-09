import { test } from "node:test";
import assert from "node:assert/strict";
import { safeNext, authCallbackUrl, shouldRecheckAuthRoutes } from "../src/lib/auth/navigation.ts";
const origin = "https://dukapambe.example";
test("auth redirects preserve Seller continuation and block external targets", () => {
  assert.equal(safeNext("/seller/register", origin), "/seller/register");
  for (const input of [
    "https://evil.example",
    "//evil.example",
    "javascript:alert(1)",
    null,
    "/login?next=/seller/register",
    "/signup",
    "/auth/callback",
    "/reset-password",
  ])
    assert.equal(safeNext(input, origin), "/");
  assert.equal(safeNext("/seller/status?next=x", origin), "/seller/status?next=x");
});
test("encoded and repeated slash auth targets cannot cause guest-route loops", () => {
  for (const target of [
    "/login//",
    "/signup///",
    "/auth//callback",
    "/%6cogin",
    "/%2flogin",
    "/%256cogin",
    "/reset-password///",
    "/seller%2fregister",
    "/%5clogin",
    "/LOGIN",
    "/%4cOGIN",
    "/SIGNUP///",
    "/Auth/Callback",
  ])
    assert.equal(safeNext(target, origin), "/");
  assert.equal(
    safeNext("/seller/register?next=%2Flogin", origin),
    "/seller/register?next=%2Flogin",
  );
});
test("session changes recheck protected/guest routes without interrupting callbacks", () => {
  for (const event of ["SIGNED_IN", "SIGNED_OUT", "TOKEN_REFRESHED", "USER_UPDATED"])
    for (const path of [
      "/login",
      "/signup",
      "/reset-password",
      "/seller/register",
      "/seller/status",
      "/seller/dashboard",
    ])
      assert.equal(shouldRecheckAuthRoutes(event, path), true);
  for (const path of ["/", "/auth/callback", "/forgot-password"])
    assert.equal(shouldRecheckAuthRoutes("SIGNED_OUT", path), false);
  assert.equal(shouldRecheckAuthRoutes("INITIAL_SESSION", "/login"), false);
  assert.equal(shouldRecheckAuthRoutes("SIGNED_OUT", "/SELLER/STATUS/"), true);
  assert.equal(shouldRecheckAuthRoutes("SIGNED_IN", "/LOGIN"), true);
});
test("verification and recovery callbacks preserve the safe continuation", () => {
  assert.equal(
    authCallbackUrl("/seller/register", origin),
    origin + "/auth/callback?next=%2Fseller%2Fregister",
  );
  assert.equal(
    authCallbackUrl("/seller/register", origin, true),
    origin + "/auth/callback?next=%2Fseller%2Fregister&type=recovery",
  );
});
