export interface OdysseusStatus {
  service: 'Odysseus Local AI';
  connected: boolean;
  endpoint: string;
  models: string[];
  activeModel?: string;
  latencyMs: number;
  lastChecked: string;
  error?: string;
}

export class OdysseusAdapter {
  private endpoint: string = process.env.ODYSSEUS_ENDPOINT || 'http://localhost:11434';
  private isConnected: boolean = false;
  private availableModels: string[] = [];
  private lastChecked: string = new Date().toISOString();

  /**
   * Probe actual runtime health of local Odysseus instance
   */
  async checkHealth(): Promise<OdysseusStatus> {
    const startTime = Date.now();
    let errorMessage: string | undefined;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      // Probe standard local API / health endpoint
      const res = await fetch(`${this.endpoint}/api/tags`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        this.isConnected = true;
        this.availableModels = (data.models || []).map((m: any) => m.name || m.id || m);
      } else {
        this.isConnected = false;
        errorMessage = `HTTP ${res.status}: Endpoint returned non-200`;
      }
    } catch (err: any) {
      this.isConnected = false;
      this.availableModels = [];
      errorMessage = err.name === 'AbortError' ? 'Connection timed out' : 'Service unreachable (Offline)';
    }

    const latency = Date.now() - startTime;
    this.lastChecked = new Date().toISOString();

    return {
      service: 'Odysseus Local AI',
      connected: this.isConnected,
      endpoint: this.endpoint,
      models: this.availableModels,
      activeModel: this.availableModels[0],
      latencyMs: this.isConnected ? latency : 0,
      lastChecked: this.lastChecked,
      error: this.isConnected ? undefined : errorMessage
    };
  }

  /**
   * Execute inference query through Odysseus if online
   */
  async generateResponse(prompt: string, systemPrompt?: string): Promise<{ text: string; success: boolean }> {
    if (!this.isConnected) {
      return {
        text: '',
        success: false
      };
    }

    try {
      const res = await fetch(`${this.endpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.availableModels[0] || 'qwen2.5:latest',
          prompt,
          system: systemPrompt,
          stream: false
        })
      });

      if (res.ok) {
        const data = await res.json();
        return { text: data.response || '', success: true };
      }
    } catch (err: any) {
      console.warn('[OdysseusAdapter] Inference failed:', err.message);
    }

    return { text: '', success: false };
  }
}

export const odysseusAdapter = new OdysseusAdapter();
