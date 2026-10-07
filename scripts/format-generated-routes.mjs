// Lovable regenerates these transport routes during a build. Normalize their
// formatting afterwards so a successful build does not break the lint gate.
import { readFile, writeFile } from "node:fs/promises";
import { format, resolveConfig } from "prettier";

for (const path of [
  "src/routes/mcp.ts",
  "src/routes/[.mcp]/invoke-tool/$tool.ts",
  "src/routes/[.mcp]/list-tools.ts",
  "src/routes/[.well-known]/oauth-protected-resource.ts",
]) {
  const source = await readFile(path, "utf8");
  const options = await resolveConfig(path);
  await writeFile(path, await format(source, { ...options, filepath: path }));
}
