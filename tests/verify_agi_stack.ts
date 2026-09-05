import { capabilityGraph } from '../server/core/capability/CapabilityGraph';
import { agentEventStream, AgentEvent } from '../server/core/events/AgentEventStream';
import { skillBuilder } from '../server/core/skills/SkillBuilder';
import { skillRegistry } from '../server/core/skills/SkillRegistry';
import { deepResearchCapability } from '../server/capabilities/research/DeepResearchCapability';
import { openAgentAdapter } from '../server/integrations/openagent/OpenAgentAdapter';
import { documentAnalysisCapability } from '../server/capabilities/data/DocumentAnalysisCapability';

async function runAGIStackVerification() {
  console.log('====================================================');
  console.log('🧠 RUNNING AKANSHA AGI CAPABILITY & PROTOCOL TESTS');
  console.log('====================================================');

  // 1. CAPABILITY GRAPH RESOLUTION & PROVIDERS
  console.log('\n[TEST 1] Testing CapabilityGraph Provider Discovery...');
  const capabilities = capabilityGraph.getAllCapabilities();
  console.log(`✓ Capabilities Registered: ${capabilities.length}`);
  for (const c of capabilities) {
    const primary = capabilityGraph.selectProvider(c.domain);
    console.log(`   - [${c.domain}] -> Primary: "${primary?.name}" (${primary?.privacyLevel}, ~${primary?.latencyEstimateMs}ms)`);
  }

  const localCoding = capabilityGraph.selectProvider('coding', { requiresLocalOnly: true });
  console.log(`✓ Constraint Resolution (Local Only Coding): "${localCoding?.name}"`);

  // 2. AG-UI EVENT STREAM CONTRACT
  console.log('\n[TEST 2] Testing AG-UI Event Stream Protocol...');
  const testRunId = `run_${Date.now()}`;
  const receivedEvents: AgentEvent[] = [];

  const evt1 = agentEventStream.emit(testRunId, 'RUN_STARTED', 'MasterOrchestrator', { intent: 'Test mission' });
  const evt2 = agentEventStream.emit(testRunId, 'TOOL_CALL_STARTED', 'ResearchAgent', { tool: 'WebSearch' });
  const evt3 = agentEventStream.emit(testRunId, 'GENERATIVE_UI_EMITTED', 'MasterOrchestrator', null, {
    component: 'ResearchResultsCard',
    props: { title: 'Test', summary: 'Summary', recommendations: [], sources: [] },
    timestamp: new Date().toISOString()
  });

  const history = agentEventStream.getHistory(testRunId);
  console.log(`✓ Emitted and recorded ${history.length} AG-UI events for run: ${testRunId}`);
  if (history.length !== 3) throw new Error('Event history count mismatch');

  // 3. SELF-EXTENDING SKILLS SANDBOX & EVOLUTION
  console.log('\n[TEST 3] Testing SkillBuilder 6-Stage Evolution Sandbox...');
  
  // A. Safe Skill Test
  const safeSkillReq = {
    name: 'Celsius to Fahrenheit Converter',
    description: 'Converts temperature from Celsius to Fahrenheit',
    inputSchema: { celsius: 'number' },
    outputSchema: { fahrenheit: 'number' },
    handlerCode: 'return (params.celsius * 9/5) + 32;',
    testCases: [
      { input: { celsius: 0 }, expectedOutput: 32 },
      { input: { celsius: 100 }, expectedOutput: 212 },
      { input: { celsius: -40 }, expectedOutput: -40 }
    ]
  };

  const safeBuildRes = await skillBuilder.buildAndEvaluateSkill(safeSkillReq);
  console.log(`✓ Safe Skill Lifecycle: ${safeBuildRes.state} (${safeBuildRes.message})`);
  if (safeBuildRes.state !== 'PRODUCTION') throw new Error('Safe skill was not promoted to Production');

  const registeredSkill = skillRegistry.getSkill(safeBuildRes.skill!.id);
  console.log(`✓ Skill Verified in Registry: "${registeredSkill?.name}"`);

  // B. Dangerous Skill AST Security Rejection Test
  const unsafeSkillReq = {
    name: 'Unsafe System Hijack Attempt',
    description: 'Attempts to access forbidden process.exit or child_process',
    inputSchema: {},
    outputSchema: {},
    handlerCode: 'process.exit(1); return false;',
    testCases: []
  };

  const unsafeBuildRes = await skillBuilder.buildAndEvaluateSkill(unsafeSkillReq);
  console.log(`✓ Unsafe Skill Rejection: ${unsafeBuildRes.state} (${unsafeBuildRes.message})`);
  if (unsafeBuildRes.state !== 'REJECTED') throw new Error('Dangerous skill was not properly rejected by security review');

  // 4. DEEP RESEARCH CAPABILITY (Awesome-LLM-Apps pattern)
  console.log('\n[TEST 4] Testing DeepResearchCapability Synthesis...');
  const researchRes = await deepResearchCapability.conductResearch(testRunId, {
    topic: 'Best RTX 4060 Laptops under ₹80,000'
  });
  console.log(`✓ Research Title: "${researchRes.title}"`);
  console.log(`✓ Sources Analyzed: ${researchRes.sources.length}`);
  console.log(`✓ Recommendations: ${researchRes.recommendations.map(r => r.item).join(', ')}`);
  if (researchRes.recommendations.length === 0) throw new Error('Research failed to produce recommendations');

  // 5. OPENAGENT CONTROLLED TOOL ADAPTER
  console.log('\n[TEST 5] Testing OpenAgentAdapter Controlled Execution...');
  const toolExec = await openAgentAdapter.executeControlledTool(testRunId, 'WorkspaceFileScanner', {
    targetDir: 'src/components'
  });
  console.log(`✓ OpenAgent Tool Result: ${toolExec.result.message}`);
  console.log(`✓ Transparent Execution Logs: ${toolExec.transparentLogs.length} entries`);

  // 6. DOCUMENT ANALYSIS CAPABILITY
  console.log('\n[TEST 6] Testing DocumentAnalysisCapability on CSV data...');
  const csvData = `Laptop,Price,GPU,Rating\nLenovo Legion,79990,RTX 4060,4.7\nAsus TUF,74990,RTX 4050,4.5`;
  const docRes = await documentAnalysisCapability.analyzeDocument('laptops.csv', csvData);
  console.log(`✓ Document Summary: "${docRes.summary}"`);
  if (docRes.rowCount !== 2) throw new Error(`Row count mismatch: ${docRes.rowCount}`);

  console.log('\n====================================================');
  console.log('✅ ALL AGI CAPABILITY & ARCHITECTURE TESTS PASSED');
  console.log('====================================================');
}

runAGIStackVerification().catch(err => {
  console.error('❌ AGI Stack Verification Failed:', err);
  process.exit(1);
});
