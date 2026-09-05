export type SkillState = 
  | 'GENERATED'
  | 'SANDBOXED'
  | 'TESTED'
  | 'SECURITY_REVIEW'
  | 'APPROVED'
  | 'REGISTERED'
  | 'PRODUCTION'
  | 'DEPRECATED'
  | 'REJECTED';

export interface DynamicSkill {
  id: string;
  name: string;
  description: string;
  version: string;
  state: SkillState;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  handlerCode: string;
  testCases: Array<{ input: any; expectedOutput: any }>;
  securityReview: {
    passed: boolean;
    threatsDetected: string[];
    reviewedAt: string;
  };
  author: 'system' | 'user' | 'autonomous_skill_builder';
  createdAt: string;
}

export class SkillRegistry {
  private skills: Map<string, DynamicSkill> = new Map();

  constructor() {
    this.initDefaultSkills();
  }

  private initDefaultSkills() {
    this.registerSkill({
      id: 'skill_deep_calculator',
      name: 'Precision Scientific Calculator',
      description: 'Calculates high-precision math expressions and statistics',
      version: '1.0.0',
      state: 'PRODUCTION',
      inputSchema: { expression: 'string' },
      outputSchema: { result: 'number | string' },
      handlerCode: 'return eval(params.expression);',
      testCases: [
        { input: { expression: 'Math.sqrt(144) + 20' }, expectedOutput: 32 }
      ],
      securityReview: {
        passed: true,
        threatsDetected: [],
        reviewedAt: new Date().toISOString()
      },
      author: 'system',
      createdAt: new Date().toISOString()
    });
  }

  registerSkill(skill: DynamicSkill): boolean {
    this.skills.set(skill.id, skill);
    console.log(`[SkillRegistry] Skill registered: "${skill.name}" (${skill.id}) in state ${skill.state}`);
    return true;
  }

  getSkill(id: string): DynamicSkill | undefined {
    return this.skills.get(id);
  }

  getAllSkills(): DynamicSkill[] {
    return Array.from(this.skills.values());
  }

  getProductionSkills(): DynamicSkill[] {
    return Array.from(this.skills.values()).filter(s => s.state === 'PRODUCTION');
  }

  updateSkillState(id: string, newState: SkillState): boolean {
    const skill = this.skills.get(id);
    if (!skill) return false;
    skill.state = newState;
    return true;
  }
}

export const skillRegistry = new SkillRegistry();
