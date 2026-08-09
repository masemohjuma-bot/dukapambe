import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "get_project_info",
  title: "Get project info",
  description: "Return the Dukapambe project name and a short welcome message.",
  inputSchema: {},
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: () => ({
    content: [
      {
        type: "text",
        text: "Dukapambe — project initialized and reachable via MCP.",
      },
    ],
  }),
});
