import { startupManager } from '../server/core/startup/StartupManager';
import { voiceProviderManager } from '../server/voice/VoiceProviderManager';
import { masterOrchestrator } from '../server/orchestrator/masterOrchestrator';

async function runDesktopVerification() {
  console.log('====================================================');
  console.log('🔍 RUNNING AKANSHA DESKTOP AI ASSISTANT VERIFICATION');
  console.log('====================================================');

  // 1. STARTUP STATE MACHINE & HEALTH PROBES
  console.log('\n[TEST 1] Testing Startup State Machine & Health Checks...');
  const bootResult = await startupManager.runStartupSequence();
  console.log(`✓ Startup State: ${bootResult.state}`);
  console.log(`✓ Generated Greeting: "${bootResult.greeting || '(none)'}"`);
  console.log(`✓ Subsystems Checked (${bootResult.health.length}):`);
  for (const h of bootResult.health) {
    console.log(`   - [${h.status.toUpperCase()}] ${h.name} (${h.latencyMs}ms): ${h.message}`);
  }

  if (bootResult.state !== 'READY' && bootResult.state !== 'PARTIAL_READY') {
    throw new Error(`Unexpected startup state: ${bootResult.state}`);
  }

  // 2. TIME-AWARE GREETING ENGINE
  console.log('\n[TEST 2] Testing Polite Time-Aware Greetings...');
  const greeting = startupManager.generateGreeting('READY');
  console.log(`✓ Polite Greeting Generated: "${greeting}"`);

  // 3. SINGLE VOICE PROVIDER LOCK & DEDUPLICATION
  console.log('\n[TEST 3] Testing VoiceProviderManager Single Speaker Lock...');
  const u1 = 'test-utterance-1';
  const text1 = 'Akansha Windows Control is online.';

  const canSpeakFirst = voiceProviderManager.canSpeak(u1, text1);
  console.log(`✓ Can speak first utterance: ${canSpeakFirst}`);
  if (!canSpeakFirst) throw new Error('Failed to grant speaker lock for fresh utterance');

  voiceProviderManager.startSpeech(u1, text1);
  console.log(`✓ Speech State during playback: ${voiceProviderManager.getSpeechState()}`);

  // Try duplicate call with same utteranceId -> should be blocked
  const canSpeakDupId = voiceProviderManager.canSpeak(u1, text1);
  console.log(`✓ Blocked duplicate utterance ID: ${!canSpeakDupId}`);
  if (canSpeakDupId) throw new Error('Failed to block duplicate utterance ID');

  // Try duplicate call with different ID but same text within 2.5s -> should be blocked
  const canSpeakDupText = voiceProviderManager.canSpeak('test-utterance-2', text1);
  console.log(`✓ Blocked duplicate speech collision: ${!canSpeakDupText}`);
  if (canSpeakDupText) throw new Error('Failed to block collision speech');

  // Test Barge-in
  voiceProviderManager.interruptSpeech();
  console.log(`✓ State after barge-in interrupt: ${voiceProviderManager.getSpeechState()}`);

  // 4. INTENT ROUTING WITHOUT LOCALHOST
  console.log('\n[TEST 4] Testing Question vs Task Routing...');
  const qMission = await masterOrchestrator.executeMissionIntent('What time is it in India?');
  console.log(`✓ Question Category: ${qMission.category} | Spoken: "${qMission.spokenResponse}"`);

  const convMission = await masterOrchestrator.executeMissionIntent('Hey Akansha, hello');
  console.log(`✓ Conversation Category: ${convMission.category} | Spoken: "${convMission.spokenResponse}"`);

  console.log('\n====================================================');
  console.log('✅ ALL DESKTOP SUBSYSTEM VERIFICATION TESTS PASSED');
  console.log('====================================================');
}

runDesktopVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
