import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import { systemMetricsService } from './windows/systemMetrics';
import { processManager } from './windows/processManager';
import { nativeAutomation } from './windows/nativeAutomation';
import { voiceRouter } from './voice/voiceRouter';
import { AudioStreamHandler } from './voice/audioStreamHandler';
import { masterOrchestrator } from './orchestrator/masterOrchestrator';
import { securityGuard } from './orchestrator/securityGuard';
import { screenCaptureService } from './vision/screenCapture';
import { computerUseEngine } from './vision/computerUse';
import { universalAppController } from './apps/universalAppController';
import { sourceRepoScanner } from './apps/sourceRepoScanner';
import { communicationHub } from './social/communicationHub';
import { agentSystem } from './agents/agentSystem';
import { memoryEngine } from './memory/memoryEngine';
import { automationEngine } from './automation/automationEngine';
import { deviceController } from './devices/deviceController';
import { hardenedSecurity } from './security/hardenedSecurity';
import { uiTarsRouter } from './vision/uiTarsRouter';
import { odysseusAdapter } from './orchestrator/odysseusAdapter';
import { executionStateMachine } from './core/orchestrator/ExecutionStateMachine';
import { clarificationManager } from './core/intent/ClarificationManager';
import { browserUseAdapter } from './integrations/browser-use/BrowserUseAdapter';
import { openHandsAdapter } from './integrations/openhands/OpenHandsAdapter';
import { openInterpreterAdapter } from './integrations/open-interpreter/OpenInterpreterAdapter';
import { lettaAdapter } from './integrations/letta/LettaAdapter';
import { learningEngine } from './core/learning/LearningEngine';
import { startupManager } from './core/startup/StartupManager';
import { voiceProviderManager } from './voice/VoiceProviderManager';
import { capabilityGraph } from './core/capability/CapabilityGraph';
import { skillRegistry } from './core/skills/SkillRegistry';
import { skillBuilder } from './core/skills/SkillBuilder';
import { agentEventStream } from './core/events/AgentEventStream';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- STARTUP & SYSTEM HEALTH ENDPOINTS ---

app.get('/api/startup/status', (req, res) => {
  res.json({
    state: startupManager.getState(),
    config: startupManager.getConfig(),
    history: startupManager.getStateHistory()
  });
});

app.post('/api/startup/boot', async (req, res) => {
  const result = await startupManager.runStartupSequence();
  res.json(result);
});

app.get('/api/startup/health', (req, res) => {
  res.json(startupManager.getAllHealth());
});

app.get('/api/settings/startup', (req, res) => {
  res.json(startupManager.getConfig());
});

app.post('/api/settings/startup', (req, res) => {
  const updated = startupManager.saveConfig(req.body);
  res.json(updated);
});

// --- REST API ENDPOINTS ---

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'win32',
    host: 'Windows Native Operating Layer',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/telemetry', async (req, res) => {
  const telemetry = await systemMetricsService.getTelemetry();
  res.json(telemetry);
});

app.get('/api/windows', async (req, res) => {
  const windows = await processManager.getRunningWindows();
  res.json(windows);
});

app.post('/api/windows/launch', async (req, res) => {
  const { app: appName, args } = req.body;
  if (!appName) return res.status(400).json({ error: 'App name required' });
  const result = await processManager.launchApp(appName, args);
  res.json(result);
});

app.post('/api/windows/focus', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Query required' });
  const result = await processManager.focusWindow(query);
  res.json(result);
});

app.post('/api/windows/close', async (req, res) => {
  const { target } = req.body;
  if (!target) return res.status(400).json({ error: 'Target required' });
  const result = await processManager.closeApp(target);
  res.json(result);
});

app.post('/api/automation/powershell', async (req, res) => {
  const { script } = req.body;
  if (!script) return res.status(400).json({ error: 'Script required' });
  const result = await nativeAutomation.runPowerShell(script);
  res.json(result);
});

app.get('/api/missions', (req, res) => {
  res.json(masterOrchestrator.getMissions());
});

app.post('/api/missions', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });
  const result = await masterOrchestrator.executeMissionIntent(prompt);
  res.json(result);
});

app.get('/api/voice/providers', (req, res) => {
  res.json({
    providers: voiceRouter.getProviders(),
    activeProvider: voiceRouter.getActiveProvider()
  });
});

app.post('/api/voice/providers/select', (req, res) => {
  const { providerId } = req.body;
  const success = voiceRouter.setActiveProvider(providerId);
  res.json({ success, activeProvider: voiceRouter.getActiveProvider() });
});

app.get('/api/security/audit', (req, res) => {
  res.json(securityGuard.getAuditLog());
});

// --- AUTONOMOUS AGENT OS & INTEGRATION HEALTH PROBES ---

app.get('/api/computer-use/status', async (req, res) => {
  const status = await uiTarsRouter.checkHealth();
  res.json(status);
});

app.get('/api/models/odysseus/health', async (req, res) => {
  const health = await odysseusAdapter.checkHealth();
  res.json(health);
});

app.get('/api/missions/state-graph', (req, res) => {
  res.json(executionStateMachine.getAllMissions());
});

app.get('/api/clarification/pending', (req, res) => {
  res.json(clarificationManager.getAllPending());
});

app.post('/api/clarification/resolve', (req, res) => {
  const { missionId, response } = req.body;
  if (!missionId || !response) {
    return res.status(400).json({ error: 'missionId and response are required' });
  }
  const result = clarificationManager.resolveClarification(missionId, response);
  res.json(result);
});

app.get('/api/integrations/status', async (req, res) => {
  const [tars, browser, hands, interp, letta, ody] = await Promise.allSettled([
    uiTarsRouter.checkHealth(),
    browserUseAdapter.checkHealth(),
    openHandsAdapter.checkHealth(),
    openInterpreterAdapter.checkHealth(),
    lettaAdapter.checkHealth(),
    odysseusAdapter.checkHealth()
  ]);

  res.json({
    uiTars: tars.status === 'fulfilled' ? tars.value : { ready: false },
    browserUse: browser.status === 'fulfilled' ? browser.value : { ready: false },
    openHands: hands.status === 'fulfilled' ? hands.value : { ready: false },
    openInterpreter: interp.status === 'fulfilled' ? interp.value : { ready: false },
    letta: letta.status === 'fulfilled' ? letta.value : { ready: false },
    odysseus: ody.status === 'fulfilled' ? ody.value : { connected: false },
    learnedStrategiesCount: learningEngine.getStrategies().length
  });
});

// --- PHASE 3: VISION & COMPUTER USE ENDPOINTS ---

app.post('/api/vision/screenshot', async (req, res) => {
  const result = await screenCaptureService.captureScreen();
  res.json(result);
});

app.post('/api/vision/action', async (req, res) => {
  const params = req.body;
  const result = await uiTarsRouter.dispatchVisualAction(params);
  res.json(result);
});

// --- PHASE 4: UNIVERSAL APPS & REPO SCANNER ---

app.get('/api/apps', async (req, res) => {
  const apps = await universalAppController.discoverInstalledApps();
  res.json(apps);
});

app.post('/api/apps/scan-repo', async (req, res) => {
  const { path: repoPath } = req.body;
  if (!repoPath) return res.status(400).json({ error: 'Repository path required' });
  try {
    const result = await sourceRepoScanner.scanAndGenerateAdapter(repoPath);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- PHASE 5: SOCIAL & UNIFIED COMMUNICATIONS ---

app.get('/api/social/inbox', (req, res) => {
  res.json(communicationHub.getUnifiedInbox());
});

app.get('/api/social/drafts', (req, res) => {
  res.json(communicationHub.getDrafts());
});

app.post('/api/social/draft', (req, res) => {
  const { platform, recipient, content, scheduleTime } = req.body;
  if (!platform || !recipient || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const draft = communicationHub.createDraft(platform, recipient, content, scheduleTime);
  res.json(draft);
});

app.post('/api/social/send', (req, res) => {
  const { draftId } = req.body;
  if (!draftId) return res.status(400).json({ error: 'Draft ID required' });
  const result = communicationHub.approveAndSendMessage(draftId);
  res.json(result);
});

// --- PHASE 4: AGENT SYSTEM & DAG ---

app.get('/api/agents', (req, res) => {
  res.json(agentSystem.getAgents());
});

app.get('/api/agents/dags', (req, res) => {
  res.json(agentSystem.getActiveDAGs());
});

app.post('/api/agents/dag', async (req, res) => {
  const { goal } = req.body;
  if (!goal) return res.status(400).json({ error: 'Goal required' });
  const dag = await agentSystem.executeDAGMission(goal);
  res.json(dag);
});

// --- PHASE 6: MEMORY & LEARNING ---

app.get('/api/memory', (req, res) => {
  const { layer } = req.query;
  res.json(memoryEngine.getMemories(layer as any));
});

app.get('/api/memory/search', (req, res) => {
  const { q } = req.query;
  res.json(memoryEngine.searchMemories((q as string) || ''));
});

app.get('/api/memory/strategies', (req, res) => {
  res.json(memoryEngine.getLearnedStrategies());
});

app.post('/api/memory', (req, res) => {
  const { layer, key, content, confidence } = req.body;
  const mem = memoryEngine.addMemory(layer, key, content, confidence);
  res.json(mem);
});

// --- PHASE 8: AUTOMATION & SCHEDULER ---

app.get('/api/automation/rules', (req, res) => {
  res.json(automationEngine.getRules());
});

app.get('/api/automation/logs', (req, res) => {
  res.json(automationEngine.getLogs());
});

app.post('/api/automation/rules/:id/toggle', (req, res) => {
  const enabled = automationEngine.toggleRule(req.params.id);
  res.json({ success: true, enabled });
});

app.post('/api/automation/rules/:id/trigger', (req, res) => {
  const result = automationEngine.triggerRuleManually(req.params.id);
  res.json(result);
});

app.post('/api/automation/rules', (req, res) => {
  const rule = automationEngine.createRule(req.body);
  res.json(rule);
});

// --- PHASE 9: DEVICES & HARDWARE ---

app.get('/api/devices', async (req, res) => {
  const devices = await deviceController.scanDevices();
  res.json(devices);
});

app.post('/api/devices/:id/action', async (req, res) => {
  const { action, value } = req.body;
  const result = await deviceController.executeDeviceAction(req.params.id, action, value);
  res.json(result);
});

// --- PHASE 10: SECURITY VAULT ---

app.get('/api/security/vault', (req, res) => {
  res.json(hardenedSecurity.getVaultMetadata());
});

// --- AGI CAPABILITY GRAPH & DYNAMIC SKILLS ---

app.get('/api/capabilities', (req, res) => {
  res.json(capabilityGraph.getAllCapabilities());
});

app.get('/api/capabilities/providers', (req, res) => {
  res.json(capabilityGraph.getAllProviders());
});

app.get('/api/skills', (req, res) => {
  res.json(skillRegistry.getAllSkills());
});

app.post('/api/skills/build', async (req, res) => {
  const result = await skillBuilder.buildAndEvaluateSkill(req.body);
  res.json(result);
});

// --- WEBSOCKET REALTIME SERVERS ---

const wssTelemetry = new WebSocketServer({ noServer: true });
const wssVoice = new WebSocketServer({ noServer: true });
const wssEvents = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const pathname = request.url;

  if (pathname === '/ws/telemetry') {
    wssTelemetry.handleUpgrade(request, socket, head, (ws) => {
      wssTelemetry.emit('connection', ws, request);
    });
  } else if (pathname === '/ws/voice') {
    wssVoice.handleUpgrade(request, socket, head, (ws) => {
      wssVoice.emit('connection', ws, request);
    });
  } else if (pathname === '/ws/events') {
    wssEvents.handleUpgrade(request, socket, head, (ws) => {
      wssEvents.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// AG-UI Event Stream WebSocket handler
wssEvents.on('connection', (ws: WebSocket) => {
  console.log('[WebSocket] AG-UI Event Stream client connected.');
  agentEventStream.subscribe(ws);
  ws.on('close', () => agentEventStream.unsubscribe(ws));
});

// Telemetry periodic broadcaster (1 Hz)
wssTelemetry.on('connection', (ws: WebSocket) => {
  console.log('[WebSocket] Telemetry client connected.');
  const interval = setInterval(async () => {
    if (ws.readyState === WebSocket.OPEN) {
      const telemetry = await systemMetricsService.getTelemetry();
      ws.send(JSON.stringify({ type: 'TELEMETRY_UPDATE', data: telemetry }));
    }
  }, 1000);

  ws.on('close', () => clearInterval(interval));
});

// Voice audio stream & barge-in handler
wssVoice.on('connection', (ws: WebSocket) => {
  console.log('[WebSocket] Voice audio stream client connected.');
  new AudioStreamHandler(ws);
});

server.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`⚡ AKANSHA NATIVE WINDOWS BRIDGE & VOICE SERVER ONLINE`);
  console.log(`⚡ Server running on: http://localhost:${PORT}`);
  console.log(`⚡ Control Plane: Windows Win32 / PowerShell / VAD / WS`);
  console.log(`=======================================================`);
  try {
    await startupManager.runStartupSequence();
  } catch (err) {
    console.error('[Server] Startup sequence error:', err);
  }
});
