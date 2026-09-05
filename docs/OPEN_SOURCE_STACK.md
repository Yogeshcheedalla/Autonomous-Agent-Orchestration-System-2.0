# Akansha Open-Source Stack Architecture & Repository Rankings

## Repository Ranking & Capability Matrix

| Rank | Repository | Role | Priority | Implementation Status |
| :--- | :--- | :--- | :--- | :--- |
| **1** | [UI-TARS Desktop](https://github.com/bytedance/UI-TARS-desktop) | Primary GUI / Windows Computer-Use Agent | **MANDATORY** | Integrated via `UITarsAdapter` & `uiTarsRouter` |
| **2** | [LangGraph](https://github.com/langchain-ai/langgraph) | Workflow, Checkpoint & State Machine | **MANDATORY** | Integrated via `ExecutionStateMachine` |
| **3** | [Browser Use](https://github.com/browser-use/browser-use) | Native Browser Automation & Web Research | **MANDATORY** | Integrated via `BrowserUseAdapter` |
| **4** | [Letta](https://github.com/letta-ai/letta) | Canonical Procedural & Agentic Memory | **HIGH** | Integrated via `LettaAdapter` & `LearningEngine` |
| **5** | [Open Interpreter](https://github.com/OpenInterpreter/open-interpreter) | Sandboxed Local Code Execution | **HIGH** | Integrated via `OpenInterpreterAdapter` |
| **6** | [OpenHands](https://github.com/OpenHands/OpenHands) | Software Engineering & Coding Missions | **HIGH** | Integrated via `OpenHandsAdapter` |
| **7** | [Mem0](https://github.com/mem0ai/mem0) | Semantic Memory Layer | Optional | Available as secondary profile provider |
| **8** | [TencentDB Agent Memory](https://github.com/TencentCloud/TencentDB-Agent-Memory) | Team / Shared Knowledge Graph | Optional | Phase 2 candidate |
| **9** | [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) | Experimental Agent Harness | Research | Isolated in adapter registry |
| **10** | [Brigade](https://github.com/spinabot/brigade) | Multi-Agent / Connector Research | Optional | Selected connector patterns |
| **11** | [Odysseus](https://github.com/odysseus-dev/odysseus) | Self-Hosted Local AI Workspace | Optional Provider | Integrated via `OdysseusAdapter` |
| **12** | [LifeOS](https://github.com/danielmiessler/LifeOS) | Intent & Ideal-State Engineering | Design Ref | Native intent classification & doubts |
| **13** | [OSWorld](https://github.com/xlang-ai/OSWorld) | Desktop Benchmark Suite | **MANDATORY FOR TEST** | 20-Scenario Local Benchmark Suite (`run_osworld_suite.ts`) |
| **14** | [Qwen Audio Agent](https://github.com/QwenAudio/qwen-audio-agent) | Voice / Audio Stack | Active | Single Female TTS Audio Lock Enforced |
| **15** | [oMLX](https://github.com/jundot/omlx) | Apple Silicon LLM Runtime | Not for Windows | Skipped (macOS only) |
| **16** | [Heretic](https://github.com/p-e-w/heretic) | Model Research Laboratory | Research | Dedicated lab isolation |
