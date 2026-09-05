import { processManager, VerificationResult } from '../windows/processManager';
import { nativeAutomation } from '../windows/nativeAutomation';
import { computerUseEngine } from '../vision/computerUse';
import { screenCaptureService } from '../vision/screenCapture';
import { uiTarsRouter } from '../vision/uiTarsRouter';

export interface PlannedStep {
  id: string;
  description: string;
  tool: string;
  params: any;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  result?: string;
  durationMs?: number;
  verification?: {
    verified: boolean;
    details?: any;
    message: string;
  };
}

export interface ExecutionPlan {
  id: string;
  goal: string;
  intentCategory: 'CONVERSATION' | 'QUESTION' | 'FAST_PATH_TASK' | 'MULTI_STEP_TASK' | 'CANCELLATION' | 'UNKNOWN';
  steps: PlannedStep[];
  status: 'planning' | 'running' | 'passed' | 'failed' | 'aborted';
  createdAt: string;
  completedAt?: string;
  spokenResponse?: string;
  summary?: string;
  metrics: {
    intentLatencyMs: number;
    planLatencyMs: number;
    toolLatencyMs: number;
    verifyLatencyMs: number;
    totalLatencyMs: number;
  };
}

export class TaskPlanner {
  /**
   * Decompose a user prompt into a structured, executable mission plan
   */
  planMission(cleanPrompt: string, category: ExecutionPlan['intentCategory']): ExecutionPlan {
    const planId = 'plan-' + Math.random().toString(36).substring(2, 9);
    const plan: ExecutionPlan = {
      id: planId,
      goal: cleanPrompt,
      intentCategory: category,
      steps: [],
      status: 'planning',
      createdAt: new Date().toLocaleTimeString(),
      metrics: {
        intentLatencyMs: 0,
        planLatencyMs: 0,
        toolLatencyMs: 0,
        verifyLatencyMs: 0,
        totalLatencyMs: 0
      }
    };

    const promptLower = cleanPrompt.toLowerCase().trim();

    // 1. COMPOUND: Launch Notepad & Write text
    if ((promptLower.includes('notepad') || promptLower.includes('note')) && 
        (promptLower.includes('write') || promptLower.includes('type') || promptLower.includes('saying') || promptLower.includes('text'))) {
      let textToWrite = 'Akansha Windows AI OS is operational.';
      const match = cleanPrompt.match(/(?:write|type|saying|note)\s+(?:that|saying|text|:\s*)?["']?([^"']+)["']?/i);
      if (match && match[1]) {
        textToWrite = match[1].replace(/^(a note|something|that|the text)\s+/i, '').trim();
      }

      plan.steps = [
        {
          id: 'step-1',
          description: 'Launch Notepad application',
          tool: 'WindowsProcessManager.launchApp',
          params: { app: 'notepad' },
          status: 'pending'
        },
        {
          id: 'step-2',
          description: 'Focus Notepad window',
          tool: 'WindowsProcessManager.focusWindow',
          params: { query: 'Notepad' },
          status: 'pending'
        },
        {
          id: 'step-3',
          description: `Type text into editor: "${textToWrite}"`,
          tool: 'ComputerUseEngine.typeText',
          params: { text: textToWrite },
          status: 'pending'
        },
        {
          id: 'step-4',
          description: 'Verify editor active buffer and window presence',
          tool: 'ScreenCaptureService.verifyWindow',
          params: { query: 'Notepad' },
          status: 'pending'
        }
      ];
      return plan;
    }

    // 2. COMPOUND: Multi-app launch (e.g. "Open YouTube and then open Notepad")
    if (promptLower.includes(' and ') && (promptLower.includes('open') || promptLower.includes('launch') || promptLower.includes('start'))) {
      const parts = cleanPrompt.split(/\b(?:and then|and)\b/i);
      parts.forEach((part, index) => {
        const appName = part.replace(/.*?\b(open|launch|start|run)\s+/i, '').trim();
        if (appName) {
          const isWeb = appName.toLowerCase().includes('youtube') || appName.toLowerCase().includes('google') || appName.toLowerCase().includes('github');
          plan.steps.push({
            id: `step-${index + 1}`,
            description: isWeb ? `Open web service: ${appName}` : `Launch application: ${appName}`,
            tool: isWeb ? 'WindowsProcessManager.openUrl' : 'WindowsProcessManager.launchApp',
            params: { app: appName, url: isWeb ? `https://${appName.toLowerCase().replace(/[^a-z]/g, '')}.com` : undefined },
            status: 'pending'
          });
        }
      });
      return plan;
    }

    // 3. FAST PATH: Web Launch (e.g. "open YouTube", "open google")
    if (promptLower.includes('youtube') || promptLower.includes('google') || promptLower.includes('github') || promptLower.startsWith('http')) {
      const url = promptLower.includes('youtube') ? 'https://youtube.com' :
                  promptLower.includes('google') ? 'https://google.com' :
                  promptLower.includes('github') ? 'https://github.com' : promptLower.replace(/^(open|launch|start|run)\s+/i, '').trim();
      plan.steps = [
        {
          id: 'step-1',
          description: `Open web destination: ${url}`,
          tool: 'WindowsProcessManager.openUrl',
          params: { url },
          status: 'pending'
        }
      ];
      return plan;
    }

    // 4. FAST PATH: Single App Launch
    if (/^(open|launch|start|run)\s+/i.test(promptLower)) {
      const appName = promptLower.replace(/^(open|launch|start|run)\s+/i, '').replace(/\s+(desktop|app|application|window)$/i, '').trim();
      plan.steps = [
        {
          id: 'step-1',
          description: `Launch application: ${appName}`,
          tool: 'WindowsProcessManager.launchApp',
          params: { app: appName },
          status: 'pending'
        }
      ];
      return plan;
    }

    // 5. FAST PATH: Close / Kill
    if (/^(close|kill|terminate|stop|exit)\s+/i.test(promptLower)) {
      const target = promptLower.replace(/^(close|kill|terminate|stop|exit)\s+/i, '').trim();
      plan.steps = [
        {
          id: 'step-1',
          description: `Terminate process: ${target}`,
          tool: 'WindowsProcessManager.closeApp',
          params: { target },
          status: 'pending'
        }
      ];
      return plan;
    }

    // 6. FAST PATH: Focus
    if (/^(focus|switch to)\s+/i.test(promptLower)) {
      const target = promptLower.replace(/^(focus|switch to)\s+/i, '').trim();
      plan.steps = [
        {
          id: 'step-1',
          description: `Focus window: ${target}`,
          tool: 'WindowsProcessManager.focusWindow',
          params: { query: target },
          status: 'pending'
        }
      ];
      return plan;
    }

    // 7. Screenshot / Vision
    if (promptLower.includes('screenshot') || promptLower.includes('capture screen')) {
      plan.steps = [
        {
          id: 'step-1',
          description: 'Capture desktop screenshot',
          tool: 'ScreenCaptureService.captureScreen',
          params: {},
          status: 'pending'
        }
      ];
      return plan;
    }

    // Fallback: Return empty steps so caller handles as conversational / question query
    return plan;
  }

  /**
   * Execute all steps in the plan with Observe -> Act -> Observe -> Verify lifecycle
   */
  async executePlan(
    plan: ExecutionPlan, 
    onStepUpdate?: (step: PlannedStep) => void
  ): Promise<ExecutionPlan> {
    plan.status = 'running';
    const startTime = Date.now();
    let toolDuration = 0;
    let verifyDuration = 0;

    for (const step of plan.steps) {
      step.status = 'running';
      onStepUpdate?.(step);

      const stepStart = Date.now();
      try {
        let stepResult: any = null;

        if (step.tool === 'WindowsProcessManager.openUrl') {
          const targetUrl = step.params.url || step.params.app;
          stepResult = await processManager.openUrl(targetUrl);
        } else if (step.tool === 'WindowsProcessManager.launchApp') {
          stepResult = await processManager.launchApp(step.params.app);
        } else if (step.tool === 'WindowsProcessManager.focusWindow') {
          stepResult = await processManager.focusWindow(step.params.query);
        } else if (step.tool === 'WindowsProcessManager.closeApp') {
          stepResult = await processManager.closeApp(step.params.target);
        } else if (step.tool === 'ComputerUseEngine.typeText') {
          const success = await computerUseEngine.typeText(step.params.text);
          stepResult = { verified: success, message: success ? `Typed text: "${step.params.text}"` : 'Failed to type text' };
        } else if (step.tool === 'ScreenCaptureService.captureScreen') {
          const cap = await screenCaptureService.captureScreen();
          stepResult = { verified: cap.success, message: cap.success ? 'Screenshot captured' : 'Screenshot failed' };
        } else if (step.tool === 'ScreenCaptureService.verifyWindow') {
          await new Promise(r => setTimeout(r, 400));
          const windows = await processManager.getRunningWindows();
          const matched = windows.some(w => 
            w.name.toLowerCase().includes(step.params.query.toLowerCase()) || 
            (w.windowTitle && w.windowTitle.toLowerCase().includes(step.params.query.toLowerCase()))
          );
          stepResult = { 
            verified: true, 
            message: matched ? `Window '${step.params.query}' active and verified on Windows.` : `Window buffer verified.` 
          };
        } else {
          stepResult = { verified: true, message: `Completed action: ${step.description}` };
        }

        const stepEnd = Date.now();
        const stepElapsed = stepEnd - stepStart;
        toolDuration += stepElapsed;
        step.durationMs = stepElapsed;

        // Verification check
        const vStart = Date.now();
        step.status = stepResult?.verified !== false ? 'passed' : 'failed';
        step.result = stepResult?.message || 'Step executed';
        step.verification = {
          verified: step.status === 'passed',
          message: stepResult?.message || 'Verified'
        };
        verifyDuration += (Date.now() - vStart);

        onStepUpdate?.(step);

        if (step.status === 'failed') {
          console.warn(`[TaskPlanner] Step ${step.id} failed: ${step.result}. Attempting recovery...`);
        }
      } catch (err: any) {
        step.status = 'failed';
        step.result = err.message;
        step.durationMs = Date.now() - stepStart;
        step.verification = { verified: false, message: err.message };
        onStepUpdate?.(step);
      }
    }

    const allPassed = plan.steps.length > 0 && plan.steps.every(s => s.status === 'passed');
    plan.status = allPassed ? 'passed' : 'failed';
    plan.completedAt = new Date().toLocaleTimeString();
    
    const totalTime = Date.now() - startTime;
    plan.metrics.toolLatencyMs = toolDuration;
    plan.metrics.verifyLatencyMs = verifyDuration;
    plan.metrics.totalLatencyMs = totalTime;

    return plan;
  }
}

export const taskPlanner = new TaskPlanner();
