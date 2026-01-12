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

import SendControlCharacter from "../src/send_control_character";

describe("SendControlCharacter", () => {
  let controlCharSender: SendControlCharacter;

  beforeEach(() => {
    jest.clearAllMocks();
    controlCharSender = new SendControlCharacter();
  });

  describe("send", () => {
    it("should successfully send Ctrl+C", async () => {
      mockExecAsync.mockResolvedValue({ stdout: "", stderr: "" });

      const result = await controlCharSender.send("c");

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe("Sent control character: Ctrl+C");
    });

    it("should successfully send Ctrl+D", async () => {
      mockExecAsync.mockResolvedValue({ stdout: "", stderr: "" });

      const result = await controlCharSender.send("d");

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe("Sent control character: Ctrl+D");
    });

    it("should successfully send Ctrl+Z", async () => {
      mockExecAsync.mockResolvedValue({ stdout: "", stderr: "" });

      const result = await controlCharSender.send("z");

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe("Sent control character: Ctrl+Z");
    });

    it("should successfully send Ctrl+L", async () => {
      mockExecAsync.mockResolvedValue({ stdout: "", stderr: "" });

      const result = await controlCharSender.send("l");

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe("Sent control character: Ctrl+L");
    });

    it("should work with uppercase characters", async () => {
      mockExecAsync.mockResolvedValue({ stdout: "", stderr: "" });

      const result = await controlCharSender.send("C");

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe("Sent control character: Ctrl+C");
    });

    it("should return error for unsupported control character", async () => {
      const result = await controlCharSender.send("9");

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain("Unknown control character: 9");
    });

    it("should return error for empty string", async () => {
      const result = await controlCharSender.send("");

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain("Character must be a non-empty string");
    });

    it("should return error when WezTerm command fails", async () => {
      mockExecAsync.mockRejectedValue(new Error("WezTerm not available"));

      const result = await controlCharSender.send("c");

      expect(result.content).toHaveLength(1);
      expect(result.content[0].text).toContain("Failed to send control character");
      expect(result.content[0].text).toContain("WezTerm not available");
    });

    // Test all control character mappings
    const controlCharTests = [
      { char: "a", name: "Ctrl+A" },
      { char: "e", name: "Ctrl+E" },
      { char: "k", name: "Ctrl+K" },
      { char: "u", name: "Ctrl+U" },
      { char: "w", name: "Ctrl+W" },
      { char: "r", name: "Ctrl+R" },
      { char: "p", name: "Ctrl+P" },
      { char: "n", name: "Ctrl+N" },
      { char: "b", name: "Ctrl+B" },
      { char: "f", name: "Ctrl+F" },
      { char: "t", name: "Ctrl+T" },
      { char: "g", name: "Ctrl+G" },
      { char: "v", name: "Ctrl+V" },
      { char: "y", name: "Ctrl+Y" },
      { char: "s", name: "Ctrl+S" },
      { char: "q", name: "Ctrl+Q" },
      { char: "x", name: "Ctrl+X" },
    ];

    controlCharTests.forEach(({ char, name }) => {
      it(`should successfully send ${name}`, async () => {
        mockExecAsync.mockResolvedValue({ stdout: "", stderr: "" });

        const result = await controlCharSender.send(char);

        expect(result.content).toHaveLength(1);
        expect(result.content[0].type).toBe("text");
        expect(result.content[0].text).toBe(`Sent control character: ${name}`);
      });
    });
  });
});
