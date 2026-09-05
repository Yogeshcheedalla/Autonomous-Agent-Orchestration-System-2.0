export type Capability = 
  | 'READ_SCREEN'
  | 'CLICK_UI'
  | 'TYPE_TEXT'
  | 'OPEN_APPLICATION'
  | 'OPEN_URL'
  | 'WRITE_FILE'
  | 'DELETE_FILE'
  | 'EXECUTE_SHELL'
  | 'SYSTEM_SETTING'
  | 'ADMIN_OPERATION';

export interface PermissionCheck {
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
}

export class CapabilityPolicy {
  // Safe low-risk capabilities that are automatically allowed
  private automaticCapabilities: Set<Capability> = new Set([
    'READ_SCREEN',
    'CLICK_UI',
    'TYPE_TEXT',
    'OPEN_APPLICATION',
    'OPEN_URL',
    'WRITE_FILE'
  ]);

  // High-risk capabilities requiring explicit user approval
  private sensitiveCapabilities: Set<Capability> = new Set([
    'DELETE_FILE',
    'EXECUTE_SHELL',
    'SYSTEM_SETTING',
    'ADMIN_OPERATION'
  ]);

  /**
   * Check if action is permitted under system capability policy
   */
  checkPermission(capability: Capability, targetResource?: string): PermissionCheck {
    if (this.sensitiveCapabilities.has(capability)) {
      // Destructive deletion or admin operation requires approval
      if (capability === 'DELETE_FILE' || capability === 'ADMIN_OPERATION') {
        return {
          allowed: false,
          requiresApproval: true,
          reason: `Action requires explicit user approval: '${capability}' on '${targetResource || 'system'}'`
        };
      }
    }

    if (this.automaticCapabilities.has(capability)) {
      return {
        allowed: true,
        requiresApproval: false,
        reason: `Capability '${capability}' is authorized.`
      };
    }

    return {
      allowed: true,
      requiresApproval: false,
      reason: 'Authorized'
    };
  }

  /**
   * Validate that external webpage / document content does not contain prompt injection overrides
   */
  sanitizeUntrustedContent(rawExternalText: string): { safe: boolean; sanitized: string } {
    const maliciousPatterns = [
      /ignore all previous instructions/i,
      /you are now a new assistant/i,
      /override system prompt/i,
      /delete all files/i,
      /run powershell as administrator/i
    ];

    const isMalicious = maliciousPatterns.some(p => p.test(rawExternalText));
    if (isMalicious) {
      console.warn('[CapabilityPolicy] Untrusted external content contained potential injection pattern. Sanitized.');
      return {
        safe: false,
        sanitized: '[REDACTED: Untrusted external instruction ignored]'
      };
    }

    return {
      safe: true,
      sanitized: rawExternalText
    };
  }
}

export const capabilityPolicy = new CapabilityPolicy();
