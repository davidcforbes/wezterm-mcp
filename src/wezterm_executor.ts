import { exec } from "child_process";
import { promisify } from "util";
import * as shellQuote from "shell-quote";
import { McpResponse, getErrorMessage } from "./types";

const execAsync = promisify(exec);

// Configuration constants
const DEFAULT_TIMEOUT_MS = 30000;
const MAX_OUTPUT_SIZE = 1024 * 1024; // 1MB

export default class WeztermExecutor {
  private weztermCli: string;
  private timeoutMs: number;

  constructor(timeoutMs: number = DEFAULT_TIMEOUT_MS) {
    this.weztermCli = process.env.WEZTERM_CLI_PATH || "wezterm cli";
    this.timeoutMs = timeoutMs;
  }

  /**
   * Validates that paneId is a valid positive integer
   */
  private validatePaneId(paneId: number): void {
    if (!Number.isInteger(paneId) || paneId < 0) {
      throw new Error(
        `Invalid pane ID: ${paneId}. Pane ID must be a non-negative integer.`
      );
    }
  }

  /**
   * Executes a command with timeout and output size limits
   */
  private async execWithLimits(
    command: string,
    timeoutMs?: number
  ): Promise<{ stdout: string; stderr: string }> {
    return execAsync(command, {
      timeout: timeoutMs || this.timeoutMs,
      maxBuffer: MAX_OUTPUT_SIZE,
    });
  }

  async writeToTerminal(command: string): Promise<McpResponse> {
    try {
      // Validate input
      if (typeof command !== "string") {
        throw new Error("Command must be a string");
      }

      // Use shell-quote for proper escaping
      const args = [
        ...this.weztermCli.split(" "),
        "send-text",
        "--no-paste",
        `${command}\n`,
      ];
      const escapedCommand = shellQuote.quote(args);

      await this.execWithLimits(escapedCommand);

      return {
        content: [
          {
            type: "text",
            text: `Command sent to WezTerm: ${command}`,
          },
        ],
      };
    } catch (error: unknown) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Failed to write to terminal: ${getErrorMessage(error)}

Troubleshooting Steps:
1. Verify WezTerm is running with an active terminal session
2. Enable mux server in ~/.wezterm.lua:
   unix_domains = { { name = "unix" } }
   default_gui_startup_args = { "connect", "unix" }
3. Restart WezTerm after config changes
4. Test connectivity: run 'wezterm cli list' in terminal
   - Should list panes without error
   - If fails, mux server is not enabled
5. Check if command is valid and not too long
6. Verify active pane exists and is responsive

For more help, see: https://wezfurlong.org/wezterm/cli/cli/send-text.html`,
          },
        ],
      };
    }
  }

  /**
   * Writes a command to a specific WezTerm pane by ID and executes it.
   * The command is automatically terminated with a newline character.
   *
   * @param command - The command string to send to the terminal
   * @param paneId - The ID of the target pane (non-negative integer)
   * @returns Promise resolving to MCP response with confirmation or error details
   * @throws Error if command is not a string or paneId is invalid
   *
   * @example
   * ```typescript
   * const executor = new WeztermExecutor();
   * const result = await executor.writeToSpecificPane("npm test", 2);
   * console.log(result.content[0].text); // "Command sent to pane 2: npm test"
   * ```
   */
  async writeToSpecificPane(
    command: string,
    paneId: number
  ): Promise<McpResponse> {
    try {
      // Validate inputs
      if (typeof command !== "string") {
        throw new Error("Command must be a string");
      }
      this.validatePaneId(paneId);

      // Use shell-quote for proper escaping
      const args = [
        ...this.weztermCli.split(" "),
        "send-text",
        "--pane-id",
        paneId.toString(),
        "--no-paste",
        `${command}\n`,
      ];
      const escapedCommand = shellQuote.quote(args);

      await this.execWithLimits(escapedCommand);

      return {
        content: [
          {
            type: "text",
            text: `Command sent to pane ${paneId}: ${command}`,
          },
        ],
      };
    } catch (error: unknown) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Failed to write to pane ${paneId}: ${getErrorMessage(error)}

Troubleshooting Steps:
1. Verify pane ${paneId} exists: use list_panes tool to see all pane IDs
2. Check if pane was closed or crashed
3. Ensure WezTerm is running with mux server enabled (see ~/.wezterm.lua)
4. Test connectivity: run 'wezterm cli list' in terminal
5. Verify pane ID is correct (non-negative integer)
6. Try switching to pane first: use switch_pane tool

Common causes:
- Pane was closed after getting its ID
- Typo in pane ID number
- Mux server not running

For more help, see: https://wezfurlong.org/wezterm/cli/cli/send-text.html`,
          },
        ],
      };
    }
  }

  /**
   * Lists all panes in the current WezTerm window.
   * Returns pane IDs, active status, titles, and other metadata.
   *
   * @returns Promise resolving to MCP response with pane listing or error details
   *
   * @example
   * ```typescript
   * const executor = new WeztermExecutor();
   * const result = await executor.listPanes();
   * console.log(result.content[0].text); // Outputs pane list from wezterm cli
   * ```
   */
  async listPanes(): Promise<{ content: any[]; isError?: boolean }> {
    try {
      const args = [...this.weztermCli.split(" "), "list"];
      const escapedCommand = shellQuote.quote(args);

      const { stdout } = await this.execWithLimits(escapedCommand);

      return {
        content: [
          {
            type: "text",
            text: stdout,
          },
        ],
      };
    } catch (error: unknown) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Failed to list panes: ${getErrorMessage(error)}

Troubleshooting Steps:
1. Verify WezTerm is running with at least one window open
2. Enable mux server in ~/.wezterm.lua:
   unix_domains = { { name = "unix" } }
   default_gui_startup_args = { "connect", "unix" }
3. Restart WezTerm after config changes
4. Test connectivity: run 'wezterm cli list' in terminal
   - Should show panes without error
   - If fails, mux server is not running
5. Check WezTerm version (must support CLI)
6. Verify WEZTERM_CLI_PATH if using custom installation

For more help, see: https://wezfurlong.org/wezterm/cli/cli/list.html`,
          },
        ],
      };
    }
  }

  /**
   * Switches focus to a specific WezTerm pane by ID.
   * Activates the target pane, making it the active pane for subsequent operations.
   *
   * @param paneId - The ID of the pane to switch to (non-negative integer)
   * @returns Promise resolving to MCP response with confirmation or error details
   * @throws Error if paneId is invalid
   *
   * @example
   * ```typescript
   * const executor = new WeztermExecutor();
   * const result = await executor.switchPane(2);
   * console.log(result.content[0].text); // "Switched to pane 2"
   * ```
   */
  async switchPane(paneId: number): Promise<{ content: any[]; isError?: boolean }> {
    try {
      // Validate input
      this.validatePaneId(paneId);

      const args = [
        ...this.weztermCli.split(" "),
        "activate-pane",
        "--pane-id",
        paneId.toString(),
      ];
      const escapedCommand = shellQuote.quote(args);

      await this.execWithLimits(escapedCommand);

      return {
        content: [
          {
            type: "text",
            text: `Switched to pane ${paneId}`,
          },
        ],
      };
    } catch (error: unknown) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Failed to switch pane: ${getErrorMessage(error)}

Troubleshooting Steps:
1. Verify pane ${paneId} exists: use list_panes tool to see all pane IDs
2. Check if pane was closed or moved to different window
3. Ensure pane ID is correct (non-negative integer, not a typo)
4. Verify WezTerm is running with mux server enabled
5. Test connectivity: run 'wezterm cli list' in terminal

Common causes:
- Pane ${paneId} was closed
- Wrong pane ID (check list_panes output)
- Mux server not running
- Pane in different WezTerm window

For more help, see: https://wezfurlong.org/wezterm/cli/cli/activate-pane.html`,
          },
        ],
      };
    }
  }
}
