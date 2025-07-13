import { type Tool } from "@modelcontextprotocol/sdk/types.js";

const EXTRACT_WEBSITE_DATA: Tool = {
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

const GET_GITHUB_FILE_CODE: Tool = {
    name: "get-github-file-code",
    description: "Fetch the code of a file from a provided GitHub file URL.",
    inputSchema: {
        type: "object",
        properties: {
            github_url: {
                type: "string",
                description: "The full GitHub URL to the file whose code you want to fetch."
            }
        },
        required: ["github_url"]
    },
    annotations: {
        title: "Get GitHub File Code"
    }
}

const FLEXIBLE_API_REQUEST: Tool = {
    name: "flexible-api-request",
    description: "Make a flexible API request (GET, POST, etc.) with support for custom headers, JSON body, and optional auth.",
    inputSchema: {
        type: "object",
        properties: {
            url: {
                type: "string",
                description: "The API endpoint URL to request."
            },
            method: {
                type: "string",
                description: "HTTP method (GET, POST, PUT, DELETE, etc.). Defaults to GET.",
                default: "GET"
            },
            headers: {
                type: "object",
                description: "Custom headers as key-value pairs (optional).",
                additionalProperties: { type: "string" },
                nullable: true
            },
            body: {
                type: "object",
                description: "JSON body to send with the request (for POST, PUT, etc.). Optional.",
                nullable: true
            },
            auth: {
                type: "object",
                description: "Authentication info (optional). Supports 'bearer' token.",
                properties: {
                    bearer: { type: "string", description: "Bearer token for Authorization header." }
                },
                required: [],
                nullable: true
            }
        },
        required: ["url"]
    },
    annotations: {
        title: "Flexible API Request (JSON Only)"
    }
}

const tools = [
    EXTRACT_WEBSITE_DATA,
    GET_GITHUB_FILE_CODE,
    FLEXIBLE_API_REQUEST
]

export default tools;