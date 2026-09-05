export type RiskLevel = 'SAFE' | 'ELEVATED' | 'HIGH_RISK';

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  target: string;
  riskLevel: RiskLevel;
  approved: boolean;
  executedBy: string;
  verified: boolean;
}

export class SecurityGuard {
  private auditLog: AuditEntry[] = [];

  evaluateRisk(action: string, target: string): RiskLevel {
    const lowerAction = action.toLowerCase();
    const lowerTarget = target.toLowerCase();

    if (
      lowerTarget.includes('format') || 
      lowerTarget.includes('rmdir /s') || 
      lowerTarget.includes('del /f') ||
      lowerTarget.includes('shutdown') ||
      lowerTarget.includes('restart-computer')
    ) {
      return 'HIGH_RISK';
    }

    if (
      lowerAction.includes('close') || 
      lowerAction.includes('kill') || 
      lowerAction.includes('stop-process')
    ) {
      return 'ELEVATED';
    }

    return 'SAFE';
  }

  logDecision(action: string, target: string, riskLevel: RiskLevel, approved: boolean, verified: boolean): AuditEntry {
    const entry: AuditEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      action,
      target,
      riskLevel,
      approved,
      executedBy: 'Akansha Master Orchestrator',
      verified
    };
    this.auditLog.unshift(entry);
    if (this.auditLog.length > 50) this.auditLog.pop();
    return entry;
  }

  getAuditLog(): AuditEntry[] {
    return this.auditLog;
  }
}

export const securityGuard = new SecurityGuard();
