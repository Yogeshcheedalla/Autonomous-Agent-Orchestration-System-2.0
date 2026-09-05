export interface TelemetryData {
  hostType: string;
  osInfo: string;
  cpuLoad: number;
  cpuCores: number;
  memoryUsedMB: number;
  memoryTotalMB: number;
  memoryPercent: number;
  activeWindow: string;
  uptimeSeconds: number;
  adaptersCount: number;
  verifiedAdapters: string[];
}

export interface RunningWindow {
  pid: number;
  name: string;
  windowTitle: string;
  memoryMB: number;
}

export interface MissionData {
  id: string;
  title: string;
  intent: string;
  timestamp: string;
  status: 'running' | 'passed' | 'failed' | 'blocked';
  steps: Array<{
    id: string;
    action: string;
    tool: string;
    status: 'pending' | 'running' | 'passed' | 'failed';
    result?: string;
  }>;
  verification: {
    verified: boolean;
    windowFound: boolean;
    message: string;
    details?: any;
  };
  spokenResponse: string;
  summary: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  target: string;
  riskLevel: 'SAFE' | 'ELEVATED' | 'HIGH_RISK';
  approved: boolean;
  executedBy: string;
  verified: boolean;
}

export const apiService = {
  async getTelemetry(): Promise<TelemetryData> {
    const res = await fetch('/api/telemetry');
    return res.json();
  },

  async getWindows(): Promise<RunningWindow[]> {
    const res = await fetch('/api/windows');
    return res.json();
  },

  async launchApp(app: string, args: string[] = []): Promise<any> {
    const res = await fetch('/api/windows/launch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app, args })
    });
    return res.json();
  },

  async focusWindow(query: string): Promise<any> {
    const res = await fetch('/api/windows/focus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    return res.json();
  },

  async closeApp(target: string): Promise<any> {
    const res = await fetch('/api/windows/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target })
    });
    return res.json();
  },

  async runPowerShell(script: string): Promise<any> {
    const res = await fetch('/api/automation/powershell', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script })
    });
    return res.json();
  },

  async getMissions(): Promise<MissionData[]> {
    const res = await fetch('/api/missions');
    return res.json();
  },

  async createMission(prompt: string): Promise<MissionData> {
    const res = await fetch('/api/missions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    return res.json();
  },

  async getVoiceProviders(): Promise<any> {
    const res = await fetch('/api/voice/providers');
    return res.json();
  },

  async selectVoiceProvider(providerId: string): Promise<any> {
    const res = await fetch('/api/voice/providers/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId })
    });
    return res.json();
  },

  async getUITarsStatus(): Promise<any> {
    const res = await fetch('/api/computer-use/status');
    return res.json();
  },

  async getOdysseusHealth(): Promise<any> {
    const res = await fetch('/api/models/odysseus/health');
    return res.json();
  },

  async getExecutionGraph(): Promise<any> {
    const res = await fetch('/api/missions/state-graph');
    return res.json();
  },

  async getPendingClarifications(): Promise<any> {
    const res = await fetch('/api/clarification/pending');
    return res.json();
  },

  async resolveClarification(missionId: string, response: string): Promise<any> {
    const res = await fetch('/api/clarification/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ missionId, response })
    });
    return res.json();
  },

  async getIntegrationsStatus(): Promise<any> {
    const res = await fetch('/api/integrations/status');
    return res.json();
  },

  async getAuditLog(): Promise<AuditEntry[]> {
    const res = await fetch('/api/security/audit');
    return res.json();
  },

  // --- Phase 3: Vision ---
  async captureScreenshot(): Promise<{ success: boolean; base64Image?: string; metrics?: any; error?: string }> {
    const res = await fetch('/api/vision/screenshot', { method: 'POST' });
    return res.json();
  },

  async executeVisualAction(params: any): Promise<any> {
    const res = await fetch('/api/vision/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return res.json();
  },

  // --- Phase 4: Apps & Repo ---
  async getDiscoveredApps(): Promise<any[]> {
    const res = await fetch('/api/apps');
    return res.json();
  },

  async scanRepo(path: string): Promise<any> {
    const res = await fetch('/api/apps/scan-repo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });
    return res.json();
  },

  // --- Phase 5: Social & Communication ---
  async getSocialInbox(): Promise<any[]> {
    const res = await fetch('/api/social/inbox');
    return res.json();
  },

  async getDrafts(): Promise<any[]> {
    const res = await fetch('/api/social/drafts');
    return res.json();
  },

  async createDraft(draftData: any): Promise<any> {
    const res = await fetch('/api/social/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draftData)
    });
    return res.json();
  },

  async sendApprovedDraft(draftId: string): Promise<any> {
    const res = await fetch('/api/social/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draftId })
    });
    return res.json();
  },

  // --- Phase 4: Agents & DAG ---
  async getAgents(): Promise<any[]> {
    const res = await fetch('/api/agents');
    return res.json();
  },

  async getDAGs(): Promise<any[]> {
    const res = await fetch('/api/agents/dags');
    return res.json();
  },

  async executeDAG(goal: string): Promise<any> {
    const res = await fetch('/api/agents/dag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal })
    });
    return res.json();
  },

  // --- Phase 6: Memory ---
  async getMemories(layer?: string): Promise<any[]> {
    const url = layer ? `/api/memory?layer=${layer}` : '/api/memory';
    const res = await fetch(url);
    return res.json();
  },

  async searchMemories(q: string): Promise<any[]> {
    const res = await fetch(`/api/memory/search?q=${encodeURIComponent(q)}`);
    return res.json();
  },

  async getLearnedStrategies(): Promise<any[]> {
    const res = await fetch('/api/memory/strategies');
    return res.json();
  },

  async addMemory(memData: any): Promise<any> {
    const res = await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memData)
    });
    return res.json();
  },

  // --- Phase 8: Automation ---
  async getAutomationRules(): Promise<any[]> {
    const res = await fetch('/api/automation/rules');
    return res.json();
  },

  async getAutomationLogs(): Promise<any[]> {
    const res = await fetch('/api/automation/logs');
    return res.json();
  },

  async toggleAutomationRule(id: string): Promise<any> {
    const res = await fetch(`/api/automation/rules/${id}/toggle`, { method: 'POST' });
    return res.json();
  },

  async triggerAutomationRule(id: string): Promise<any> {
    const res = await fetch(`/api/automation/rules/${id}/trigger`, { method: 'POST' });
    return res.json();
  },

  // --- Phase 9: Devices ---
  async getDevices(): Promise<any[]> {
    const res = await fetch('/api/devices');
    return res.json();
  },

  async executeDeviceAction(deviceId: string, action: string, value?: any): Promise<any> {
    const res = await fetch(`/api/devices/${deviceId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, value })
    });
    return res.json();
  },

  // --- Phase 10: Security Vault ---
  async getVaultSecrets(): Promise<any[]> {
    const res = await fetch('/api/security/vault');
    return res.json();
  },

  // --- Startup & Desktop Settings ---
  async getStartupStatus(): Promise<any> {
    const res = await fetch('/api/startup/status');
    return res.json();
  },

  async runStartupBoot(): Promise<any> {
    const res = await fetch('/api/startup/boot', { method: 'POST' });
    return res.json();
  },

  async getStartupHealth(): Promise<any[]> {
    const res = await fetch('/api/startup/health');
    return res.json();
  },

  async getStartupSettings(): Promise<any> {
    const res = await fetch('/api/settings/startup');
    return res.json();
  },

  async saveStartupSettings(config: any): Promise<any> {
    const res = await fetch('/api/settings/startup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return res.json();
  }
};

