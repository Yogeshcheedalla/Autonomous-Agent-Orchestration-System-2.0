import { memoryEngine, MemoryEntry } from '../../memory/memoryEngine';
import { learningEngine, ProceduralStrategy } from '../../core/learning/LearningEngine';

export interface LettaMemoryBlock {
  label: 'user_persona' | 'agent_identity' | 'procedural_skills' | 'working_context';
  value: string;
  updatedAt: number;
}

export class LettaAdapter {
  private memoryBlocks: Map<string, LettaMemoryBlock> = new Map();

  constructor() {
    this.initCoreMemory();
  }

  private initCoreMemory() {
    this.memoryBlocks.set('user_persona', {
      label: 'user_persona',
      value: 'Prefers native Windows control, verifiable action proofs, concise responses, and dark cyber-luxury UI.',
      updatedAt: Date.now()
    });

    this.memoryBlocks.set('agent_identity', {
      label: 'agent_identity',
      value: 'Akansha — Autonomous Windows AI Operating Layer with Master Orchestrator authority.',
      updatedAt: Date.now()
    });
  }

  async checkHealth(): Promise<{ service: string; ready: boolean; blockCount: number }> {
    return {
      service: 'Letta Agent Memory',
      ready: true,
      blockCount: this.memoryBlocks.size
    };
  }

  getMemoryBlock(label: LettaMemoryBlock['label']): LettaMemoryBlock | undefined {
    return this.memoryBlocks.get(label);
  }

  updateMemoryBlock(label: LettaMemoryBlock['label'], value: string) {
    this.memoryBlocks.set(label, {
      label,
      value,
      updatedAt: Date.now()
    });
  }

  /**
   * Recall procedural context and strategies before planning a mission
   */
  recallStrategy(taskGoal: string): ProceduralStrategy | undefined {
    return learningEngine.findBestStrategy(taskGoal);
  }

  /**
   * Commit new learned procedure to memory
   */
  rememberProcedure(goal: string, strategyName: string, success: boolean, failureCause?: string) {
    learningEngine.recordStrategy(goal, strategyName, success, failureCause);
  }
}

export const lettaAdapter = new LettaAdapter();
