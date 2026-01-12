import { exec } from "child_process";
import { promisify } from "util";
import * as shellQuote from "shell-quote";

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

  async writeToTerminal(command: string): Promise<{ content: any[] }> {
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
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to write to terminal: ${error.message}\n\nTroubleshooting:\n- Make sure WezTerm is running\n- Verify the mux server is enabled in your WezTerm config\n- Run 'wezterm cli list' to test CLI connectivity`,
          },
        ],
      };
    }
  }

  async writeToSpecificPane(
    command: string,
    paneId: number
  ): Promise<{ content: any[] }> {
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
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to write to pane ${paneId}: ${error.message}\n\nTroubleshooting:\n- Verify pane ${paneId} exists (use list_panes tool)\n- Make sure WezTerm is running and mux server is enabled`,
          },
        ],
      };
    }
  }

  async listPanes(): Promise<{ content: any[] }> {
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
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to list panes: ${error.message}\n\nTroubleshooting:\n- Make sure WezTerm is running\n- Verify the mux server is enabled in your WezTerm config\n- Run 'wezterm cli list' manually to test`,
          },
        ],
      };
    }
  }

  async switchPane(paneId: number): Promise<{ content: any[] }> {
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
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to switch pane: ${error.message}\n\nTroubleshooting:\n- Verify pane ${paneId} exists (use list_panes tool)\n- Check for typos in pane ID`,
          },
        ],
      };
    }
  }
}
