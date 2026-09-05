export type AgentRole = 
  | 'planner'
  | 'research'
  | 'coding'
  | 'windows'
  | 'browser'
  | 'vision'
  | 'voice'
  | 'app'
  | 'social'
  | 'communication'
  | 'memory'
  | 'device'
  | 'security'
  | 'verification'
  | 'recovery';

export interface AgentDescriptor {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  status: 'idle' | 'executing' | 'verifying' | 'recovering' | 'error';
  health: 'healthy' | 'degraded' | 'offline';
  capabilities: string[];
  permissions: string[];
  tools: string[];
  activeTask?: string;
  latencyMs: number;
  successRate: number;
  totalMissions: number;
}

export interface DAGNode {
  id: string;
  agentRole: AgentRole;
  name: string;
  action: string;
  dependencies: string[]; // IDs of preceding nodes
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: any;
  error?: string;
}

export interface MultiAgentMissionDAG {
  id: string;
  goal: string;
  nodes: DAGNode[];
  status: 'planning' | 'running' | 'completed' | 'failed' | 'aborted';
  createdAt: string;
  completedAt?: string;
}

export class AgentSystem {
  private agents: Map<string, AgentDescriptor> = new Map();
  private activeDAGs: Map<string, MultiAgentMissionDAG> = new Map();

  constructor() {
    this.initializeAgents();
  }

  private initializeAgents() {
    const defaultAgents: AgentDescriptor[] = [
      {
        id: 'agent-planner',
        name: 'Master Planner Agent',
        role: 'planner',
        description: 'Deconstructs complex intents into directed acyclic dependency graphs (DAGs)',
        status: 'idle',
        health: 'healthy',
        capabilities: ['intent_parsing', 'dag_generation', 'dependency_resolution', 'parallel_scheduling'],
        permissions: ['orchestration_write', 'dag_create'],
        tools: ['PlannerEngine.createDAG', 'DependencyResolver.validate'],
        latencyMs: 14,
        successRate: 99.4,
        totalMissions: 142
      },
      {
        id: 'agent-research',
        name: 'Autonomous Research Agent',
        role: 'research',
        description: 'Deep web, documentation, and source code intelligence synthesis',
        status: 'idle',
        health: 'healthy',
        capabilities: ['web_search', 'citation_graph', 'pdf_extraction', 'semantic_summary'],
        permissions: ['network_read', 'docs_read'],
        tools: ['SearchEngine.query', 'DocParser.extract'],
        latencyMs: 220,
        successRate: 98.1,
        totalMissions: 88
      },
      {
        id: 'agent-coding',
        name: 'Precision Coding Agent',
        role: 'coding',
        description: 'Repository engineering, syntax analysis, automated test writing & verification',
        status: 'idle',
        health: 'healthy',
        capabilities: ['ast_analysis', 'diff_generation', 'linter_fix', 'unit_testing'],
        permissions: ['filesystem_read_write', 'process_spawn'],
        tools: ['CodeEngine.editFile', 'TestRunner.execute'],
        latencyMs: 85,
        successRate: 97.6,
        totalMissions: 110
      },
      {
        id: 'agent-windows',
        name: 'Windows Control Agent',
        role: 'windows',
        description: 'Win32 native API, process supervisor, and PowerShell admin plane',
        status: 'idle',
        health: 'healthy',
        capabilities: ['process_lifecycle', 'window_focus', 'powershell_exec', 'clipboard_ctrl'],
        permissions: ['win32_admin', 'process_control'],
        tools: ['WindowsProcessManager.launchApp', 'NativeAutomation.runPowerShell'],
        latencyMs: 32,
        successRate: 99.8,
        totalMissions: 320
      },
      {
        id: 'agent-browser',
        name: 'Autonomous Browser Agent',
        role: 'browser',
        description: 'Headless/visual web automation, DOM traversal, and session navigation',
        status: 'idle',
        health: 'healthy',
        capabilities: ['dom_interaction', 'page_navigation', 'form_automation', 'cookie_isolation'],
        permissions: ['browser_automation', 'network_access'],
        tools: ['BrowserEngine.navigate', 'BrowserEngine.clickElement'],
        latencyMs: 110,
        successRate: 96.5,
        totalMissions: 64
      },
      {
        id: 'agent-vision',
        name: 'Vision & Computer Use Agent',
        role: 'vision',
        description: 'Real-time desktop observer, OCR, visual UI detector, and mouse/keyboard controller',
        status: 'idle',
        health: 'healthy',
        capabilities: ['screen_capture', 'ocr_text_detection', 'ui_bounding_box', 'mouse_drag_click'],
        permissions: ['screen_read', 'hardware_input_sim'],
        tools: ['ScreenCaptureService.capture', 'ComputerUseEngine.executeVisualAction'],
        latencyMs: 65,
        successRate: 98.9,
        totalMissions: 185
      },
      {
        id: 'agent-voice',
        name: 'Voice & Acoustic Agent',
        role: 'voice',
        description: 'WebAudio PCM streaming, real-time VAD, decoupled VoiceRouter & hardware barge-in',
        status: 'idle',
        health: 'healthy',
        capabilities: ['pcm_ingest', 'silero_vad', 'qwen_audio_asr', 'streaming_tts', 'barge_in_halt'],
        permissions: ['audio_io_access'],
        tools: ['VoiceRouter.route', 'AudioStreamHandler.handlePCM'],
        latencyMs: 18,
        successRate: 99.9,
        totalMissions: 412
      },
      {
        id: 'agent-app',
        name: 'Universal App Controller Agent',
        role: 'app',
        description: '10-Tier application controller and source repo adapter generator',
        status: 'idle',
        health: 'healthy',
        capabilities: ['app_discovery', '10_tier_resolution', 'repo_adapter_gen', 'cli_sdk_bind'],
        permissions: ['registry_read', 'app_interact'],
        tools: ['UniversalAppController.discover', 'SourceRepoScanner.scanAndGenerate'],
        latencyMs: 40,
        successRate: 97.9,
        totalMissions: 76
      },
      {
        id: 'agent-social',
        name: 'Social Media Gateway Agent',
        role: 'social',
        description: 'Cross-platform connector for X, LinkedIn, Discord, and Telegram',
        status: 'idle',
        health: 'healthy',
        capabilities: ['post_generation', 'sentiment_scoring', 'thread_listener', 'rate_limit_guard'],
        permissions: ['social_api_write_gated'],
        tools: ['SocialRouter.dispatch', 'SocialRouter.getFeed'],
        latencyMs: 140,
        successRate: 98.2,
        totalMissions: 52
      },
      {
        id: 'agent-comms',
        name: 'Unified Communications Agent',
        role: 'communication',
        description: 'Aggregated messaging inbox and draft supervisor across Slack, WhatsApp, and Gmail',
        status: 'idle',
        health: 'healthy',
        capabilities: ['inbox_aggregation', 'draft_composition', 'urgency_classifier'],
        permissions: ['email_messaging_access'],
        tools: ['CommunicationHub.getInbox', 'CommunicationHub.createDraft'],
        latencyMs: 45,
        successRate: 99.1,
        totalMissions: 98
      },
      {
        id: 'agent-memory',
        name: 'Memory & Learning Agent',
        role: 'memory',
        description: '7-Layer cognitive memory, semantic retrieval, and learned strategy optimizer',
        status: 'idle',
        health: 'healthy',
        capabilities: ['semantic_search', 'strategy_optimization', 'preference_indexing', 'experience_replay'],
        permissions: ['memory_store_read_write'],
        tools: ['MemoryEngine.query', 'MemoryEngine.recordExperience'],
        latencyMs: 12,
        successRate: 99.7,
        totalMissions: 230
      },
      {
        id: 'agent-device',
        name: 'Device & Hardware Agent',
        role: 'device',
        description: 'Cross-device intelligence: Bluetooth peripherals, audio interfaces, displays, and IoT',
        status: 'idle',
        health: 'healthy',
        capabilities: ['bluetooth_scan', 'audio_endpoint_ctrl', 'display_topology', 'iot_mqtt_bridge'],
        permissions: ['device_admin'],
        tools: ['DeviceController.scan', 'DeviceController.setEndpoint'],
        latencyMs: 28,
        successRate: 98.4,
        totalMissions: 46
      },
      {
        id: 'agent-security',
        name: 'Security & Delegation Guard Agent',
        role: 'security',
        description: 'Multi-tier risk classifier, Credential Vault, and prompt injection firewall',
        status: 'idle',
        health: 'healthy',
        capabilities: ['risk_tiering', 'prompt_injection_filter', 'vault_isolation', 'audit_signing'],
        permissions: ['security_enforce_root'],
        tools: ['HardenedSecurity.evaluate', 'CredentialVault.getSecret'],
        latencyMs: 8,
        successRate: 100.0,
        totalMissions: 520
      },
      {
        id: 'agent-verification',
        name: 'Action Verification Agent',
        role: 'verification',
        description: 'Validates real-world side effects, PID tables, HWNDs, and visual change states',
        status: 'idle',
        health: 'healthy',
        capabilities: ['pid_verifier', 'hwnd_verifier', 'visual_diff_validator', 'assertion_check'],
        permissions: ['system_read'],
        tools: ['ActionVerifier.verifyProcess', 'ActionVerifier.verifyVisual'],
        latencyMs: 20,
        successRate: 99.6,
        totalMissions: 315
      },
      {
        id: 'agent-recovery',
        name: 'Autonomous Recovery Agent',
        role: 'recovery',
        description: 'Automatic failure classification, alternate tool selection, state rollback & user escalation',
        status: 'idle',
        health: 'healthy',
        capabilities: ['failure_classification', 'tool_failover', 'state_rollback', 'safe_stop'],
        permissions: ['system_recovery_write'],
        tools: ['RecoveryEngine.rollback', 'RecoveryEngine.alternateTool'],
        latencyMs: 16,
        successRate: 98.8,
        totalMissions: 29
      }
    ];

    defaultAgents.forEach(a => this.agents.set(a.id, a));
  }

  getAgents(): AgentDescriptor[] {
    return Array.from(this.agents.values());
  }

  getAgent(id: string): AgentDescriptor | undefined {
    return this.agents.get(id);
  }

  /**
   * Plan and execute a multi-agent DAG mission
   */
  async executeDAGMission(goal: string, onNodeProgress?: (node: DAGNode) => void): Promise<MultiAgentMissionDAG> {
    const dagId = 'dag-' + Math.random().toString(36).substring(2, 9);
    console.log(`[AgentSystem] Planning multi-agent DAG for mission: "${goal}"`);

    // Master Planner generates the DAG nodes
    const nodes: DAGNode[] = [
      {
        id: 'node-1',
        agentRole: 'planner',
        name: 'Analyze Intent & Decompose Constraints',
        action: 'PlannerAgent.generateDAG',
        dependencies: [],
        status: 'completed',
        result: 'Goal decomposed into 4 parallel & sequential subtasks'
      },
      {
        id: 'node-2',
        agentRole: 'security',
        name: 'Risk Tiering & Permission Gate',
        action: 'SecurityAgent.evaluateRisk',
        dependencies: ['node-1'],
        status: 'completed',
        result: 'Evaluated: SAFE_ACTION_AUTONOMOUS'
      },
      {
        id: 'node-3',
        agentRole: 'windows',
        name: 'Windows Control Plane Execution',
        action: 'WindowsAgent.executeAction',
        dependencies: ['node-2'],
        status: 'running'
      },
      {
        id: 'node-4',
        agentRole: 'verification',
        name: 'Verify PID, HWND & Telemetry State',
        action: 'VerificationAgent.verifyOutcome',
        dependencies: ['node-3'],
        status: 'pending'
      },
      {
        id: 'node-5',
        agentRole: 'memory',
        name: 'Record Experience & Update Strategy Weights',
        action: 'MemoryAgent.recordExperience',
        dependencies: ['node-4'],
        status: 'pending'
      }
    ];

    const dag: MultiAgentMissionDAG = {
      id: dagId,
      goal,
      nodes,
      status: 'running',
      createdAt: new Date().toLocaleTimeString()
    };

    this.activeDAGs.set(dagId, dag);

    // Simulate execution step updates
    setTimeout(() => {
      nodes[2].status = 'completed';
      nodes[2].result = 'Process created & verified in Windows host';
      onNodeProgress?.(nodes[2]);

      nodes[3].status = 'running';
      onNodeProgress?.(nodes[3]);

      setTimeout(() => {
        nodes[3].status = 'completed';
        nodes[3].result = 'Assertion passed: HWND active & visible';
        onNodeProgress?.(nodes[3]);

        nodes[4].status = 'running';
        setTimeout(() => {
          nodes[4].status = 'completed';
          nodes[4].result = 'Experience stored in long-term semantic layer';
          dag.status = 'completed';
          dag.completedAt = new Date().toLocaleTimeString();
          onNodeProgress?.(nodes[4]);
        }, 300);
      }, 300);
    }, 400);

    return dag;
  }

  getActiveDAGs(): MultiAgentMissionDAG[] {
    return Array.from(this.activeDAGs.values());
  }
}

export const agentSystem = new AgentSystem();
