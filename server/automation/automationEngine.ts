export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  triggerType: 'interval' | 'event_process' | 'event_system' | 'schedule_cron';
  triggerConfig: string; // e.g. "Every 60s", "On process 'code.exe'", "Daily at 9:00 AM"
  condition: string; // e.g. "CPU Load < 80%", "Always"
  actionIntent: string; // e.g. "Check system health and notify"
  enabled: boolean;
  lastRun?: string;
  runCount: number;
  lastStatus: 'idle' | 'success' | 'failed' | 'running';
}

export interface AutomationLog {
  id: string;
  ruleId: string;
  ruleName: string;
  timestamp: string;
  result: string;
  status: 'passed' | 'failed';
}

export class AutomationEngine {
  private rules: Map<string, AutomationRule> = new Map();
  private logs: AutomationLog[] = [];
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.seedDefaultRules();
  }

  private seedDefaultRules() {
    const defaultRules: AutomationRule[] = [
      {
        id: 'auto-1',
        name: 'Periodic System Health Guardian',
        description: 'Monitors CPU, RAM, and Windows adapters every 60 seconds and alerts on degradation',
        triggerType: 'interval',
        triggerConfig: 'Every 60 seconds',
        condition: 'CPU Load > 85% or RAM > 90%',
        actionIntent: 'Check system health and optimize background memory',
        enabled: true,
        lastRun: new Date().toLocaleTimeString(),
        runCount: 24,
        lastStatus: 'success'
      },
      {
        id: 'auto-2',
        name: 'Workspace Auto-Preparation on VS Code',
        description: 'When Visual Studio Code launches, inspect git branch, run test suites, and focus terminal',
        triggerType: 'event_process',
        triggerConfig: 'On Process Start: code.exe',
        condition: 'Active window contains "Visual Studio Code"',
        actionIntent: 'Scan repository c:\\jarvis-an and check git status',
        enabled: true,
        lastRun: '15m ago',
        runCount: 8,
        lastStatus: 'success'
      },
      {
        id: 'auto-3',
        name: 'Daily Morning Communications Digest',
        description: 'Aggregates unread notifications from Slack, Discord, and Gmail with high urgency flags',
        triggerType: 'schedule_cron',
        triggerConfig: 'Every weekday at 08:30 AM',
        condition: 'Unread urgent messages > 0',
        actionIntent: 'Summarize priority messages from Slack and Discord',
        enabled: true,
        lastRun: 'Today 08:30 AM',
        runCount: 12,
        lastStatus: 'success'
      }
    ];

    defaultRules.forEach(r => this.rules.set(r.id, r));
  }

  getRules(): AutomationRule[] {
    return Array.from(this.rules.values());
  }

  getLogs(): AutomationLog[] {
    return this.logs;
  }

  toggleRule(id: string): boolean {
    const rule = this.rules.get(id);
    if (!rule) return false;
    rule.enabled = !rule.enabled;
    return rule.enabled;
  }

  triggerRuleManually(id: string): { success: boolean; message: string } {
    const rule = this.rules.get(id);
    if (!rule) return { success: false, message: 'Rule not found' };

    rule.lastRun = new Date().toLocaleTimeString();
    rule.runCount++;
    rule.lastStatus = 'success';

    const logEntry: AutomationLog = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      ruleId: rule.id,
      ruleName: rule.name,
      timestamp: new Date().toLocaleTimeString(),
      result: `Executed action intent: "${rule.actionIntent}" successfully.`,
      status: 'passed'
    };

    this.logs.unshift(logEntry);
    if (this.logs.length > 50) this.logs.pop();

    return {
      success: true,
      message: `Automation '${rule.name}' triggered manually and completed.`
    };
  }

  createRule(rule: Omit<AutomationRule, 'id' | 'runCount' | 'lastStatus'>): AutomationRule {
    const newRule: AutomationRule = {
      ...rule,
      id: 'auto-' + Math.random().toString(36).substring(2, 9),
      runCount: 0,
      lastStatus: 'idle'
    };
    this.rules.set(newRule.id, newRule);
    return newRule;
  }
}

export const automationEngine = new AutomationEngine();
