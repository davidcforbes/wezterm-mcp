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
import WeztermOutputReader from "../src/wezterm_output_reader";
import SendControlCharacter from "../src/send_control_character";

describe("Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("全体的なワークフロー", () => {
    it("コマンド実行 → 出力読み取り → 制御文字送信の一連の流れが動作すること", async () => {
      const executor = new WeztermExecutor();
      const outputReader = new WeztermOutputReader();
      const controlCharSender = new SendControlCharacter();

      // Mock successful command execution
      mockExecAsync.mockResolvedValueOnce({ stdout: "", stderr: "" });

      const writeResult = await executor.writeToTerminal('echo "hello"');
      expect(writeResult.content[0].text).toContain("Command sent to WezTerm");

      // Mock output reading
      mockExecAsync.mockResolvedValueOnce({ stdout: "hello\n", stderr: "" });
      const readResult = await outputReader.readOutput(10);
      expect(readResult.content[0].text).toBe("hello\n");

      // Mock control character sending
      mockExecAsync.mockResolvedValueOnce({ stdout: "", stderr: "" });
      const controlResult = await controlCharSender.send("c");
      expect(controlResult.content[0].text).toBe(
        "Sent control character: Ctrl+C"
      );
    }, 15000);

    it("エラーハンドリングが各クラスで一貫していること", async () => {
      const executor = new WeztermExecutor();
      const outputReader = new WeztermOutputReader();

      // Mock errors for all classes
      mockExecAsync.mockRejectedValueOnce(new Error("WezTerm not available"));
      const writeResult = await executor.writeToTerminal("test");
      expect(writeResult.content[0].text).toContain(
        "Failed to write to terminal"
      );
      expect(writeResult.content[0].text).toContain("WezTerm not available");

      // WeztermOutputReaderのエラー
      mockExecAsync.mockRejectedValueOnce(new Error("WezTerm not available"));
      const readResult = await outputReader.readOutput(10);
      expect(readResult.content[0].text).toContain(
        "Failed to read terminal output"
      );
      expect(readResult.content[0].text).toContain("WezTerm not available");

      // SendControlCharacterのエラー
      mockExecAsync.mockRejectedValueOnce(new Error("WezTerm not available"));
      const controlCharSender = new SendControlCharacter();
      const controlResult = await controlCharSender.send("c");
      expect(controlResult.content[0].text).toContain(
        "Failed to send control character"
      );
      expect(controlResult.content[0].text).toContain("WezTerm not available");
    });

    it("複数のペインでの操作が正常に動作すること", async () => {
      const executor = new WeztermExecutor();

      // ペイン一覧取得
      const paneList = "pane_id=1 active=true\npane_id=2 active=false";
      mockExecAsync.mockResolvedValueOnce({ stdout: paneList, stderr: "" });

      const listResult = await executor.listPanes();
      expect(listResult.content[0].text).toContain("pane_id=1");
      expect(listResult.content[0].text).toContain("pane_id=2");

      // ペイン切り替え
      mockExecAsync.mockResolvedValueOnce({ stdout: "", stderr: "" });

      const switchResult = await executor.switchPane(2);
      expect(switchResult.content[0].text).toBe("Switched to pane 2");

      // 特定のペインにコマンド送信
      mockExecAsync.mockResolvedValueOnce({ stdout: "", stderr: "" });

      const writeToSpecificResult = await executor.writeToSpecificPane("ls", 2);
      expect(writeToSpecificResult.content[0].text).toBe(
        "Command sent to pane 2: ls"
      );
    });
  });

  describe("パフォーマンステスト", () => {
    it("大量のコマンド実行が適切に処理されること", async () => {
      const executor = new WeztermExecutor();

      // Mock all 5 command executions
      mockExecAsync.mockResolvedValue({ stdout: "", stderr: "" });

      const promises: Promise<{ content: any[] }>[] = [];
      for (let i = 0; i < 5; i++) {
        promises.push(executor.writeToTerminal(`echo "test ${i}"`));
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.content[0].text).toContain(`echo "test ${index}"`);
      });
    }, 10000); // 10秒のタイムアウト
  });
});
