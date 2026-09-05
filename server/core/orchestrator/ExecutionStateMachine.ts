import crypto from 'crypto';
const uuidv4 = () => crypto.randomUUID();

export type MissionState = 
  | 'RECEIVED'
  | 'CLASSIFIED'
  | 'PLANNING'
  | 'WAITING_FOR_APPROVAL'
  | 'WAITING_FOR_CLARIFICATION'
  | 'EXECUTING'
  | 'OBSERVING'
  | 'VERIFYING'
  | 'RECOVERING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED';

export interface StepRecord {
  id: string;
  stepIndex: number;
  action: string;
  tool: string;
  params: Record<string, any>;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped' | 'recovering';
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  observation?: string;
  verification?: {
    verified: boolean;
    evidence: string;
    details?: any;
  };
  retryCount: number;
  error?: string;
}

export interface MissionCheckpoint {
  missionId: string;
  title: string;
  rawPrompt: string;
  intentCategory: string;
  currentState: MissionState;
  currentStepIndex: number;
  steps: StepRecord[];
  clarificationPrompt?: string;
  pendingApprovalAction?: string;
  contextData: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  metrics: {
    intentLatencyMs: number;
    planLatencyMs: number;
    toolLatencyMs: number;
    verifyLatencyMs: number;
    recoveryLatencyMs: number;
    totalLatencyMs: number;
  };
}

export class ExecutionStateMachine {
  private activeMissions: Map<string, MissionCheckpoint> = new Map();
  private stateListeners: Set<(mission: MissionCheckpoint) => void> = new Set();

  createMission(rawPrompt: string, intentCategory: string, title?: string): MissionCheckpoint {
    const id = 'msn-' + Math.random().toString(36).substring(2, 9);
    const checkpoint: MissionCheckpoint = {
      missionId: id,
      title: title || (rawPrompt.length > 40 ? rawPrompt.substring(0, 37) + '...' : rawPrompt),
      rawPrompt,
      intentCategory,
      currentState: 'RECEIVED',
      currentStepIndex: 0,
      steps: [],
      contextData: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metrics: {
        intentLatencyMs: 0,
        planLatencyMs: 0,
        toolLatencyMs: 0,
        verifyLatencyMs: 0,
        recoveryLatencyMs: 0,
        totalLatencyMs: 0
      }
    };

    this.activeMissions.set(id, checkpoint);
    this.notifyStateChange(checkpoint);
    return checkpoint;
  }

  transition(missionId: string, nextState: MissionState, updates?: Partial<MissionCheckpoint>): MissionCheckpoint {
    const mission = this.activeMissions.get(missionId);
    if (!mission) {
      throw new Error(`Mission with ID ${missionId} not found`);
    }

    mission.currentState = nextState;
    mission.updatedAt = Date.now();

    if (updates) {
      Object.assign(mission, updates);
    }

    if (nextState === 'SUCCEEDED' || nextState === 'FAILED' || nextState === 'CANCELLED') {
      mission.metrics.totalLatencyMs = mission.updatedAt - mission.createdAt;
    }

    this.notifyStateChange(mission);
    return mission;
  }

  getMission(missionId: string): MissionCheckpoint | undefined {
    return this.activeMissions.get(missionId);
  }

  getAllMissions(): MissionCheckpoint[] {
    return Array.from(this.activeMissions.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  addStep(missionId: string, action: string, tool: string, params: Record<string, any> = {}): StepRecord {
    const mission = this.activeMissions.get(missionId);
    if (!mission) throw new Error(`Mission ${missionId} not found`);

    const step: StepRecord = {
      id: `step-${mission.steps.length + 1}`,
      stepIndex: mission.steps.length,
      action,
      tool,
      params,
      status: 'pending',
      retryCount: 0
    };

    mission.steps.push(step);
    mission.updatedAt = Date.now();
    this.notifyStateChange(mission);
    return step;
  }

  updateStep(missionId: string, stepId: string, updates: Partial<StepRecord>): StepRecord {
    const mission = this.activeMissions.get(missionId);
    if (!mission) throw new Error(`Mission ${missionId} not found`);

    const step = mission.steps.find(s => s.id === stepId);
    if (!step) throw new Error(`Step ${stepId} not found in mission ${missionId}`);

    Object.assign(step, updates);
    mission.updatedAt = Date.now();
    this.notifyStateChange(mission);
    return step;
  }

  onStateChange(listener: (mission: MissionCheckpoint) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private notifyStateChange(mission: MissionCheckpoint) {
    for (const listener of this.stateListeners) {
      try {
        listener(mission);
      } catch (err) {
        console.error('[ExecutionStateMachine] Listener error:', err);
      }
    }
  }
}

export const executionStateMachine = new ExecutionStateMachine();
