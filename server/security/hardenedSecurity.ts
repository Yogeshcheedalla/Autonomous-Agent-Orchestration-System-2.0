export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SecurityPolicy {
  autonomousExecutionAllowed: boolean;
  requiresPromptConfirmation: boolean;
  requiresElevatedPrivilege: boolean;
  isolationLevel: 'standard' | 'sandboxed' | 'strict_quarantine';
}

export interface VaultSecret {
  key: string;
  category: 'api_key' | 'oauth_token' | 'device_pin' | 'env_credential';
  hasValue: boolean;
  lastRotated: string;
}

export interface RecoveryAction {
  failureType: 'transient_timeout' | 'permission_denied' | 'process_not_found' | 'visual_verification_failed' | 'model_exhaustion';
  suggestedStrategy: 'retry_with_backoff' | 'alternate_tool' | 'rollback_state' | 'ask_user' | 'safe_stop';
  description: string;
}

export class HardenedSecurityEngine {
  private secrets: Map<string, string> = new Map();
  private promptInjectionPatterns: RegExp[] = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /system\s*:\s*you\s+are\s+now/i,
    /delete\s+c:\\windows/i,
    /format\s+[c-z]:/i,
    /bypass\s+security\s+policy/i,
    /reveal\s+(all\s+)?(api_keys|passwords|vault)/i
  ];

  constructor() {
    // Seed initial vault keys without exposing raw plaintext
    this.secrets.set('OPENAI_API_KEY', process.env.OPENAI_API_KEY || '');
    this.secrets.set('SLACK_BOT_TOKEN', 'xoxb-sandbox-token-secured');
    this.secrets.set('DISCORD_BOT_TOKEN', 'bot-sandbox-token-secured');
  }

  /**
   * Assess risk tier for any requested tool or action
   */
  classifyRisk(action: string, target: string): { tier: RiskTier; policy: SecurityPolicy; reason: string } {
    const act = action.toLowerCase();
    const tgt = target.toLowerCase();

    // Critical: Irreversible destructive operations
    if (tgt.includes('format') || tgt.includes('rmdir /s') || tgt.includes('del /f /s') || act.includes('shutdown') || act.includes('wipe')) {
      return {
        tier: 'CRITICAL',
        policy: { autonomousExecutionAllowed: false, requiresPromptConfirmation: true, requiresElevatedPrivilege: true, isolationLevel: 'strict_quarantine' },
        reason: 'Action involves high-impact system destruction or shutdown.'
      };
    }

    // High: System process termination, credential access
    if (act.includes('kill') || act.includes('stop-process') || tgt.includes('vault') || act.includes('modify-registry')) {
      return {
        tier: 'HIGH',
        policy: { autonomousExecutionAllowed: false, requiresPromptConfirmation: true, requiresElevatedPrivilege: true, isolationLevel: 'sandboxed' },
        reason: 'Consequential action requiring user gate approval.'
      };
    }

    // Medium: Sending outgoing social messages, creating files
    if (act.includes('send') || act.includes('post') || act.includes('write-file')) {
      return {
        tier: 'MEDIUM',
        policy: { autonomousExecutionAllowed: false, requiresPromptConfirmation: true, requiresElevatedPrivilege: false, isolationLevel: 'standard' },
        reason: 'Outgoing network or disk mutation.'
      };
    }

    // Low: Telemetry, screenshots, reading, launching safe GUI apps
    return {
      tier: 'LOW',
      policy: { autonomousExecutionAllowed: true, requiresPromptConfirmation: false, requiresElevatedPrivilege: false, isolationLevel: 'standard' },
      reason: 'Read-only or benign operational action.'
    };
  }

  /**
   * Check for prompt injection attempts
   */
  validateInputSafety(text: string): { safe: boolean; detectedThreat?: string } {
    for (const pattern of this.promptInjectionPatterns) {
      if (pattern.test(text)) {
        return {
          safe: false,
          detectedThreat: `Blocked suspicious pattern matching '${pattern.source}'`
        };
      }
    }
    return { safe: true };
  }

  /**
   * Get metadata list of vault secrets (never exposing plaintext)
   */
  getVaultMetadata(): VaultSecret[] {
    return Array.from(this.secrets.entries()).map(([key, val]) => ({
      key,
      category: key.includes('KEY') ? 'api_key' : key.includes('TOKEN') ? 'oauth_token' : 'env_credential',
      hasValue: val.length > 0,
      lastRotated: '2026-09-04'
    }));
  }

  /**
   * Recovery Engine: classify failure and provide auto-resolution strategy
   */
  classifyFailure(errorMsg: string): RecoveryAction {
    const err = errorMsg.toLowerCase();
    if (err.includes('timeout') || err.includes('etimedout')) {
      return {
        failureType: 'transient_timeout',
        suggestedStrategy: 'retry_with_backoff',
        description: 'Network or process timed out. Retrying with exponential backoff.'
      };
    }
    if (err.includes('access denied') || err.includes('permission denied') || err.includes('unauthorized')) {
      return {
        failureType: 'permission_denied',
        suggestedStrategy: 'ask_user',
        description: 'Privilege insufficient. Requesting elevated user authorization.'
      };
    }
    if (err.includes('not found') || err.includes('cannot find')) {
      return {
        failureType: 'process_not_found',
        suggestedStrategy: 'alternate_tool',
        description: 'Target not found in primary path. Falling back to alternative tool/binary.'
      };
    }
    return {
      failureType: 'visual_verification_failed',
      suggestedStrategy: 'rollback_state',
      description: 'Action outcome did not meet visual assertion. Rolling back to safe checkpoint.'
    };
  }
}

export const hardenedSecurity = new HardenedSecurityEngine();
