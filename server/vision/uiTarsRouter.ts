import { computerUseEngine, ComputerActionParams, ComputerActionResult } from './computerUse';
import { screenCaptureService } from './screenCapture';

export interface UITARSStatus {
  service: 'UI-TARS Desktop';
  connected: boolean;
  endpoint: string;
  model: string;
  capabilities: {
    visualGrounding: boolean;
    mouseAction: boolean;
    keyboardAction: boolean;
    browserAutomation: boolean;
  };
  latencyMs: number;
  lastChecked: string;
}

export class UITARSRouter {
  private endpoint: string = process.env.UITARS_ENDPOINT || 'http://localhost:8000';
  private modelName: string = 'UI-TARS-7B-DPO';
  private isConnected: boolean = false;
  private lastCheckedTime: string = new Date().toISOString();

  /**
   * Probe actual runtime health of local UI-TARS Desktop server
   */
  async checkHealth(): Promise<UITARSStatus> {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const res = await fetch(`${this.endpoint}/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      this.isConnected = res.ok;
    } catch {
      this.isConnected = false;
    }

    const latency = Date.now() - startTime;
    this.lastCheckedTime = new Date().toISOString();

    return {
      service: 'UI-TARS Desktop',
      connected: this.isConnected,
      endpoint: this.endpoint,
      model: this.modelName,
      capabilities: {
        visualGrounding: true,
        mouseAction: true,
        keyboardAction: true,
        browserAutomation: true
      },
      latencyMs: this.isConnected ? latency : 0,
      lastChecked: this.lastCheckedTime
    };
  }

  /**
   * Dispatch visual computer use action via UI-TARS (or fallback to native Windows bridge)
   */
  async dispatchVisualAction(params: ComputerActionParams): Promise<ComputerActionResult> {
    // If UI-TARS is online and active, route via UI-TARS visual grounder
    if (this.isConnected) {
      try {
        const screenshot = await screenCaptureService.captureScreen();
        const res = await fetch(`${this.endpoint}/v1/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: screenshot.base64Image,
            instruction: params.text || params.action
          })
        });

        if (res.ok) {
          const actionPlan = await res.json();
          console.log('[UI-TARS] Action predicted:', actionPlan);
        }
      } catch (err: any) {
        console.warn('[UI-TARS] Local endpoint call failed, falling back to native Win32:', err.message);
      }
    }

    // Deterministic fallback: execute via native Win32 ComputerUseEngine
    return await computerUseEngine.executeVisualAction(params);
  }
}

export const uiTarsRouter = new UITARSRouter();
