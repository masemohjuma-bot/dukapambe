import { test } from "node:test";
import assert from "node:assert/strict";
import { safeNext, authCallbackUrl } from "../src/lib/auth/navigation.ts";
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
