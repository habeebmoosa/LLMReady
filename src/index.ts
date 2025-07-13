#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import tools from "./tools.js";
import { getGithubFileCode, flexibleApiRequest } from "./services/apiFetch.js";
import { extractTextFromUrl } from "./services/getWebData.js";

const server = new Server(
    {
        name: "LLMReadyMCP",
        version: "1.0.1",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools
}))

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
        case "get-github-file-code":
            return {
                content: [{
                    type: "text",
                    text: await getGithubFileCode(args.github_url as string)
                }]
            }
        case "flexible-api-request":
            return {
                content: [{
                    type: "text",
                    text: await flexibleApiRequest({
                        url: args.url as string,
                        method: args.method as string | undefined,
                        headers: args.headers as Record<string, string> | undefined,
                        body: args.body as object | undefined,
                        auth: args.auth as { bearer?: string } | undefined
                    })
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