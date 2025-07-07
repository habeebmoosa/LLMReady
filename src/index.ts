import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { JSDOM } from "jsdom";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
    {
        name: "LLMReadyMCP",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

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

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "website-to-markdown",
                description: "Turn the website inot LLM Ready Markdown",
                inputSchema: {
                    type: "object",
                    properties: {
                        url: {
                            type: "string",
                            description: "This is the website url that will turn in LLM Ready Markdown"
                        }
                    },
                    required: ["url"]
                },
                annotations: {
                    title: "Get Website in Markdown"
                }
            }
        ]
    }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (!args) {
        throw new Error(`No arguments provided for tool: ${name}`);
    }

    switch (name) {
        case "website-to-markdown":
            return {
                content: [{
                    type: "text",
                    text: await extractTextFromUrl(args.url as any)
                }]
            }
        default:
            throw new Error("Tool not found");
    }
})

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("LLM Ready MCP Server is running!");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});