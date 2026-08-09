import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "echo",
  title: "Echo",
  description: "Echo the input text back to the caller to verify connectivity.",
  inputSchema: {
    text: z.string().min(1).describe("Text to echo back."),
  },
  outputSchema: {
    echoed: z.string().describe("The echoed text."),
  },
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: ({ text }) => ({
    content: [{ type: "text", text }],
    structuredContent: { echoed: text },
  }),
});


