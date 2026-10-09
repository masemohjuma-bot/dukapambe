import assert from "node:assert/strict";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

// Load the actual routes and Supabase client with no authenticated session.
// These checks do not simulate successful authentication or create accounts.
const server = await createServer({
  configFile: false,
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  server: { middlewareMode: true, hmr: false, watch: null },
});
after(() => server.close());
const auth = await server.ssrLoadModule("/src/lib/auth/service.ts");
const login = await server.ssrLoadModule("/src/routes/login.tsx");
const signup = await server.ssrLoadModule("/src/routes/signup.tsx");

test("a guest can reach both actual account routes without a landing redirect", async () => {
  assert.equal(await auth.authenticatedUser(), null);
  for (const route of [login.Route, signup.Route])
    assert.equal(await route.options.beforeLoad({ search: { next: "/" } }), undefined);
});

test("an absent session does not produce a guest-route redirect", async () => {
  assert.equal(await auth.guestDestination("/seller/register"), null);
});

test("recovery fails explicitly when there is no real session", async () => {
  await assert.rejects(() => auth.updatePassword("unused-password"), /reset link has expired/);
  assert.equal(
    auth.authError(new Error("Failed to fetch")),
    "Connection interrupted. Reconnect and try again.",
  );
});
