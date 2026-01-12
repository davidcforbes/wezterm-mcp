# Security Policy

## Overview

The WezTerm MCP server provides direct terminal control capabilities through the Model Context Protocol. While this enables powerful automation, it also introduces significant security considerations that users must understand.

## Security Model

### Trust Boundary

**This MCP server operates with your full user permissions and provides unrestricted command execution capabilities.**

- ⚠️ **Commands execute with your user account's full privileges**
- ⚠️ **No authentication or authorization mechanism exists**
- ⚠️ **No command sandboxing or restrictions are enforced**
- ⚠️ **File system access is unrestricted**
- ⚠️ **No audit logging is performed**

### Threat Model

This server assumes:

1. **Trusted MCP clients only**: Only connect this server to MCP clients you completely trust
2. **Local use only**: Never expose this server over a network
3. **Secure environment**: Operating system and terminal are secure
4. **No malicious input**: All commands and control sequences come from trusted sources

## Security Risks

### Critical Risks

1. **Arbitrary Command Execution**
   - Any MCP client can execute any command through `write_to_terminal`
   - Commands run with your full user permissions
   - No command whitelist or validation beyond injection prevention

2. **Data Exposure**
   - Terminal output may contain sensitive information (credentials, API keys, file contents)
   - No filtering or redaction of sensitive data in output
   - All terminal content readable by MCP clients

3. **File System Access**
   - Commands can read, write, or delete any file your user can access
   - No path restrictions or file operation limits

4. **Process Control**
   - Commands can launch background processes
   - Can interact with system services and daemons
   - Can modify system configuration (within user permissions)

### Mitigated Risks

The following security measures **are** implemented:

1. **Command Injection Prevention**
   - All commands properly escaped using `shell-quote` library
   - Pane IDs validated as non-negative integers
   - Control characters validated against whitelist

2. **Input Validation**
   - Type checking for all tool arguments
   - Range validation (e.g., max 10,000 lines for output)
   - Character validation for control sequences

3. **Resource Limits**
   - Output size capped at 1MB per read
   - Command execution timeout (30s default)
   - Maximum buffer sizes enforced

## Best Practices

### For Users

1. **Verify Client Trustworthiness**
   - Only use this server with MCP clients from trusted sources
   - Review client code if possible
   - Be suspicious of unexpected command executions

2. **Monitor Activity**
   - Watch terminal for unexpected commands
   - Review command history regularly
   - Monitor system logs for suspicious activity

3. **Limit Permissions**
   - Run terminal with minimal necessary permissions
   - Use separate user accounts for sensitive operations
   - Avoid running as administrator/root

4. **Secure Your Environment**
   - Keep WezTerm and dependencies updated
   - Use secure terminal configurations
   - Enable OS-level security features (firewall, SELinux, etc.)

5. **Credential Hygiene**
   - Never store credentials in terminal history
   - Use credential managers instead of plain text
   - Clear sensitive output from terminal after use

### For Developers Integrating This Server

1. **Validate All Inputs**
   - Never pass unsanitized user input directly to tools
   - Validate command strings before execution
   - Use structured logging to audit operations

2. **Principle of Least Privilege**
   - Only request necessary MCP capabilities
   - Minimize command execution surface
   - Implement application-level restrictions

3. **User Consent**
   - Require explicit user approval for command execution
   - Display commands before executing
   - Provide clear warnings about destructive operations

4. **Error Handling**
   - Never expose command output containing credentials in error messages
   - Implement proper timeout handling
   - Gracefully handle WezTerm connection failures

## Known Limitations

1. **No Command Sandboxing**
   - Commands execute without restrictions
   - No capability-based security
   - Cannot prevent malicious commands

2. **No Audit Trail**
   - Commands are not logged
   - No record of who executed what
   - Difficult to trace suspicious activity

3. **No Network Security**
   - If exposed over network, completely unprotected
   - No TLS/encryption support
   - No authentication mechanism

4. **No Rate Limiting**
   - Clients can execute commands rapidly
   - Potential for resource exhaustion
   - No throttling mechanism

## Reporting Security Issues

If you discover a security vulnerability in this project, please report it privately:

1. **Do not** open a public GitHub issue
2. Email the maintainer with details
3. Allow reasonable time for a fix before public disclosure
4. We will acknowledge receipt within 48 hours

### Security Issue Response Process

1. **Triage** (24-48 hours): Confirm vulnerability and assess severity
2. **Fix Development** (depends on severity):
   - Critical (P0): Within 7 days
   - High (P1): Within 14 days
   - Medium (P2): Within 30 days
3. **Testing**: Verify fix and add regression tests
4. **Release**: Publish patched version
5. **Disclosure**: Public announcement after patch available

## Security Considerations by Feature

### write_to_terminal / write_to_specific_pane

**Risk Level: CRITICAL**

- Executes arbitrary commands with user permissions
- Can modify files, launch processes, access network
- No command validation beyond injection prevention

**Mitigations:**
- Commands properly escaped using `shell-quote`
- MCP client responsible for validating command safety
- User should review commands before execution

### read_terminal_output

**Risk Level: HIGH**

- Can expose sensitive data from terminal
- May capture credentials, API keys, file contents
- No output filtering or redaction

**Mitigations:**
- Output size limited to 1MB per read
- Line count capped at 10,000 lines
- Users should clear sensitive output from terminal

### send_control_character

**Risk Level: MEDIUM**

- Can interrupt processes (Ctrl+C)
- Can terminate sessions (Ctrl+D)
- Limited to predefined control characters

**Mitigations:**
- Only whitelisted control characters accepted
- Properly escaped using `shell-quote`
- Validation prevents injection attacks

### list_panes / switch_pane

**Risk Level: LOW**

- Read-only or navigation operations
- Minimal security impact
- Pane IDs validated

**Mitigations:**
- Pane IDs must be non-negative integers
- Commands properly escaped
- No data exposure beyond pane metadata

## Version-Specific Security Notes

### v0.1.0 (Current)

**Security Improvements:**
- ✅ Fixed command injection vulnerabilities using `shell-quote`
- ✅ Added input validation (type checking, range validation)
- ✅ Implemented timeout handling (30s default)
- ✅ Added output size limits (1MB max)
- ✅ Cross-platform control character handling
- ✅ Comprehensive test coverage (49 tests)

**Known Issues:**
- ⚠️ No command sandboxing
- ⚠️ No audit logging
- ⚠️ No authentication mechanism

## Future Security Enhancements

Potential improvements under consideration:

1. **Command Whitelist**: Optional mode restricting to safe commands
2. **Audit Logging**: Record all executed commands with timestamps
3. **User Confirmation**: Require approval for sensitive operations
4. **Output Redaction**: Filter credentials from terminal output
5. **Rate Limiting**: Prevent rapid command execution
6. **Capability System**: Fine-grained permission control

## License and Disclaimer

This software is provided "as is" without warranty. Users are responsible for understanding and accepting the security implications of using this MCP server. The maintainers are not liable for any security incidents or data loss resulting from use of this software.

## Additional Resources

- [WezTerm Security Documentation](https://wezfurlong.org/wezterm/config/lua/general.html)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [OWASP Command Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html)
