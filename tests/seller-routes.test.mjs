import assert from "node:assert/strict";
import { after, test } from "node:test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
const server = await createServer({
  configFile: false,
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  server: { middlewareMode: true, hmr: false, watch: null },
});
after(() => server.close());
// Uses the application's real Supabase client with its actual absent session.
// No authenticated user, token, API response or authentication method is mocked.
const { guardSeller, friendlyError } = await server.ssrLoadModule("/src/lib/seller/service.ts");
const auth = await server.ssrLoadModule("/src/lib/auth/service.ts");
const avatar = await server.ssrLoadModule("/src/lib/auth/avatar.ts");
test("real unauthenticated route guards preserve Login continuation", async () => {
  for (const page of ["register", "status", "dashboard"])
    await assert.rejects(
      () => guardSeller(page),
      (error) =>
        error.status === 307 &&
        error.options.href === `/login?next=${encodeURIComponent(`/seller/${page}`)}`,
    );
});
test("both Seller CTAs point to registration and failures are friendly", async () => {
  const index = await readFile(new URL("../src/routes/index.tsx", import.meta.url), "utf8");
  assert.equal(index.match(/href="\/seller\/register"/g)?.length, 2);
  assert.match(
    friendlyError({ message: "duplicate key seller_stores_name_unique" }),
    /Store Name is already/,
  );
  assert.match(friendlyError(new Error("Failed to fetch")), /Connection interrupted/);
});

test("real absent-session guest guards and password updates fail safely", async () => {
  assert.equal(await auth.authenticatedUser(), null);
  assert.equal(await auth.guestDestination("/seller/register"), null);
  await assert.rejects(() => auth.updatePassword("a-strong-password"), /reset link has expired/);
});
test("Buyer avatar upload rejects oversize and unsupported content before storage", async () => {
  await assert.rejects(
    () =>
      avatar.uploadBuyerAvatar(
        new File(["x".repeat(2 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }),
      ),
    /2 MB/,
  );
  await assert.rejects(
    () => avatar.uploadBuyerAvatar(new File(["svg"], "a.svg", { type: "image/svg+xml" })),
    /PNG or JPEG/,
  );
});
