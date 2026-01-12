#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import WeztermExecutor from "./wezterm_executor.js";
import WeztermOutputReader from "./wezterm_output_reader.js";
import SendControlCharacter from "./send_control_character.js";

const server = new Server(
  {
    name: "wezterm-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "write_to_terminal",
        description:
          "Writes text to the active WezTerm pane - often used to run commands. WARNING: This executes commands with your user permissions. Only use with trusted input.",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description:
                "The command to run or text to write to the terminal",
            },
          },
          required: ["command"],
        },
      },
      {
        name: "read_terminal_output",
        description: "Reads output from the active WezTerm pane",
        inputSchema: {
          type: "object",
          properties: {
            lines: {
              type: "number",
              description:
                "Number of lines to read from the terminal (default: 50, max: 10000). Use 0 or negative to get all current screen content.",
            },
          },
        },
      },
      {
        name: "send_control_character",
        description:
          "Sends control characters to the active WezTerm pane. Supported: a,b,c,d,e,f,g,k,l,n,p,q,r,s,t,u,v,w,x,y,z",
        inputSchema: {
          type: "object",
          properties: {
            character: {
              type: "string",
              description:
                "Control character to send (e.g., 'c' for Ctrl+C, 'r' for Ctrl+R)",
            },
          },
          required: ["character"],
        },
      },
      {
        name: "list_panes",
        description: "Lists all panes in the current WezTerm window",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "switch_pane",
        description: "Switches to a specific pane in WezTerm",
        inputSchema: {
          type: "object",
          properties: {
            pane_id: {
              type: "number",
              description: "ID of the pane to switch to (must be a non-negative integer)",
            },
          },
          required: ["pane_id"],
        },
      },
      {
        name: "write_to_specific_pane",
        description:
          "Writes text to a specific WezTerm pane by pane ID. WARNING: This executes commands with your user permissions. Only use with trusted input.",
        inputSchema: {
          type: "object",
          properties: {
            command: {
              type: "string",
              description:
                "The command to run or text to write to the terminal",
            },
            pane_id: {
              type: "number",
              description: "ID of the pane to write to (must be a non-negative integer)",
            },
          },
          required: ["command", "pane_id"],
        },
      },
    ],
  };
});

/**
 * Validates that request has valid arguments object
 */
function validateRequest(request: any): void {
  if (!request || !request.params) {
    throw new Error("Invalid request: missing params");
  }
  if (!request.params.name) {
    throw new Error("Invalid request: missing tool name");
  }
  // arguments can be undefined for tools that don't require them
}

// Tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  try {
    // Validate request structure
    validateRequest(request);

    const executor = new WeztermExecutor();
    const outputReader = new WeztermOutputReader();
    const controlCharSender = new SendControlCharacter();

    const args = request.params.arguments || {};

    switch (request.params.name) {
      case "write_to_terminal":
        if (typeof args.command !== "string") {
          throw new Error("command must be a string");
        }
        return await executor.writeToTerminal(args.command);

      case "read_terminal_output":
        const lines = args.lines !== undefined ? Number(args.lines) : 50;
        if (isNaN(lines)) {
          throw new Error("lines must be a number");
        }
        return await outputReader.readOutput(lines);

      case "send_control_character":
        if (typeof args.character !== "string") {
          throw new Error("character must be a string");
        }
        return await controlCharSender.send(args.character);

      case "list_panes":
        return await executor.listPanes();

      case "switch_pane":
        if (typeof args.pane_id !== "number") {
          throw new Error("pane_id must be a number");
        }
        return await executor.switchPane(args.pane_id);

      case "write_to_specific_pane":
        if (typeof args.command !== "string") {
          throw new Error("command must be a string");
        }
        if (typeof args.pane_id !== "number") {
          throw new Error("pane_id must be a number");
        }
        return await executor.writeToSpecificPane(args.command, args.pane_id);

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error: any) {
    // Return errors in content format for consistency
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
