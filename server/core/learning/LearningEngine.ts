export interface ProceduralStrategy {
  id: string;
  taskPattern: string;
  strategyName: string;
  successCount: number;
  failureCount: number;
  failureCausesAvoided: string[];
  confidenceScore: number;
  lastUsed: string;
}

export class LearningEngine {
  private strategies: Map<string, ProceduralStrategy> = new Map();

  constructor() {
    this.seedInitialKnowledge();
  }

  private seedInitialKnowledge() {
    this.strategies.set('strat-open-browser', {
      id: 'strat-open-browser',
      taskPattern: 'open youtube',
      strategyName: 'Protocol URL Launch with Browser Process Observation',
      successCount: 15,
      failureCount: 0,
      failureCausesAvoided: ['Missing local youtube.exe binary'],
      confidenceScore: 0.99,
      lastUsed: new Date().toLocaleTimeString()
    });

    this.strategies.set('strat-editor-typing', {
      id: 'strat-editor-typing',
      taskPattern: 'open notepad and write',
      strategyName: 'Sequential Win32 Launch -> WScript AppActivate -> SendKeys Buffer Verify',
      successCount: 22,
      failureCount: 1,
      failureCausesAvoided: ['C# Add-Type multiline string parsing syntax error'],
      confidenceScore: 0.98,
      lastUsed: new Date().toLocaleTimeString()
    });
  }

  getStrategies(): ProceduralStrategy[] {
    return Array.from(this.strategies.values());
  }

  findBestStrategy(taskDescription: string): ProceduralStrategy | undefined {
    const q = taskDescription.toLowerCase();
    return Array.from(this.strategies.values())
      .filter(s => q.includes(s.taskPattern.toLowerCase()) || s.taskPattern.toLowerCase().includes(q))
      .sort((a, b) => b.confidenceScore - a.confidenceScore)[0];
  }

  recordStrategy(taskPattern: string, strategyName: string, wasSuccess: boolean, failureCause?: string) {
    let strat = Array.from(this.strategies.values()).find(s => s.taskPattern.toLowerCase() === taskPattern.toLowerCase());
    if (!strat) {
      strat = {
        id: 'strat-' + Math.random().toString(36).substring(2, 9),
        taskPattern,
        strategyName,
        successCount: wasSuccess ? 1 : 0,
        failureCount: wasSuccess ? 0 : 1,
        failureCausesAvoided: failureCause ? [failureCause] : [],
        confidenceScore: wasSuccess ? 0.9 : 0.4,
        lastUsed: new Date().toLocaleTimeString()
      };
      this.strategies.set(strat.id, strat);
    } else {
      if (wasSuccess) {
        strat.successCount++;
        strat.strategyName = strategyName;
      } else {
        strat.failureCount++;
        if (failureCause && !strat.failureCausesAvoided.includes(failureCause)) {
          strat.failureCausesAvoided.push(failureCause);
        }
      }
      strat.confidenceScore = strat.successCount / (strat.successCount + strat.failureCount);
      strat.lastUsed = new Date().toLocaleTimeString();
    }
  }
}

export const learningEngine = new LearningEngine();
