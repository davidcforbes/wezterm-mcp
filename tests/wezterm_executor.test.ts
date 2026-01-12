import { exec } from "child_process";
import { promisify } from "util";

// Mock modules
jest.mock("child_process");

let mockExecAsync: jest.Mock;
jest.mock("util", () => {
  const actualUtil = jest.requireActual<typeof import("util")>("util");
  mockExecAsync = jest.fn();
  return {
    ...actualUtil,
    promisify: jest.fn().mockReturnValue(mockExecAsync),
  };
});

import WeztermExecutor from "../src/wezterm_executor";

describe("WeztermExecutor", () => {
  let executor: WeztermExecutor;

  beforeEach(() => {
    jest.clearAllMocks();
    executor = new WeztermExecutor();
  });

  describe("writeToTerminal", () => {
    it("should successfully send command", async () => {
      mockExecAsync.mockResolvedValue({ stdout: "", stderr: "" });

      const result = await executor.writeToTerminal('echo "hello"');

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain(
        'Command sent to WezTerm: echo "hello"'
      );
      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          timeout: expect.any(Number),
          maxBuffer: expect.any(Number),
        })
      );
    });

    it("should properly escape special characters", async () => {
      mockExecAsync.mockResolvedValue({ stdout: "", stderr: "" });

      const result = await executor.writeToTerminal("echo 'hello world'");

      expect(result.content).toHaveLength(1);
      expect(mockExecAsync).toHaveBeenCalled();
    });

    it("should return error message on failure", async () => {
      mockExecAsync.mockRejectedValue(new Error("WezTerm not running"));

      const result = await executor.writeToTerminal('echo "hello"');

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("Failed to write to terminal");
      expect(result.content[0].text).toContain("WezTerm not running");
    });

    it("should throw error for non-string command", async () => {
      const result = await executor.writeToTerminal(123 as any);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain("Command must be a string");
    });
  });

  describe("writeToSpecificPane", () => {
    it("should send command to specific pane", async () => {
      mockExecAsync.mockResolvedValue({ stdout: "", stderr: "" });

      const result = await executor.writeToSpecificPane("ls -la", 123);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe("Command sent to pane 123: ls -la");
    });

    it("should return error message on pane error", async () => {
      mockExecAsync.mockRejectedValue(new Error("Pane not found"));

      const result = await executor.writeToSpecificPane("ls", 999);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("Failed to write to pane 999");
      expect(result.content[0].text).toContain("Pane not found");
    });

    it("should validate pane_id is non-negative integer", async () => {
      const result = await executor.writeToSpecificPane("ls", -1);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain("Invalid pane ID: -1");
    });
  });

  describe("listPanes", () => {
    it("should successfully list panes", async () => {
      const mockPaneList = `pane_id=1 active=true title="Terminal"
pane_id=2 active=false title="Editor"`;

      mockExecAsync.mockResolvedValue({ stdout: mockPaneList, stderr: "" });

      const result = await executor.listPanes();

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe(mockPaneList);
    });

    it("should return error message on list failure", async () => {
      mockExecAsync.mockRejectedValue(new Error("Connection failed"));

      const result = await executor.listPanes();

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("Failed to list panes");
      expect(result.content[0].text).toContain("Connection failed");
    });
  });

  describe("switchPane", () => {
    it("should switch to specified pane", async () => {
      mockExecAsync.mockResolvedValue({ stdout: "", stderr: "" });

      const result = await executor.switchPane(42);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe("Switched to pane 42");
    });

    it("should return error for non-existent pane", async () => {
      mockExecAsync.mockRejectedValue(new Error("Pane does not exist"));

      const result = await executor.switchPane(999);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain("Failed to switch pane");
      expect(result.content[0].text).toContain("Pane does not exist");
    });

    it("should validate pane_id is non-negative integer", async () => {
      const result = await executor.switchPane(-5);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain("Invalid pane ID: -5");
    });
  });
});
