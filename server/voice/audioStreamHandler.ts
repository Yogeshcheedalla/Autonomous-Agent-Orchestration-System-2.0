import { WebSocket } from 'ws';
import { voiceRouter } from './voiceRouter';
import { masterOrchestrator } from '../orchestrator/masterOrchestrator';

export type VoiceState = 
  | 'IDLE' 
  | 'LISTENING' 
  | 'TRANSCRIBING' 
  | 'UNDERSTANDING' 
  | 'THINKING' 
  | 'PLANNING' 
  | 'EXECUTING' 
  | 'SPEAKING' 
  | 'INTERRUPTED' 
  | 'VERIFYING' 
  | 'ERROR' 
  | 'OFFLINE';

export class AudioStreamHandler {
  private ws: WebSocket;
  private isSpeaking: boolean = false;
  private currentState: VoiceState = 'IDLE';
  private audioBuffer: Buffer[] = [];
  private speechEnergyThreshold: number = 0.045; // VAD threshold
  private processedUtteranceIds: Set<string> = new Set();

  constructor(ws: WebSocket) {
    this.ws = ws;
    this.setupListeners();
  }

  private setState(state: VoiceState) {
    this.currentState = state;
    this.sendJson({
      type: 'VOICE_STATE_CHANGED',
      state: this.currentState,
      provider: voiceRouter.getActiveProvider().name
    });
  }

  private sendJson(data: any) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private setupListeners() {
    this.ws.on('message', async (message: any, isBinary: boolean) => {
      if (isBinary) {
        // Binary raw PCM audio frame from client microphone
        const chunk = Buffer.from(message);
        await this.handleAudioChunk(chunk);
      } else {
        try {
          const payload = JSON.parse(message.toString());
          await this.handleTextMessage(payload);
        } catch (err: any) {
          console.error('[AudioStreamHandler] Parse error:', err.message);
        }
      }
    });

    this.ws.on('close', () => {
      console.log('[AudioStreamHandler] Voice WebSocket client disconnected.');
    });
  }

  private async handleAudioChunk(chunk: Buffer) {
    let sum = 0;
    const sampleCount = chunk.length / 2;
    for (let i = 0; i < chunk.length; i += 2) {
      const sample = chunk.readInt16LE(i) / 32768.0;
      sum += sample * sample;
    }
    const rms = Math.sqrt(sum / sampleCount);

    // Send audio volume level to client visualizer
    this.sendJson({
      type: 'VOICE_ENERGY',
      energy: Math.min(1.0, rms * 8)
    });

    // INSTANT HARDWARE BARGE-IN: If speaking and user starts talking
    if (this.isSpeaking && rms > this.speechEnergyThreshold) {
      console.log(`[AudioStreamHandler] BARGE-IN TRIGGERED (RMS: ${rms.toFixed(3)}). Halting TTS.`);
      this.isSpeaking = false;
      this.setState('INTERRUPTED');
      
      this.sendJson({
        type: 'VOICE_INTERRUPTED',
        message: 'Speech interrupted by user'
      });

      setTimeout(() => {
        this.setState('LISTENING');
      }, 150);
      return;
    }

    if (rms > this.speechEnergyThreshold) {
      if (this.currentState === 'IDLE') {
        this.setState('LISTENING');
        this.sendJson({ type: 'VOICE_STARTED' });
      }
      this.audioBuffer.push(chunk);
    }
  }

  private async handleTextMessage(msg: any) {
    switch (msg.type) {
      case 'START_LISTENING':
        this.audioBuffer = [];
        this.setState('LISTENING');
        break;

      case 'STOP_LISTENING':
        this.setState('IDLE');
        break;

      case 'SUBMIT_TRANSCRIPT':
        // Strict utterance handling with deduplication
        await this.processFinalTranscript(msg.text, msg.utteranceId);
        break;

      case 'SET_PROVIDER':
        voiceRouter.setActiveProvider(msg.providerId);
        this.sendJson({
          type: 'PROVIDER_UPDATED',
          activeProvider: voiceRouter.getActiveProvider()
        });
        break;

      case 'TTS_STARTED':
        this.isSpeaking = true;
        this.setState('SPEAKING');
        break;

      case 'TTS_STOPPED':
        this.isSpeaking = false;
        if (this.currentState === 'SPEAKING') {
          this.setState('IDLE');
        }
        break;
    }
  }

  private async processFinalTranscript(transcript: string, utteranceId?: string) {
    const text = transcript?.trim();
    if (!text) {
      this.setState('IDLE');
      return;
    }

    const uId = utteranceId || 'utt-' + Date.now();
    if (this.processedUtteranceIds.has(uId)) {
      console.log(`[AudioStreamHandler] Deduplicated redundant utteranceId: ${uId}`);
      return;
    }
    this.processedUtteranceIds.add(uId);
    if (this.processedUtteranceIds.size > 200) {
      const first = this.processedUtteranceIds.values().next().value;
      if (first) this.processedUtteranceIds.delete(first);
    }

    const asrReceivedAt = Date.now();
    console.log(`[AudioStreamHandler] Processing Final Utterance [${uId}]: "${text}"`);
    
    this.sendJson({
      type: 'VOICE_FINAL_TRANSCRIPT',
      utteranceId: uId,
      text
    });

    this.setState('UNDERSTANDING');

    try {
      this.setState('PLANNING');
      const missionResult = await masterOrchestrator.executeMissionIntent(text, (stepUpdate) => {
        this.sendJson({
          type: 'ORCHESTRATOR_STEP',
          utteranceId: uId,
          step: stepUpdate
        });
      });

      this.setState('VERIFYING');
      const spokenText = missionResult.spokenResponse || missionResult.summary;
      
      this.setState('SPEAKING');
      this.isSpeaking = true;

      const totalLatency = Date.now() - asrReceivedAt;
      missionResult.metrics.totalLatencyMs = totalLatency;

      this.sendJson({
        type: 'VOICE_RESPONSE',
        utteranceId: uId,
        text: spokenText,
        mission: missionResult
      });
    } catch (err: any) {
      this.setState('ERROR');
      this.sendJson({
        type: 'VOICE_ERROR',
        utteranceId: uId,
        error: err.message
      });
    }
  }
}
