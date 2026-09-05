export type CapabilityDomain = 
  | 'browser_control'
  | 'desktop_control'
  | 'coding'
  | 'memory'
  | 'research'
  | 'workflow'
  | 'voice'
  | 'vision'
  | 'data'
  | 'social'
  | 'automation'
  | 'devices'
  | 'security';

export interface CapabilityProvider {
  id: string;
  name: string;
  domain: CapabilityDomain;
  isPrimary: boolean;
  health: 'healthy' | 'degraded' | 'offline';
  latencyEstimateMs: number;
  costEstimate: 'zero' | 'low' | 'medium' | 'high';
  privacyLevel: 'local_only' | 'sandboxed' | 'cloud';
  requiresApproval: boolean;
  description: string;
  supportedActions: string[];
}

export interface CapabilityDefinition {
  domain: CapabilityDomain;
  description: string;
  primaryProviderId: string;
  fallbackProviderIds: string[];
  verificationStrategy: 'process_probe' | 'vision_match' | 'dom_inspection' | 'file_diff' | 'logic_assertion';
  minPrivacyLevel: 'local_only' | 'sandboxed' | 'cloud';
}

export class CapabilityGraph {
  private capabilities: Map<CapabilityDomain, CapabilityDefinition> = new Map();
  private providers: Map<string, CapabilityProvider> = new Map();

  constructor() {
    this.initDefaultGraph();
  }

  private initDefaultGraph() {
    // 1. Desktop Control
    this.registerProvider({
      id: 'win32_process_manager',
      name: 'Native Win32 Process Manager',
      domain: 'desktop_control',
      isPrimary: true,
      health: 'healthy',
      latencyEstimateMs: 15,
      costEstimate: 'zero',
      privacyLevel: 'local_only',
      requiresApproval: false,
      description: 'Native Windows Win32 API for launching, focusing, and managing app windows',
      supportedActions: ['launchApp', 'focusWindow', 'closeApp', 'getRunningWindows']
    });

    this.registerProvider({
      id: 'powershell_automation',
      name: 'PowerShell Native Bridge',
      domain: 'desktop_control',
      isPrimary: false,
      health: 'healthy',
      latencyEstimateMs: 65,
      costEstimate: 'zero',
      privacyLevel: 'local_only',
      requiresApproval: true,
      description: 'PowerShell script execution engine for deep Windows administrative control',
      supportedActions: ['runScript', 'manageServices', 'registryControl']
    });

    this.registerProvider({
      id: 'ui_tars_desktop',
      name: 'UI-TARS Desktop Computer Use',
      domain: 'desktop_control',
      isPrimary: false,
      health: 'healthy',
      latencyEstimateMs: 320,
      costEstimate: 'zero',
      privacyLevel: 'local_only',
      requiresApproval: false,
      description: 'Vision-based coordinate computer use for interacting with apps without accessibility APIs',
      supportedActions: ['clickCoordinate', 'typeText', 'dragDrop', 'hotkey']
    });

    this.capabilities.set('desktop_control', {
      domain: 'desktop_control',
      description: 'Native Windows app and system control plane',
      primaryProviderId: 'win32_process_manager',
      fallbackProviderIds: ['powershell_automation', 'ui_tars_desktop'],
      verificationStrategy: 'process_probe',
      minPrivacyLevel: 'local_only'
    });

    // 2. Browser Control
    this.registerProvider({
      id: 'browser_use_adapter',
      name: 'Browser Use Autonomous Engine',
      domain: 'browser_control',
      isPrimary: true,
      health: 'healthy',
      latencyEstimateMs: 240,
      costEstimate: 'low',
      privacyLevel: 'sandboxed',
      requiresApproval: false,
      description: 'Autonomous multi-step DOM browsing, form filling, and web navigation',
      supportedActions: ['navigate', 'search', 'clickElement', 'extractData', 'screenshot']
    });

    this.registerProvider({
      id: 'windows_browser_launcher',
      name: 'Windows Native Protocol Launcher',
      domain: 'browser_control',
      isPrimary: false,
      health: 'healthy',
      latencyEstimateMs: 40,
      costEstimate: 'zero',
      privacyLevel: 'local_only',
      requiresApproval: false,
      description: 'Fast-path native Windows default browser launcher',
      supportedActions: ['openUrl', 'searchGoogle']
    });

    this.capabilities.set('browser_control', {
      domain: 'browser_control',
      description: 'Web navigation, search, and autonomous DOM interaction',
      primaryProviderId: 'browser_use_adapter',
      fallbackProviderIds: ['windows_browser_launcher'],
      verificationStrategy: 'dom_inspection',
      minPrivacyLevel: 'sandboxed'
    });

    // 3. Coding & Software Engineering
    this.registerProvider({
      id: 'openhands_adapter',
      name: 'OpenHands Software Engineer',
      domain: 'coding',
      isPrimary: true,
      health: 'healthy',
      latencyEstimateMs: 450,
      costEstimate: 'low',
      privacyLevel: 'sandboxed',
      requiresApproval: false,
      description: 'Autonomous repository reading, patch generation, and test execution',
      supportedActions: ['inspectRepo', 'editFiles', 'runUnitTests', 'createPatch']
    });

    this.registerProvider({
      id: 'open_interpreter_adapter',
      name: 'Open Interpreter Shell Runner',
      domain: 'coding',
      isPrimary: false,
      health: 'healthy',
      latencyEstimateMs: 180,
      costEstimate: 'zero',
      privacyLevel: 'local_only',
      requiresApproval: true,
      description: 'Direct sandboxed Python/JS code execution',
      supportedActions: ['executeScript', 'analyzeData', 'generateChart']
    });

    this.capabilities.set('coding', {
      domain: 'coding',
      description: 'Software engineering, repository analysis, and code patching',
      primaryProviderId: 'openhands_adapter',
      fallbackProviderIds: ['open_interpreter_adapter'],
      verificationStrategy: 'file_diff',
      minPrivacyLevel: 'local_only'
    });

    // 4. Memory & Learning
    this.registerProvider({
      id: 'akansha_7layer_memory',
      name: 'AKANSHA 7-Layer Cognitive Memory',
      domain: 'memory',
      isPrimary: true,
      health: 'healthy',
      latencyEstimateMs: 5,
      costEstimate: 'zero',
      privacyLevel: 'local_only',
      requiresApproval: false,
      description: '7 cognitive layers: Working, Short, Long, Episodic, Semantic, Procedural, and Strategy Optimizer',
      supportedActions: ['recall', 'remember', 'search', 'forget', 'optimizeStrategy']
    });

    this.registerProvider({
      id: 'letta_adapter',
      name: 'Letta State Machine & Procedural Store',
      domain: 'memory',
      isPrimary: false,
      health: 'healthy',
      latencyEstimateMs: 10,
      costEstimate: 'zero',
      privacyLevel: 'local_only',
      requiresApproval: false,
      description: 'Stateful procedural memory and learned strategy management',
      supportedActions: ['rememberProcedure', 'recallStrategy']
    });

    this.capabilities.set('memory', {
      domain: 'memory',
      description: 'Stateful personal memory and self-improving strategy optimization',
      primaryProviderId: 'akansha_7layer_memory',
      fallbackProviderIds: ['letta_adapter'],
      verificationStrategy: 'logic_assertion',
      minPrivacyLevel: 'local_only'
    });

    // 5. Deep Research
    this.registerProvider({
      id: 'deep_research_engine',
      name: 'AKANSHA Deep Research Engine (Awesome-LLM-Apps pattern)',
      domain: 'research',
      isPrimary: true,
      health: 'healthy',
      latencyEstimateMs: 380,
      costEstimate: 'low',
      privacyLevel: 'sandboxed',
      requiresApproval: false,
      description: 'Multi-source deep research: query planning, parallel web reading, source validation, and report synthesis',
      supportedActions: ['conductResearch', 'extractCitations', 'synthesizeReport']
    });

    this.capabilities.set('research', {
      domain: 'research',
      description: 'Deep multi-agent web and document research',
      primaryProviderId: 'deep_research_engine',
      fallbackProviderIds: ['browser_use_adapter'],
      verificationStrategy: 'logic_assertion',
      minPrivacyLevel: 'sandboxed'
    });
  }

  registerProvider(provider: CapabilityProvider) {
    this.providers.set(provider.id, provider);
  }

  getCapability(domain: CapabilityDomain): CapabilityDefinition | undefined {
    return this.capabilities.get(domain);
  }

  getAllCapabilities(): CapabilityDefinition[] {
    return Array.from(this.capabilities.values());
  }

  getAllProviders(): CapabilityProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Select best provider based on domain, constraints, and live health
   */
  selectProvider(
    domain: CapabilityDomain, 
    constraints?: { maxLatencyMs?: number; requiresLocalOnly?: boolean }
  ): CapabilityProvider | null {
    const cap = this.capabilities.get(domain);
    if (!cap) return null;

    const candidateIds = [cap.primaryProviderId, ...cap.fallbackProviderIds];
    
    for (const pId of candidateIds) {
      const p = this.providers.get(pId);
      if (p && p.health !== 'offline') {
        if (constraints?.requiresLocalOnly && p.privacyLevel !== 'local_only') {
          continue;
        }
        if (constraints?.maxLatencyMs && p.latencyEstimateMs > constraints.maxLatencyMs) {
          continue;
        }
        return p;
      }
    }

    // Fallback to first available provider
    return this.providers.get(cap.primaryProviderId) || null;
  }
}

export const capabilityGraph = new CapabilityGraph();
