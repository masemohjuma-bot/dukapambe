import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "get_project_info",
  title: "Get project info",
  description: "Return the Dukapambe project name and a short welcome message.",
  inputSchema: {},
  outputSchema: {
    message: z.string().describe("A short project description."),
  },
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
    structuredContent: {
      message: "Dukapambe — project initialized and reachable via MCP.",
    },
  }),
});

