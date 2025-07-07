import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { JSDOM } from "jsdom";

const server = new McpServer({
    name: "LLMReadyMCP",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
    },
})

async function extractTextFromUrl(url: string): Promise<string> {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const dom = new JSDOM(html);
        return dom.window.document.body.textContent || "";
    } catch (error) {
        console.error("Error extracting text from URL:", error);
        return "";
    }
}

server.tool(
    "website-to-markdown",
    "Turn the website inot LLM Ready Markdown",
    {
        url: z.string().url().describe("This is the website url that will turn in LLM Ready Markdown")
    },
    async ({ url }) => {
        try {
            const textContent = await extractTextFromUrl(url);
            return {
                content: [{
                    type: "text",
                    text: textContent
                }]
            }
        } catch (error) {
            return {
                content: [{
                    type: "text", text: `Error getting LLM ready markdown: ${error}`
                }]
            }
        }
    }
)

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("LLM Ready MCP Server is running!");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});