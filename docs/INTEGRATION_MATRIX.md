# Akansha Integration Matrix & Lifecycle Contracts

## Execution Lifecycle Contract

Every action dispatched across the Akansha Operating Layer adheres to:
`UNDERSTAND` $\rightarrow$ `CLASSIFY` $\rightarrow$ `ASK IF NECESSARY` $\rightarrow$ `PLAN` $\rightarrow$ `EXECUTE` $\rightarrow$ `OBSERVE` $\rightarrow$ `VERIFY` $\rightarrow$ `RECOVER IF NEEDED` $\rightarrow$ `CONTINUE` $\rightarrow$ `LEARN` $\rightarrow$ `REMEMBER` $\rightarrow$ `REPORT TRUTHFULLY`.

### Multi-Agent Routing Matrix

| Intent Category | Primary Engine | Secondary / Fallback | Verification Mechanism |
| :--- | :--- | :--- | :--- |
| `CONVERSATION` | Letta Memory + Master Orchestrator | Local Model / Qwen | Context & conversation memory match |
| `QUESTION` | System Metrics API / IST Engine | Odysseus Local / ModelRouter | Telemetry schema / Timezone calculation |
| `WINDOWS_ACTION` | Win32 / WScript / PowerShell | UI-TARS Visual Control | Process ID, Window Title, HWND |
| `BROWSER_ACTION` | Browser Use (Playwright) | UI-TARS Visual Agent | Browser window & DOM element verify |
| `CODING_TASK` | OpenHands | Open Interpreter | File checksum & test suite output |
| `MULTI_STEP_TASK` | TaskPlanner (LangGraph State Machine) | Procedural Strategy Store | Sequential step checkpoint validation |
