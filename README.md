# LLM Ready MCP

A simple MCP (Model Context Protocol) server that makes LLMs ready for new things by exposing tools to convert websites and documents into LLM-ready Markdown.

## Features

- **website-to-markdown**: Converts any website by using URL into markdown for LLM consumption.
- Easily integrates with any MCP-compatible client.

## Usage

```json
{
  "mcpServers": {
    "LLMReadyMCP" : {
        "command": "npx",
        "args": ["@llmready/mcp@latest"]
    }
  }
}
```

## Links
- [GitHub](https://github.com/habeebmoosa/LLMReady)
- [Report Issues](https://github.com/habeebmoosa/LLMReady/issues)

## License

MIT © Habeeb Moosa