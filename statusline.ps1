# WezTerm MCP Statusline Script (PowerShell)
# This script provides terminal context for Claude Code's statusline
# Configure in .claude/settings.json:
# {
#   "statusLine": {
#     "type": "command",
#     "command": "powershell.exe -NoProfile -File C:\\path\\to\\statusline.ps1"
#   }
# }

# Read JSON input from stdin (provided by Claude Code)
$input = [Console]::In.ReadToEnd()

# Parse JSON
try {
    $json = $input | ConvertFrom-Json
    $model = if ($json.model.display_name) { $json.model.display_name } else { "Claude" }
    $currentDir = if ($json.workspace.current_dir) { $json.workspace.current_dir } else { (Get-Location).Path }
} catch {
    $model = "Claude"
    $currentDir = (Get-Location).Path
}

# Get WezTerm information
$paneInfo = "Unknown"
try {
    $weztermPath = if ($env:WEZTERM_CLI_PATH) { $env:WEZTERM_CLI_PATH -replace ' cli$','' } else { "wezterm" }
    $panes = & $weztermPath cli list 2>$null
    $activePaneLine = $panes | Select-String '\(active\)' | Select-Object -First 1
    if ($activePaneLine) {
        $paneId = ($activePaneLine -split '\s+')[0]
        $paneInfo = "Pane $paneId"
    }
} catch {
    # WezTerm not available or error occurred
}

# Build statusline with ANSI colors
# Format: [Model] | Dir: C:\path | Pane: ID
$esc = [char]27
Write-Host -NoNewline "$esc[1;36m⚡ $model$esc[0m | $esc[1;33m📁 $currentDir$esc[0m | $esc[1;32m🖥️  $paneInfo$esc[0m"
