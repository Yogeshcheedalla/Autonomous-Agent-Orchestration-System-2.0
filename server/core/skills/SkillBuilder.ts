import vm from 'vm';
import { skillRegistry, DynamicSkill, SkillState } from './SkillRegistry';
import { hardenedSecurity } from '../../security/hardenedSecurity';

export interface BuildSkillRequest {
  name: string;
  description: string;
  handlerCode: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  testCases: Array<{ input: any; expectedOutput: any }>;
}

export class SkillBuilder {
  /**
   * Run full 6-stage autonomous skill evolution pipeline
   */
  async buildAndEvaluateSkill(req: BuildSkillRequest): Promise<{
    success: boolean;
    skill?: DynamicSkill;
    state: SkillState;
    message: string;
    logs: string[];
  }> {
    const logs: string[] = [];
    const skillId = `skill_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    logs.push(`[STAGE 1: GENERATED] Generating dynamic skill: "${req.name}" (${skillId})`);

    const skill: DynamicSkill = {
      id: skillId,
      name: req.name,
      description: req.description,
      version: '1.0.0',
      state: 'GENERATED',
      inputSchema: req.inputSchema,
      outputSchema: req.outputSchema,
      handlerCode: req.handlerCode,
      testCases: req.testCases,
      securityReview: {
        passed: false,
        threatsDetected: [],
        reviewedAt: ''
      },
      author: 'autonomous_skill_builder',
      createdAt: new Date().toISOString()
    };

    // 2. STAGE 2: SECURITY REVIEW (AST & Keyword safety)
    logs.push(`[STAGE 2: SECURITY_REVIEW] Scanning code for forbidden keywords & dangerous system calls...`);
    const code = req.handlerCode;
    const forbiddenPatterns = [
      'process.exit',
      'child_process',
      'require(',
      'import(',
      'fs.unlink',
      'fs.rmdir',
      'fs.write',
      'net.Socket',
      'http.request',
      'WebSocket',
      'eval('
    ];

    const threats: string[] = [];
    for (const pat of forbiddenPatterns) {
      if (code.includes(pat)) {
        threats.push(`Forbidden token detected: ${pat}`);
      }
    }

    if (threats.length > 0) {
      skill.state = 'REJECTED';
      skill.securityReview = {
        passed: false,
        threatsDetected: threats,
        reviewedAt: new Date().toISOString()
      };
      logs.push(`❌ Security review FAILED: ${threats.join(', ')}`);
      return {
        success: false,
        skill,
        state: 'REJECTED',
        message: `Security review failed: ${threats[0]}`,
        logs
      };
    }

    skill.securityReview = {
      passed: true,
      threatsDetected: [],
      reviewedAt: new Date().toISOString()
    };
    logs.push(`✓ Security review PASSED`);

    // 3. STAGE 3: SANDBOXED EXECUTION
    logs.push(`[STAGE 3: SANDBOXED] Initializing isolated V8 VM sandbox with mocked environment...`);
    skill.state = 'SANDBOXED';

    const sandboxContext = {
      Math,
      Date,
      JSON,
      parseInt,
      parseFloat,
      console: {
        log: (...args: any[]) => logs.push(`[Sandbox Console]: ${args.join(' ')}`)
      }
    };
    vm.createContext(sandboxContext);

    // 4. STAGE 4: UNIT TESTING & ASSERTION SUITE
    logs.push(`[STAGE 4: TESTED] Executing ${req.testCases.length} assertion test cases...`);
    let allTestsPassed = true;

    for (let i = 0; i < req.testCases.length; i++) {
      const tc = req.testCases[i];
      try {
        const wrappedCode = `
          (function(params) {
            ${req.handlerCode}
          })(${JSON.stringify(tc.input)})
        `;
        const result = vm.runInContext(wrappedCode, sandboxContext, { timeout: 1000 });

        if (JSON.stringify(result) !== JSON.stringify(tc.expectedOutput)) {
          logs.push(`❌ Test Case ${i + 1} Failed. Expected: ${JSON.stringify(tc.expectedOutput)}, Got: ${JSON.stringify(result)}`);
          allTestsPassed = false;
          break;
        } else {
          logs.push(`✓ Test Case ${i + 1} Passed`);
        }
      } catch (err: any) {
        logs.push(`❌ Test Case ${i + 1} Error: ${err.message}`);
        allTestsPassed = false;
        break;
      }
    }

    if (!allTestsPassed) {
      skill.state = 'REJECTED';
      return {
        success: false,
        skill,
        state: 'REJECTED',
        message: 'Sandbox assertion test suite failed',
        logs
      };
    }

    // 5. STAGE 5: APPROVAL & PROMOTION
    logs.push(`[STAGE 5: APPROVED] Sandbox validation passed. Promoting skill to PRODUCTION`);
    skill.state = 'PRODUCTION';

    // 6. STAGE 6: REGISTRATION
    skillRegistry.registerSkill(skill);
    logs.push(`[STAGE 6: REGISTERED] Skill "${req.name}" is now live in the SkillRegistry`);

    return {
      success: true,
      skill,
      state: 'PRODUCTION',
      message: `Skill "${req.name}" successfully validated and promoted to Production`,
      logs
    };
  }
}

export const skillBuilder = new SkillBuilder();
