import { auth, defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";
import projectInfoTool from "./tools/project-info";

const projectRef =
  import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "dukupambe",
  title: "Dukapambe",
  version: "0.1.0",
  instructions:
    "Tools for Dukapambe. Use `echo` to verify connectivity and `get_project_info` to learn about the project.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [echoTool, projectInfoTool],
});
