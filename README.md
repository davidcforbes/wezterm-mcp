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

## Prerequisites

Before using this MCP server, ensure:

1. **WezTerm is installed**: Download from [wezfurlong.org/wezterm](https://wezfurlong.org/wezterm/)
2. **WezTerm is running**: Launch WezTerm terminal
3. **Mux server is enabled**: Add to your `~/.wezterm.lua`:

```lua
return {
  -- Enable the multiplexer server
  unix_domains = {
    {
      name = "unix",
    },
  },
  -- Default to the mux domain
  default_gui_startup_args = { "connect", "unix" },
}
```

4. **Verify connectivity**: Run `wezterm cli list` in terminal - should list panes without error

## Environment Variables

### WEZTERM_CLI_PATH

By default, this MCP server uses `wezterm cli` to communicate with WezTerm. If you have WezTerm installed in a non-standard location or need to use a specific version, you can configure the CLI path using the `WEZTERM_CLI_PATH` environment variable.

**Usage**:

```json
{
  "mcpServers": {
    "wezterm-mcp": {
      "command": "npx",
      "args": ["-y", "wezterm-mcp"],
      "env": {
        "WEZTERM_CLI_PATH": "/custom/path/to/wezterm cli"
      }
    }
  }
}
```

**Examples**:

- **Custom installation path**: `"WEZTERM_CLI_PATH": "/opt/wezterm/bin/wezterm cli"`
- **Specific version**: `"WEZTERM_CLI_PATH": "/usr/local/wezterm-20231231/bin/wezterm cli"`
- **Windows custom path**: `"WEZTERM_CLI_PATH": "C:\\Program Files\\WezTerm\\wezterm.exe cli"`

If not set, defaults to `wezterm cli` (requires wezterm in PATH).

## Available Tools

### write_to_terminal

Writes text or commands to the active WezTerm pane.

```typescript
// Example: Run a shell command
{
  name: "write_to_terminal",
  arguments: {
    command: "ls -la"
  }
}
```

**Security**: Executes with your user permissions. Only use with trusted input.

### read_terminal_output

Reads output from the active WezTerm pane.

```typescript
// Example: Read last 100 lines
{
  name: "read_terminal_output",
  arguments: {
    lines: 100  // default: 50, max: 10000, 0 or negative: all screen content
  }
}
```

**Limits**: Max 10,000 lines, 1MB output size

### send_control_character

Sends control characters (Ctrl+C, Ctrl+D, etc.) to the active pane.

```typescript
// Example: Send Ctrl+C to interrupt process
{
  name: "send_control_character",
  arguments: {
    character: "c"  // for Ctrl+C
  }
}
```

**Supported characters**: a, b, c, d, e, f, g, k, l, n, p, q, r, s, t, u, v, w, x, y, z

Common controls:
- `c`: Ctrl+C (interrupt/cancel)
- `d`: Ctrl+D (EOF/exit)
- `z`: Ctrl+Z (suspend)
- `l`: Ctrl+L (clear screen)
- `r`: Ctrl+R (reverse search)

### list_panes

Lists all panes in the current WezTerm window.

```typescript
{
  name: "list_panes",
  arguments: {}
}
```

Returns pane IDs, active status, and titles.

### switch_pane

Switches focus to a specific pane.

```typescript
// Example: Switch to pane 2
{
  name: "switch_pane",
  arguments: {
    pane_id: 2
  }
}
```

### write_to_specific_pane

Writes text to a specific pane by ID.

```typescript
// Example: Send command to pane 2
{
  name: "write_to_specific_pane",
  arguments: {
    command: "npm test",
    pane_id: 2
  }
}
```

## Troubleshooting

### "Failed to write to terminal" or "WezTerm not available"

**Cause**: Cannot connect to WezTerm mux server

**Solutions**:
1. Verify WezTerm is running
2. Check mux server is enabled in `~/.wezterm.lua` (see Prerequisites)
3. Test with `wezterm cli list` - should work without errors
4. Restart WezTerm after config changes
5. Check `wezterm cli list-clients` to verify server is running

### "Pane not found" or "Invalid pane ID"

**Cause**: Pane ID doesn't exist or is invalid

**Solutions**:
1. Run `list_panes` to get current pane IDs
2. Verify pane still exists (not closed)
3. Ensure pane_id is a non-negative integer
4. Use `switch_pane` before writing to ensure pane is active

### "Lines must be an integer" or "Lines cannot exceed 10000"

**Cause**: Invalid line count parameter

**Solutions**:
1. Use integer values for `lines` parameter
2. Keep lines ≤ 10,000 (use 0 for all screen content)
3. Omit parameter to use default (50 lines)

### "Unknown control character"

**Cause**: Unsupported control character requested

**Solutions**:
1. See supported characters list above
2. Use lowercase letters (a-z except h, i, j, m, o)
3. Common controls: c (cancel), d (exit), l (clear)

### Command execution timeout

**Cause**: Command took longer than 30 seconds

**Solutions**:
1. Use shorter-running commands
2. Run long commands in background (with `&`)
3. Monitor output with `read_terminal_output`

## Development

### Setup

```bash
# Clone repository
git clone https://github.com/hiraishikentaro/wezterm-mcp.git
cd wezterm-mcp

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

### Project Structure

```
wezterm-mcp/
├── src/
│   ├── index.ts                  # MCP server and tool handlers
│   ├── wezterm_executor.ts       # Command execution and pane control
│   ├── wezterm_output_reader.ts  # Terminal output reading
│   └── send_control_character.ts # Control character sending
├── tests/
│   ├── wezterm_executor.test.ts
│   ├── wezterm_output_reader.test.ts
│   ├── send_control_character.test.ts
│   └── integration.test.ts
├── SECURITY.md                   # Security documentation
└── README.md                     # This file
```

### Architecture

```
MCP Client (Claude Desktop)
    ↓
MCP Server (index.ts)
    ↓
Tool Handlers (validate arguments)
    ↓
WezTerm Classes (execute via wezterm cli)
    ↓
WezTerm Mux Server
    ↓
Terminal Panes
```

**Security Layer**: All commands escaped using `shell-quote` library to prevent injection attacks.

### Running Tests

```bash
# All tests
npm test

# Specific test file
npm test tests/wezterm_executor.test.ts

# With coverage
npm test -- --coverage
```

All 49 tests must pass before merging changes.

## Limitations

- **No authentication**: Any MCP client can execute commands
- **No audit logging**: Commands are not recorded
- **No command whitelist**: All commands allowed (with escaping)
- **No rate limiting**: Clients can execute commands rapidly
- **Local only**: Not designed for network exposure
- **WezTerm dependency**: Requires WezTerm with mux server enabled

## Known Issues

- TypeScript/Jest warning about hybrid module kind (harmless, safe to ignore)
- CRLF line ending warnings on Windows (handled by git)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass (`npm test`)
6. Commit changes (`git commit -m 'Add amazing feature'`)
7. Push to branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Contribution Guidelines

- Follow existing code style (TypeScript, ESM modules)
- Add tests for all new features
- Update documentation (README, SECURITY.md)
- Run `npm test` before committing
- Write clear commit messages
- One feature per pull request

## Security

See [SECURITY.md](SECURITY.md) for:
- Threat model and trust boundaries
- Security risks and mitigations
- Best practices for users and developers
- Vulnerability reporting process

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with [Model Context Protocol](https://modelcontextprotocol.io/)
- Powered by [WezTerm](https://wezfurlong.org/wezterm/)
- Uses [shell-quote](https://github.com/substack/node-shell-quote) for secure command escaping

## Links

- [GitHub Repository](https://github.com/hiraishikentaro/wezterm-mcp)
- [WezTerm Documentation](https://wezfurlong.org/wezterm/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Smithery Registry](https://smithery.ai/server/@hiraishikentaro/wezterm-mcp)
