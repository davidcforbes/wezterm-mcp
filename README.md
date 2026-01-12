# WezTerm MCP Server

## Overview

This is a MCP server for WezTerm.
It allows you to control WezTerm from Claude Desktop and other MCP clients.

## ⚠️ Security Warning

**This MCP server provides unrestricted command execution with your user permissions.**

- Commands execute with your full account privileges
- No sandboxing or command restrictions
- Can read, write, or delete any accessible files
- Only use with trusted MCP clients
- Never expose over a network

**See [SECURITY.md](SECURITY.md) for comprehensive security documentation.**

## Installation

To use with Claude Desktop, add the server config:

```json
{
  "mcpServers": {
    "wezterm-mcp": {
      "command": "npx",
      "args": ["-y", "wezterm-mcp"]
    }
  }
}
```

To install WezTerm for Claude Desktop automatically via Smithery:

```bash
npx -y @smithery/cli install @hiraishikentaro/wezterm-mcp --client claude
```

[![smithery badge](https://smithery.ai/badge/@hiraishikentaro/wezterm-mcp)](https://smithery.ai/server/@hiraishikentaro/wezterm-mcp)
