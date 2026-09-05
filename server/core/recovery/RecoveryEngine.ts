import { processManager, VerificationResult } from '../../windows/processManager';
import { computerUseEngine } from '../../vision/computerUse';
import { StepRecord } from '../orchestrator/ExecutionStateMachine';
import { learningEngine } from '../learning/LearningEngine';

export interface RecoveryAttempt {
  strategy: 'RETRY' | 'KEYBOARD_SHORTCUT' | 'PROCESS_RESTART' | 'UI_TARS_VISUAL' | 'ALTERNATIVE_PATH';
  success: boolean;
  message: string;
  durationMs: number;
}

export class RecoveryEngine {
  /**
   * Attempt intelligent multi-tier recovery when a step fails verification
   */
  async attemptRecovery(step: StepRecord, errorCause: string): Promise<RecoveryAttempt> {
    const start = Date.now();
    console.warn(`[RecoveryEngine] Initiating recovery for step "${step.action}" (Failure: ${errorCause})`);

    // Tier 1: Retry once with brief delay
    if (step.retryCount < 1) {
      step.retryCount++;
      await new Promise(r => setTimeout(r, 600));

      if (step.tool === 'WindowsProcessManager.launchApp') {
        const res = await processManager.launchApp(step.params.app);
        const durationMs = Date.now() - start;
        if (res.verified) {
          learningEngine.recordStrategy(step.action, 'RETRY', true);
          return {
            strategy: 'RETRY',
            success: true,
            message: `Recovered via retry: ${res.message}`,
            durationMs
          };
        }
      } else if (step.tool === 'WindowsProcessManager.focusWindow') {
        const res = await processManager.focusWindow(step.params.query);
        const durationMs = Date.now() - start;
        if (res.verified) {
          learningEngine.recordStrategy(step.action, 'RETRY', true);
          return {
            strategy: 'RETRY',
            success: true,
            message: `Recovered focus via retry: ${res.message}`,
            durationMs
          };
        }
      }
    }

    // Tier 2: Keyboard shortcut / Windows Hotkey fallback
    if (step.action.toLowerCase().includes('settings') || step.params.app?.toLowerCase().includes('settings')) {
      const success = await computerUseEngine.typeText('^{ESC}'); // Trigger start / shortcut
      const durationMs = Date.now() - start;
      if (success) {
        learningEngine.recordStrategy(step.action, 'KEYBOARD_SHORTCUT', true);
        return {
          strategy: 'KEYBOARD_SHORTCUT',
          success: true,
          message: 'Recovered via keyboard shortcut navigation.',
          durationMs
        };
      }
    }

    // Tier 3: Process restart fallback
    if (step.tool === 'WindowsProcessManager.launchApp') {
      try {
        await processManager.closeApp(step.params.app);
        await new Promise(r => setTimeout(r, 500));
        const res = await processManager.launchApp(step.params.app);
        const durationMs = Date.now() - start;
        if (res.verified) {
          learningEngine.recordStrategy(step.action, 'PROCESS_RESTART', true);
          return {
            strategy: 'PROCESS_RESTART',
            success: true,
            message: `Recovered via process restart: ${res.message}`,
            durationMs
          };
        }
      } catch (e) {
        // Fall through
      }
    }

    const durationMs = Date.now() - start;
    learningEngine.recordStrategy(step.action, 'ALTERNATIVE_PATH', false, errorCause);
    return {
      strategy: 'ALTERNATIVE_PATH',
      success: false,
      message: `Recovery strategies exhausted for step: ${step.action}.`,
      durationMs
    };
  }
}

export const recoveryEngine = new RecoveryEngine();
