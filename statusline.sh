#!/usr/bin/env bash
# WezTerm MCP Statusline Script
# This script provides terminal context for Claude Code's statusline
# Configure in .claude/settings.json:
# {
#   "statusLine": {
#     "type": "command",
#     "command": "/path/to/statusline.sh"
#   }
# }

# Read JSON input from stdin (provided by Claude Code)
input=$(cat)

# Extract relevant fields from JSON using jq if available
if command -v jq &> /dev/null; then
    model=$(echo "$input" | jq -r '.model.display_name // "Unknown"')
    current_dir=$(echo "$input" | jq -r '.workspace.current_dir // "Unknown"')
else
    # Fallback: basic extraction without jq
    model="Claude"
    current_dir=$(pwd)
fi

# Get WezTerm information
pane_info="Unknown"
if command -v wezterm &> /dev/null; then
    # Get active pane info from WezTerm
    active_pane=$(wezterm cli list 2>/dev/null | grep '(active)' | head -n1)
    if [ -n "$active_pane" ]; then
        pane_id=$(echo "$active_pane" | awk '{print $1}')
        pane_info="Pane $pane_id"
    fi
fi

# Build statusline with ANSI colors
# Format: [Model] | Dir: /path | Pane: ID
printf "\033[1;36m⚡ %s\033[0m | \033[1;33m📁 %s\033[0m | \033[1;32m🖥️  %s\033[0m" "$model" "$current_dir" "$pane_info"
