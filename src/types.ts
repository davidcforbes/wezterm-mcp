/**
 * Type definitions for WezTerm MCP Server
 */

/**
 * Represents a content item in an MCP response.
 * Content items are always text-based in this MCP server.
 */
export interface ContentItem {
  type: "text";
  text: string;
}

/**
 * Standard response format for all MCP tool operations.
 * Contains content array and optional error flag.
 */
export interface McpResponse {
  content: ContentItem[];
  isError?: boolean;
}

/**
 * Type guard to check if an error is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Safely extracts error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return String(error);
}
