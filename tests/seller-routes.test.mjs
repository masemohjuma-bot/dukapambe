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
