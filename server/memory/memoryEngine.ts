export type MemoryLayer = 
  | 'working'
  | 'conversation'
  | 'task'
  | 'project'
  | 'long_term'
  | 'semantic'
  | 'learned_strategies';

export interface MemoryEntry {
  id: string;
  layer: MemoryLayer;
  key: string;
  content: string;
  metadata?: any;
  confidence: number;
  timestamp: string;
  accessCount: number;
}

export interface LearnedStrategy {
  id: string;
  taskType: string;
  successfulToolSequence: string[];
  failureCausesAvoided: string[];
  successCount: number;
  failureCount: number;
  confidenceScore: number;
  lastUpdated: string;
}

export class MemoryEngine {
  private memories: Map<string, MemoryEntry> = new Map();
  private strategies: Map<string, LearnedStrategy> = new Map();

  constructor() {
    this.seedInitialMemories();
  }

  private seedInitialMemories() {
    const seeds: MemoryEntry[] = [
      {
        id: 'mem-1',
        layer: 'project',
        key: 'active_workspace',
        content: 'Primary workspace located at c:\\jarvis-an. Uses TypeScript, Node.js, Express, React, and Vite with Windows 11 host integration.',
        confidence: 1.0,
        timestamp: new Date().toLocaleTimeString(),
        accessCount: 18
      },
      {
        id: 'mem-2',
        layer: 'long_term',
        key: 'user_preferences',
        content: 'User prefers native Windows control over cloud mocks, instant hardware barge-in, dark aesthetic glassmorphism UI, and no mandatory OpenAI keys.',
        confidence: 0.98,
        timestamp: new Date().toLocaleTimeString(),
        accessCount: 32
      },
      {
        id: 'mem-3',
        layer: 'semantic',
        key: 'qwen_voice_routing',
        content: 'VoiceRouter selects Qwen Audio as the primary multimodal model and Local Whisper/TTS as the offline fallback.',
        confidence: 0.95,
        timestamp: new Date().toLocaleTimeString(),
        accessCount: 14
      },
      {
        id: 'mem-4',
        layer: 'learned_strategies',
        key: 'strategy_launch_verification',
        content: 'Always query Windows process table for PID and HWND before declaring an application launch complete.',
        confidence: 0.99,
        timestamp: new Date().toLocaleTimeString(),
        accessCount: 45
      }
    ];

    seeds.forEach(m => this.memories.set(m.id, m));

    this.strategies.set('strat-1', {
      id: 'strat-1',
      taskType: 'App Launch & Focus',
      successfulToolSequence: ['WindowsProcessManager.launchApp', 'WindowsProcessManager.focusWindow', 'ActionVerifier.verifyPID'],
      failureCausesAvoided: ['Premature completion before HWND rendered'],
      successCount: 48,
      failureCount: 1,
      confidenceScore: 0.98,
      lastUpdated: new Date().toLocaleTimeString()
    });

    this.strategies.set('strat-2', {
      id: 'strat-2',
      taskType: 'Voice Command Execution',
      successfulToolSequence: ['AudioStreamHandler.sileroVAD', 'VoiceRouter.transcribe', 'MasterOrchestrator.execute', 'AudioStreamHandler.bargeInMonitor'],
      failureCausesAvoided: ['Unchecked cloud API dependency', 'TTS overlap without barge-in'],
      successCount: 65,
      failureCount: 0,
      confidenceScore: 1.0,
      lastUpdated: new Date().toLocaleTimeString()
    });
  }

  getMemories(layer?: MemoryLayer): MemoryEntry[] {
    const list = Array.from(this.memories.values());
    if (layer) {
      return list.filter(m => m.layer === layer);
    }
    return list;
  }

  searchMemories(query: string): MemoryEntry[] {
    const q = query.toLowerCase();
    return Array.from(this.memories.values())
      .filter(m => m.key.toLowerCase().includes(q) || m.content.toLowerCase().includes(q) || m.layer.toLowerCase().includes(q))
      .map(m => {
        m.accessCount++;
        return m;
      });
  }

  addMemory(layer: MemoryLayer, key: string, content: string, confidence: number = 0.9): MemoryEntry {
    const entry: MemoryEntry = {
      id: 'mem-' + Math.random().toString(36).substring(2, 9),
      layer,
      key,
      content,
      confidence,
      timestamp: new Date().toLocaleTimeString(),
      accessCount: 1
    };
    this.memories.set(entry.id, entry);
    return entry;
  }

  getLearnedStrategies(): LearnedStrategy[] {
    return Array.from(this.strategies.values());
  }

  recordExperience(taskType: string, toolsUsed: string[], wasSuccess: boolean, errorCause?: string) {
    let strat = Array.from(this.strategies.values()).find(s => s.taskType.toLowerCase() === taskType.toLowerCase());
    if (!strat) {
      strat = {
        id: 'strat-' + Math.random().toString(36).substring(2, 9),
        taskType,
        successfulToolSequence: wasSuccess ? toolsUsed : [],
        failureCausesAvoided: errorCause ? [errorCause] : [],
        successCount: wasSuccess ? 1 : 0,
        failureCount: wasSuccess ? 0 : 1,
        confidenceScore: wasSuccess ? 0.9 : 0.5,
        lastUpdated: new Date().toLocaleTimeString()
      };
      this.strategies.set(strat.id, strat);
    } else {
      if (wasSuccess) {
        strat.successCount++;
        strat.successfulToolSequence = toolsUsed;
      } else {
        strat.failureCount++;
        if (errorCause && !strat.failureCausesAvoided.includes(errorCause)) {
          strat.failureCausesAvoided.push(errorCause);
        }
      }
      strat.confidenceScore = strat.successCount / (strat.successCount + strat.failureCount);
      strat.lastUpdated = new Date().toLocaleTimeString();
    }
  }
}

export const memoryEngine = new MemoryEngine();
