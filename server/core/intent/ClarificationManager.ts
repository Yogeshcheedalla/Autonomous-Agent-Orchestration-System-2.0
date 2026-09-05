import { executionStateMachine, MissionCheckpoint } from '../orchestrator/ExecutionStateMachine';

export interface ClarificationRequest {
  missionId: string;
  question: string;
  options?: string[];
  blockedStepIndex: number;
  createdAt: number;
}

export class ClarificationManager {
  private pendingRequests: Map<string, ClarificationRequest> = new Map();

  requestClarification(missionId: string, question: string, options?: string[], blockedStepIndex: number = 0): ClarificationRequest {
    const request: ClarificationRequest = {
      missionId,
      question,
      options,
      blockedStepIndex,
      createdAt: Date.now()
    };

    this.pendingRequests.set(missionId, request);
    executionStateMachine.transition(missionId, 'WAITING_FOR_CLARIFICATION', {
      clarificationPrompt: question
    });

    console.log(`[ClarificationManager] Mission ${missionId} paused for clarification: "${question}"`);
    return request;
  }

  getPendingRequest(missionId: string): ClarificationRequest | undefined {
    return this.pendingRequests.get(missionId);
  }

  getAllPending(): ClarificationRequest[] {
    return Array.from(this.pendingRequests.values());
  }

  /**
   * Resume an execution plan with the user's clarified answer without restarting from scratch
   */
  resolveClarification(missionId: string, userResponse: string): { success: boolean; message: string; mission?: MissionCheckpoint } {
    const request = this.pendingRequests.get(missionId);
    if (!request) {
      return { success: false, message: `No pending clarification for mission ${missionId}` };
    }

    const mission = executionStateMachine.getMission(missionId);
    if (!mission) {
      return { success: false, message: `Mission ${missionId} not found` };
    }

    // Update mission context data with clarification answer
    mission.contextData['clarification_' + request.blockedStepIndex] = userResponse;
    mission.contextData['selectedOption'] = userResponse;
    this.pendingRequests.delete(missionId);

    // Transition state from WAITING_FOR_CLARIFICATION to EXECUTING
    executionStateMachine.transition(missionId, 'EXECUTING', {
      clarificationPrompt: undefined,
      currentStepIndex: request.blockedStepIndex
    });

    console.log(`[ClarificationManager] Mission ${missionId} resumed from step ${request.blockedStepIndex} with user input: "${userResponse}"`);
    return {
      success: true,
      message: `Clarification applied. Resuming mission from step ${request.blockedStepIndex + 1}.`,
      mission
    };
  }
}

export const clarificationManager = new ClarificationManager();
