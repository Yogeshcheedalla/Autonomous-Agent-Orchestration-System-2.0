# AKANSHA Architecture & Capability Audit

**Document Version:** 2.0.0  
**Host Environment:** Windows 11 Native (`win32` x64)  
**Authority:** AKANSHA Master Orchestrator  
**Runtime:** Electron 44.2.0 + Node 16 CJS + React 19 + Vite

---

## 1. Executive Summary

AKANSHA is a native Windows AI Operating Layer and autonomous assistant packaged as `AKANSHA.exe`. This audit evaluates current capabilities against four key research sources:
1. **`awesome-llm-apps`**: Capabilities catalog (Deep research, RAG, multi-agent research, data analysis, always-on agents).
2. **`openagent`**: Personal assistant architectural reference (autonomous execution loops, transparent tool calls, office/browser/shell automation).
3. **`the-incredible-ai-agents`**: Agent lifecycle technology registry (LangGraph, Letta, Mem0, Browser Use, UI-TARS, Promptfoo, OpenTelemetry).
4. **`AG-UI Protocol`**: Real-time event-driven agent $\leftrightarrow$ UI interaction model and safe, schema-validated generative UI rendering.

---

## 2. Capability Evaluation & Integration Strategy

| Candidate Source | Role in AKANSHA | Rationale & Boundaries |
| :--- | :--- | :--- |
| **`awesome-llm-apps`** | **CAPABILITY COOKBOOK (Adapter)** | Mined for modular patterns: Deep Research, RAG, data extraction, self-improving skills. *Rejected as a runtime dependency.* |
| **`openagent`** | **ARCHITECTURAL REFERENCE (Adapter)** | Mined for transparent tool calling, office automation, and personal assistant loops. *OpenAgent's localhost web UI (port 14000) is rejected; AKANSHA owns the UI.* |
| **`the-incredible-ai-agents`** | **TECHNOLOGY REGISTRY (Catalog)** | Mined for technology taxonomy (Frameworks, Memory, Evaluation, Observability). Integrated into [`docs/agent-technology-registry.md`](file:///c:/jarvis-an/docs/agent-technology-registry.md). |
| **`AG-UI Protocol`** | **CORE PROTOCOL (Primary)** | Standard event contract (`RUN_STARTED`, `PLAN_CREATED`, `TOOL_CALL_*`, `APPROVAL_REQUIRED`, etc.) connecting the Master Orchestrator directly to the Glassmorphic UI via WebSockets and IPC. |

---

## 3. Subsystem Audit Matrix

| Subsystem | Current Status | Upgrades Planned |
| :--- | :--- | :--- |
| **Master Orchestrator** | Complete Win32/LangGraph DAG | Integrate `CapabilityGraph` with cost/latency/privacy routing |
| **Agent Event Stream** | Partial WebSocket updates | Implement strict AG-UI event contract (`AgentEventStream`) |
| **Generative UI** | Static cards / Fixed tabs | Controlled `ComponentRegistry` with dynamic schema-validated components |
| **Self-Extending Skills** | Static tools & Source adapters | 6-Stage skill pipeline: `GENERATED -> SANDBOXED -> TESTED -> APPROVED -> REGISTERED` |
| **Tool Fabric & MCP** | Native Win32 + PowerShell | `ToolRegistry` with capability security, permission gates, and MCP manager |
| **Memory Fabric** | 7-Layer Letta memory engine | Enhanced episodic retention and strategy optimizer |
| **Desktop Shell** | Standalone `AKANSHA.exe` + Tray | Global `Ctrl+Space`, Windows startup, and native notifications |
