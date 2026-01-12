# Setup Instructions for Testing WezTerm MCP in Claude Code

## ✅ Step 1: Build Complete

The MCP server has been built successfully. Build output is in `./build/`

## Step 2: Configure Claude Code

**Configuration File Location:**
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Option A: Copy Sample Config**
A sample configuration has been created at `claude_code_config_sample.json`.

1. Open your Claude Code config file
2. Copy the contents from `claude_code_config_sample.json`
3. Merge it into your existing config (or create new if it doesn't exist)

**Option B: Add Manually**
Add this to your Claude Code configuration:

```json
{
  "mcpServers": {
    "wezterm-local": {
      "command": "node",
      "args": ["C:\\Development\\wezterm-mcp\\build\\index.js"],
      "env": {
        "WEZTERM_CLI_PATH": "wezterm cli"
      }
    }
  }
}
```

**For Mac/Linux:** Use forward slashes:
```json
"args": ["/path/to/wezterm-mcp/build/index.js"]
```

## Step 3: Configure WezTerm

**A sample WezTerm config has been created at `wezterm_config_sample.lua`.**

1. **Locate your WezTerm config:**
   - `~/.wezterm.lua` (create if it doesn't exist)

2. **Copy the sample config:**
   ```bash
   cp wezterm_config_sample.lua ~/.wezterm.lua
   ```

   Or merge it with your existing config if you already have one.

3. **Verify the configuration** enables:
   - `unix_domains` with name "unix"
   - `default_gui_startup_args` set to connect to unix domain

## Step 4: Restart WezTerm

After updating `~/.wezterm.lua`:
1. Close all WezTerm windows
2. Reopen WezTerm
3. **Test the mux server:**
   ```bash
   wezterm cli list
   ```
   Should show your panes without errors.

## Step 5: Restart Claude Code

**Completely close and reopen Claude Code** for it to load the new MCP server.

## Step 6: Test the MCP Server

Once Claude Code restarts with WezTerm running, try these commands:

1. **List panes:**
   "List my WezTerm panes"

2. **Send a command:**
   "Run 'echo Hello from Claude Code' in my terminal"

3. **Read output:**
   "Show me the last 20 lines from my terminal"

4. **Send control characters:**
   "Send Ctrl+L to clear the screen"

## Troubleshooting

### MCP Server Not Loading

1. **Check Claude Code logs:**
   - Open Developer Tools in Claude Code
   - Look for MCP server errors

2. **Verify build:**
   ```bash
   node C:\Development\wezterm-mcp\build\index.js
   ```
   Should start the server (press Ctrl+C to exit)

3. **Check config file syntax:**
   - Make sure JSON is valid (no trailing commas)
   - Use proper path separators for your OS

### WezTerm Connection Issues

1. **Test CLI access:**
   ```bash
   wezterm cli list
   ```
   If this fails, the mux server isn't running.

2. **Check WezTerm config:**
   ```bash
   cat ~/.wezterm.lua
   ```
   Verify it has the unix_domains configuration.

3. **Restart WezTerm completely**
   - Kill all WezTerm processes
   - Start fresh

### Permission Errors

**Windows:** Make sure Node.js can execute the script:
```powershell
node C:\Development\wezterm-mcp\build\index.js
```

**Mac/Linux:** Verify the script is executable:
```bash
chmod +x ~/path/to/wezterm-mcp/build/index.js
```

## Available MCP Tools

Once loaded, Claude Code will have these tools:

- `write_to_terminal` - Execute commands in active pane
- `read_terminal_output` - Read terminal output (up to 10,000 lines)
- `send_control_character` - Send Ctrl+C, Ctrl+D, etc.
- `list_panes` - List all terminal panes
- `switch_pane` - Switch focus between panes
- `write_to_specific_pane` - Send commands to specific pane by ID

## Security Warning

⚠️ This MCP server provides **unrestricted command execution** with your user permissions:
- Commands execute with your full account privileges
- No sandboxing or command restrictions
- Can read, write, or delete any accessible files
- Only use with trusted MCP clients

See `SECURITY.md` for comprehensive security documentation.

## Next Steps

After successful testing:
1. Try executing some commands
2. Test pane switching
3. Try reading output from long-running commands
4. Test control characters (Ctrl+C to interrupt)

For issues or questions, see the main `README.md` or open an issue on GitHub.
