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

import WeztermOutputReader from "../src/wezterm_output_reader";

describe("WeztermOutputReader", () => {
  let outputReader: WeztermOutputReader;

  beforeEach(() => {
    jest.clearAllMocks();
    outputReader = new WeztermOutputReader();
  });

  describe("readOutput", () => {
    it("should successfully read specified number of lines", async () => {
      const mockOutput = "line1\nline2\nline3\n";
      mockExecAsync.mockResolvedValue({ stdout: mockOutput, stderr: "" });

      const result = await outputReader.readOutput(50);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe(mockOutput);
      expect(mockExecAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          timeout: expect.any(Number),
          maxBuffer: expect.any(Number),
        })
      );
    });

    it("should read 50 lines by default", async () => {
      const mockOutput = "default output";
      mockExecAsync.mockResolvedValue({ stdout: mockOutput, stderr: "" });

      const result = await outputReader.readOutput();

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toBe(mockOutput);
    });

    it("should get all content when 0 or negative lines specified", async () => {
      const mockOutput = "full screen content";
      mockExecAsync.mockResolvedValue({ stdout: mockOutput, stderr: "" });

      const result = await outputReader.readOutput(0);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toBe(mockOutput);
    });

    it("should get all content for negative line numbers", async () => {
      const mockOutput = "full screen content";
      mockExecAsync.mockResolvedValue({ stdout: mockOutput, stderr: "" });

      const result = await outputReader.readOutput(-10);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toBe(mockOutput);
    });

    it('should return "(empty output)" for empty output', async () => {
      mockExecAsync.mockResolvedValue({ stdout: "", stderr: "" });

      const result = await outputReader.readOutput(10);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe("(empty output)");
    });

    it("should return error message when error occurs", async () => {
      mockExecAsync.mockRejectedValue(new Error("WezTerm connection failed"));

      const result = await outputReader.readOutput(20);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain(
        "Failed to read terminal output"
      );
      expect(result.content[0].text).toContain("WezTerm connection failed");
      expect(result.content[0].text).toContain("wezterm cli list");
    });

    it("should throw error for non-integer lines parameter", async () => {
      const result = await outputReader.readOutput(50.5);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain("Lines must be an integer");
    });

    it("should throw error when lines exceeds maximum", async () => {
      const result = await outputReader.readOutput(20000);

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain("Lines cannot exceed 10000");
    });
  });
});
