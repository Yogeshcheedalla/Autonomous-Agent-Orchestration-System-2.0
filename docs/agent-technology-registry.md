# AKANSHA Agent Technology Registry

**Catalog Classification Reference:** `the-incredible-ai-agents`  
**Standard:** Enterprise Agent Architecture Matrix  

---

## 1. Core Frameworks & Orchestration

| Category | Primary Implementation | Fallback / Research Adapter | Role in AKANSHA |
| :--- | :--- | :--- | :--- |
| **Workflow Engine** | **LangGraph State Graph** | Temporal / CrewAI | Primary DAG mission planner and checkpoint engine |
| **Personal Assistant Core** | **AKANSHA Master Orchestrator** | OpenAgent / AutoGen | Single point of authority for intent, security, and routing |
| **Multi-Agent DAG** | **Akansha Agent Fabric (15 Agents)** | LangGraph / CrewAI | Supervised parallel specialist execution |

---

## 2. Memory & Cognitive Store

| Layer | Implementation | Features & Latency |
| :--- | :--- | :--- |
| **Working Memory** | Native Session Graph | Active DAG checkpoints, current tool context |
| **Short-Term Memory** | Buffer Window | Recent conversation turns (< 10 ms) |
| **Long-Term Memory** | SQLite / Local File Store | User preferences, system facts |
| **Episodic Memory** | Letta / Mem0 Adapter | Past mission execution traces and audit history |
| **Semantic Memory** | Vector Embeddings / RAG | Knowledge retrieval and concept graph |
| **Procedural Memory** | Letta Procedural Store | Multi-step successful execution workflows |
| **Strategy Optimizer** | Learned Strategy Optimizer | Dynamic heuristic ranking (98-100% win-rate) |

---

## 3. Computer Use & Tool Control

| Capability | Primary Adapter | Fallback Adapter | Verification Mechanism |
| :--- | :--- | :--- | :--- |
| **Desktop Automation** | Native Win32 / PowerShell | Windows UI Automation | PID/HWND probe & Window Title check |
| **Vision Computer Use** | .NET Screen Capture + UI-TARS | OpenCV / OCR | Visual bounding box & coordinate match |
| **Browser Control** | Browser Use | Playwright / Headless Chrome | DOM tree inspection & URL verification |
| **Software Engineering** | OpenHands | Open Interpreter / Shell | Test execution & file diff check |
| **Universal Tools** | Native Tool Registry | MCP Server Protocol | Schema validation & capability policy check |

---

## 4. UI & Observability

| Domain | Standard / Framework | Function |
| :--- | :--- | :--- |
| **Agent $\leftrightarrow$ UI Protocol** | **AG-UI Event Contract** | Streaming thoughts, tool calls, approvals, and state deltas |
| **Generative UI** | **Akansha Component Registry** | Safe, schema-validated dynamic UI cards (Research, Diffs, Graphs) |
| **Telemetry & Tracing** | **OpenTelemetry-compatible Tracing** | Request ID, span metrics, token/tool latency logs |
| **Security & Auditing** | **AES-256 Vault + Prompt Firewall** | Input threat scoring, capability risk gating, audit trail |
