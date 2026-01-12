# Critical Security Vulnerabilities and Stability Issues Discovered

**Repository:** hiraishikentaro/wezterm-mcp
**Issue Type:** Security Vulnerability Report
**Severity:** Critical (P0)

## Summary

While working with a fork of this project, we discovered and fixed several **critical security vulnerabilities** and **stability issues** in the WezTerm MCP server. This issue documents these findings to help improve the original project.

## 🔴 Critical Security Vulnerabilities (P0)

### 1. Command Injection in `wezterm_executor.ts`

**Vulnerability:** The original code uses simple string concatenation and escaping for command construction, which is vulnerable to command injection attacks.

**Original vulnerable code:**
```typescript
const escapedCommand = command.replace(/'/g, "'\"'\"'");
await execAsync(`${this.weztermCli} send-text --no-paste '${escapedCommand}\n'`);
```

**Attack vector:** A malicious command like `'; malicious-command; '` could break out of the quotes and execute arbitrary commands.

**Fix:** Use the `shell-quote` library for proper command escaping:
```typescript
import * as shellQuote from "shell-quote";

const args = [
  ...this.weztermCli.split(" "),
  "send-text",
  "--no-paste",
  `${command}\n`,
];
const escapedCommand = shellQuote.quote(args);
await execAsync(escapedCommand);
```

### 2. Shell Injection in `send_control_character.ts`

**Vulnerability:** Similar command injection vulnerability when constructing control character sequences.

**Original vulnerable code:**
```typescript
const command = `${this.weztermCli} send-text --no-paste $'\\x${hexCode}'`;
await execAsync(command);
```

**Issues:**
- `$'...'` syntax is bash-specific and not cross-platform
- Vulnerable to injection if control sequences are not properly validated
- `hexCode` could be manipulated to inject commands

**Fix:** Use `shell-quote` and proper validation:
```typescript
const args = [...this.weztermCli.split(" "), "send-text", "--no-paste", charString];
const escapedCommand = shellQuote.quote(args);
await execAsync(escapedCommand);
```

### 3. Pane ID Injection

**Vulnerability:** Pane IDs are passed directly to shell commands without validation, allowing potential injection.

**Original code:**
```typescript
await execAsync(`${this.weztermCli} send-text --pane-id ${paneId} ...`);
```

**Fix:** Validate pane IDs as non-negative integers before use:
```typescript
private validatePaneId(paneId: number): void {
  if (!Number.isInteger(paneId) || paneId < 0) {
    throw new Error(`Invalid pane ID: ${paneId}. Pane ID must be a non-negative integer.`);
  }
}
```

## 🟡 Stability Issues (P1)

### 1. No Timeout Handling

**Problem:** All `execAsync` calls have no timeout, causing indefinite hangs if WezTerm becomes unresponsive.

**Fix:** Add configurable timeouts (default 30 seconds):
```typescript
await execAsync(command, {
  timeout: this.timeoutMs,
  maxBuffer: MAX_OUTPUT_SIZE,
});
```

### 2. Unbounded Output Size

**Problem:** Reading terminal output has no size limits, potentially causing memory exhaustion.

**Fix:** Cap output at 1MB and validate line counts:
```typescript
const MAX_OUTPUT_SIZE = 1024 * 1024; // 1MB
const MAX_LINES = 10000;

if (lines > MAX_LINES) {
  throw new Error(`Line count ${lines} exceeds maximum allowed (${MAX_LINES})`);
}
```

### 3. Missing Input Validation

**Problem:** No type checking or validation for tool parameters.

**Fix:** Add comprehensive validation:
```typescript
if (typeof command !== "string") {
  throw new Error("Command must be a string");
}

if (!Number.isInteger(lines) || lines < 1 || lines > MAX_LINES) {
  throw new Error(`Invalid lines parameter: ${lines}`);
}
```

### 4. Non-Cross-Platform Control Characters

**Problem:** Using bash-specific `$'\\x..'` syntax for control characters.

**Fix:** Use portable approach:
```typescript
const char = String.fromCharCode(parseInt(hexCode, 16));
const charString = char.replace(/[\\']/g, "\\$&");
```

### 5. Limited Control Character Support

**Problem:** Only supports a few control characters.

**Fix:** Extended to 21 characters (a-z except h,i,j,m,o):
```typescript
const SUPPORTED_CHARACTERS = /^[a-gk-ln-z]$/i;
```

## 🔧 Implementation Details

### Dependencies Added
```json
{
  "dependencies": {
    "shell-quote": "^1.8.3"
  }
}
```

### Test Coverage
All fixes include comprehensive test coverage (49 tests passing):
- Command injection prevention tests
- Input validation tests
- Timeout handling tests
- Cross-platform compatibility tests

### Configuration
New configurable options:
```typescript
const DEFAULT_TIMEOUT_MS = 30000;
const MAX_OUTPUT_SIZE = 1024 * 1024; // 1MB
const MAX_LINES = 10000;
```

Environment variable support:
```typescript
this.weztermCli = process.env.WEZTERM_CLI_PATH || "wezterm cli";
```

## 📋 Impact Assessment

**Critical Security Impact:**
- Command injection vulnerabilities allow **arbitrary code execution** with user permissions
- Affects all tools: `write_to_terminal`, `write_to_specific_pane`, `send_control_character`
- Any MCP client (including potentially malicious ones) could exploit these

**Stability Impact:**
- Indefinite hangs can lock up the MCP server
- Memory exhaustion from unbounded output
- Cross-platform compatibility issues on non-bash shells

## 🔍 How to Verify

1. **Test command injection:**
   ```typescript
   // This should NOT execute 'echo hacked'
   writeToTerminal("test'; echo hacked; echo '");
   ```

2. **Test timeout:**
   ```bash
   # Start a long-running command and verify timeout after 30s
   writeToTerminal("sleep 60");
   ```

3. **Test output limits:**
   ```bash
   # Generate large output and verify 1MB cap
   writeToTerminal("yes | head -n 1000000");
   ```

## 📚 Additional Resources

We've created comprehensive security documentation in our fork:
- Full SECURITY.md with threat model
- Security considerations by feature
- Best practices for users and developers
- Known limitations and future enhancements

## 🤝 Contribution Offer

We're happy to:
1. Submit a PR with all these fixes
2. Share our SECURITY.md documentation
3. Provide additional test cases
4. Assist with security review

Our fork with all fixes: https://github.com/davidcforbes/wezterm-mcp

## ⚠️ Disclosure Timeline

- **Discovery date:** January 11, 2026
- **Fixed in fork:** January 11, 2026
- **Public disclosure:** This issue (coordinated disclosure)
- **Recommended fix timeline:** Within 7-14 days (critical vulnerabilities)

Thank you for maintaining this project! Please let us know if you'd like us to submit a PR or if you have any questions about the fixes.
