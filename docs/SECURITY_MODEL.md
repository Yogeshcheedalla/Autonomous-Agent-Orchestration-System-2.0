# Akansha Security Model & Capability Permissions

## Capability Policies

Akansha enforces capability-based access control to prevent destructive actions and untrusted content exploits:

### 1. Automatic Safe Capabilities
- `READ_SCREEN`: Window enumeration and screenshot inspection.
- `CLICK_UI`: Native input clicking.
- `TYPE_TEXT`: Keyboard typing via SendKeys.
- `OPEN_APPLICATION`: Safe process launching (`calc`, `notepad`, `code`).
- `OPEN_URL`: Default browser navigation (`https://...`).
- `WRITE_FILE`: Workspace file editing.

### 2. Gated Sensitive Capabilities (Explicit Approval Required)
- `DELETE_FILE`: File deletion or database wipe.
- `ADMIN_OPERATION`: Administrator elevation.
- `SYSTEM_SETTING`: Hardware/OS security modification.
- `EXECUTE_SHELL`: Arbitrary root shell execution.

### 3. Prompt Injection Defense
All external webpage content, downloaded files, and remote messages are sanitized through `CapabilityPolicy.sanitizeUntrustedContent()` to block override directives (*"ignore all previous instructions"*, *"override system prompt"*).
