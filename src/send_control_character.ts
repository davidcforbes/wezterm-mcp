import { exec } from "child_process";
import { promisify } from "util";
import * as shellQuote from "shell-quote";

const execAsync = promisify(exec);

const DEFAULT_TIMEOUT_MS = 30000;
const MAX_OUTPUT_SIZE = 1024 * 1024; // 1MB

export default class SendControlCharacter {
  private weztermCli: string;
  private timeoutMs: number;

  constructor(timeoutMs: number = DEFAULT_TIMEOUT_MS) {
    this.weztermCli = process.env.WEZTERM_CLI_PATH || "wezterm cli";
    this.timeoutMs = timeoutMs;
  }

  /**
   * Extended control character map supporting more common control sequences
   */
  private readonly controlMap: { [key: string]: string } = {
    c: "\x03", // Ctrl+C (SIGINT)
    d: "\x04", // Ctrl+D (EOF)
    z: "\x1a", // Ctrl+Z (SIGTSTP)
    l: "\x0c", // Ctrl+L (Clear screen)
    a: "\x01", // Ctrl+A (Beginning of line)
    e: "\x05", // Ctrl+E (End of line)
    k: "\x0b", // Ctrl+K (Kill to end of line)
    u: "\x15", // Ctrl+U (Kill to beginning of line)
    w: "\x17", // Ctrl+W (Kill word)
    r: "\x12", // Ctrl+R (Reverse search)
    p: "\x10", // Ctrl+P (Previous command)
    n: "\x0e", // Ctrl+N (Next command)
    b: "\x02", // Ctrl+B (Back one character)
    f: "\x06", // Ctrl+F (Forward one character)
    t: "\x14", // Ctrl+T (Transpose)
    g: "\x07", // Ctrl+G (Cancel/Bell)
    v: "\x16", // Ctrl+V (Literal insert)
    y: "\x19", // Ctrl+Y (Yank)
    s: "\x13", // Ctrl+S (Freeze terminal)
    q: "\x11", // Ctrl+Q (Unfreeze terminal)
    x: "\x18", // Ctrl+X
  };

  /**
   * Validates control character input
   */
  private validateCharacter(character: string): void {
    if (typeof character !== "string" || character.length === 0) {
      throw new Error("Character must be a non-empty string");
    }

    const char = character.toLowerCase();
    if (!this.controlMap[char]) {
      const supported = Object.keys(this.controlMap).sort().join(", ");
      throw new Error(
        `Unknown control character: ${character}. Supported: ${supported}`
      );
    }
  }

  async send(character: string): Promise<{ content: any[] }> {
    try {
      // Validate input
      this.validateCharacter(character);

      const controlSeq = this.controlMap[character.toLowerCase()];

      // Use shell-quote for safe command construction (cross-platform)
      const args = [
        ...this.weztermCli.split(" "),
        "send-text",
        controlSeq,
      ];
      const escapedCommand = shellQuote.quote(args);

      await execAsync(escapedCommand, {
        timeout: this.timeoutMs,
        maxBuffer: MAX_OUTPUT_SIZE,
      });

      return {
        content: [
          {
            type: "text",
            text: `Sent control character: Ctrl+${character.toUpperCase()}`,
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to send control character: ${error.message}\n\nTroubleshooting:\n- Make sure WezTerm is running\n- Verify the mux server is enabled\n- Run 'wezterm cli list' to test connectivity`,
          },
        ],
      };
    }
  }
}
