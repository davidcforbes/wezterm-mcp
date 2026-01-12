import { exec } from "child_process";
import { promisify } from "util";
import * as shellQuote from "shell-quote";

const execAsync = promisify(exec);

const DEFAULT_TIMEOUT_MS = 30000;
const MAX_OUTPUT_SIZE = 1024 * 1024; // 1MB
const DEFAULT_OUTPUT_LINES = 50;
const MAX_OUTPUT_LINES = 10000;

export default class WeztermOutputReader {
  private weztermCli: string;
  private timeoutMs: number;

  constructor(timeoutMs: number = DEFAULT_TIMEOUT_MS) {
    this.weztermCli = process.env.WEZTERM_CLI_PATH || "wezterm cli";
    this.timeoutMs = timeoutMs;
  }

  /**
   * Validates the lines parameter
   */
  private validateLines(lines: number): void {
    if (!Number.isInteger(lines)) {
      throw new Error(
        `Lines must be an integer, got: ${lines} (type: ${typeof lines})`
      );
    }

    if (lines > MAX_OUTPUT_LINES) {
      throw new Error(
        `Lines cannot exceed ${MAX_OUTPUT_LINES} (requested: ${lines})`
      );
    }
  }

  async readOutput(lines: number = DEFAULT_OUTPUT_LINES): Promise<{ content: any[] }> {
    try {
      // Validate input
      this.validateLines(lines);

      let args: string[];

      if (lines <= 0) {
        // Get all content (current screen only)
        args = [...this.weztermCli.split(" "), "get-text", "--escapes"];
      } else {
        // Get specified number of lines (from scrollback)
        const startLine = -lines;
        args = [
          ...this.weztermCli.split(" "),
          "get-text",
          "--escapes",
          "--start-line",
          startLine.toString(),
        ];
      }

      const escapedCommand = shellQuote.quote(args);

      const { stdout } = await execAsync(escapedCommand, {
        timeout: this.timeoutMs,
        maxBuffer: MAX_OUTPUT_SIZE,
      });

      return {
        content: [
          {
            type: "text",
            text: stdout || "(empty output)",
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to read terminal output: ${error.message}

Troubleshooting Steps:
1. Verify WezTerm is running and you have an active terminal session
2. Enable mux server in ~/.wezterm.lua:
   unix_domains = { { name = "unix" } }
   default_gui_startup_args = { "connect", "unix" }
3. Restart WezTerm after config changes
4. Test connectivity: run 'wezterm cli list' in terminal
   - Should list panes without error
   - If fails, mux server is not enabled
5. Check if requested lines (${lines}) exceeds available output
6. Verify WEZTERM_CLI_PATH environment variable if using custom path

For more help, see: https://wezfurlong.org/wezterm/cli/cli/index.html`,
          },
        ],
      };
    }
  }
}
