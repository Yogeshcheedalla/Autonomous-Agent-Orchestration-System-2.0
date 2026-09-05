import { voiceRouter, VoiceProvider } from './voiceRouter';

export type SpeechState = 'IDLE' | 'VOICE_START' | 'SPEAKING' | 'VOICE_END' | 'INTERRUPTED';

export interface QueuedSpeech {
  utteranceId: string;
  text: string;
  providerId?: string;
  timestamp: number;
}

export class VoiceProviderManager {
  private speechState: SpeechState = 'IDLE';
  private currentUtteranceId: string | null = null;
  private currentSpeechText: string = '';
  private processedUtteranceIds: Set<string> = new Set();
  private speechQueue: QueuedSpeech[] = [];
  private lastSpokenTime: number = 0;
  private lastSpokenHash: string = '';

  /**
   * Enforce exactly ONE active speaker at a time
   */
  canSpeak(utteranceId: string, text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) return false;

    // 1. Check if utterance ID was already processed
    if (this.processedUtteranceIds.has(utteranceId)) {
      console.log(`[VoiceProviderManager] Blocked duplicate utterance ID: ${utteranceId}`);
      return false;
    }

    // 2. Check for identical speech collision within 2.5s
    const now = Date.now();
    const hash = `${trimmed.toLowerCase()}`;
    if (this.lastSpokenHash === hash && (now - this.lastSpokenTime < 2500)) {
      console.log(`[VoiceProviderManager] Blocked duplicate speech collision: "${trimmed.substring(0, 30)}..."`);
      return false;
    }

    // 3. Check if another speech is actively playing
    if (this.speechState === 'SPEAKING' || this.speechState === 'VOICE_START') {
      console.log(`[VoiceProviderManager] Speaker busy, speech state is ${this.speechState}.`);
      // We allow interrupt / override if explicitly new, but lock concurrent overlap
      return false;
    }

    return true;
  }

  startSpeech(utteranceId: string, text: string) {
    this.speechState = 'SPEAKING';
    this.currentUtteranceId = utteranceId;
    this.currentSpeechText = text;
    this.lastSpokenTime = Date.now();
    this.lastSpokenHash = text.trim().toLowerCase();
    this.processedUtteranceIds.add(utteranceId);

    // Limit memory set size
    if (this.processedUtteranceIds.size > 200) {
      const arr = Array.from(this.processedUtteranceIds);
      this.processedUtteranceIds = new Set(arr.slice(arr.length - 100));
    }
  }

  endSpeech(utteranceId: string) {
    if (this.currentUtteranceId === utteranceId || !utteranceId) {
      this.speechState = 'IDLE';
      this.currentUtteranceId = null;
      this.currentSpeechText = '';
    }
  }

  /**
   * Instant Hardware Barge-In: Flushes current speaker lock
   */
  interruptSpeech() {
    this.speechState = 'INTERRUPTED';
    this.currentUtteranceId = null;
    this.currentSpeechText = '';
    this.speechQueue = [];
    setTimeout(() => {
      if (this.speechState === 'INTERRUPTED') {
        this.speechState = 'IDLE';
      }
    }, 100);
  }

  getSpeechState(): SpeechState {
    return this.speechState;
  }

  getActiveProvider(): VoiceProvider {
    return voiceRouter.getActiveProvider();
  }

  getAllProviders(): VoiceProvider[] {
    return voiceRouter.getProviders();
  }
}

export const voiceProviderManager = new VoiceProviderManager();
