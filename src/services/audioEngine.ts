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

export class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private wsVoice: WebSocket | null = null;
  private recognition: any = null;
  private shouldRestartRecognition: boolean = false;
  
  public onStateChange?: (state: VoiceState) => void;
  public onPartialTranscript?: (text: string) => void;
  public onFinalTranscript?: (text: string, utteranceId?: string) => void;
  public onBargeIn?: () => void;
  public onSpokenResponse?: (text: string, mission?: any, utteranceId?: string) => void;

  private isListening: boolean = false;
  private isSynthesizing: boolean = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isInitialized: boolean = false;
  private lastSpokenText: string = '';
  private lastSpokenTime: number = 0;
  private processedUtteranceIds: Set<string> = new Set();
  private selectedFemaleVoice: SpeechSynthesisVoice | null = null;

  async init(wsUrl?: string) {
    if (this.isInitialized && this.wsVoice?.readyState === WebSocket.OPEN) {
      return;
    }
    this.isInitialized = true;
    this.initVoiceSelection();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const defaultWsUrl = `${protocol}//${window.location.hostname}:5000/ws/voice`;
    this.connectWs(wsUrl || defaultWsUrl);
    this.setupSpeechRecognition();
  }

  /**
   * Preload and cache the single English Female voice
   */
  private initVoiceSelection() {
    if (!('speechSynthesis' in window)) return;
    
    this.loadFemaleVoice();
    window.speechSynthesis.onvoiceschanged = () => {
      this.loadFemaleVoice();
    };
  }

  private loadFemaleVoice(): SpeechSynthesisVoice | null {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    // Filter strictly for Female English voices
    const female = voices.find(v => {
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();
      return (lang.startsWith('en')) && (
        name.includes('zira') ||
        name.includes('jenny') ||
        name.includes('samantha') ||
        name.includes('aria') ||
        name.includes('victoria') ||
        name.includes('karen') ||
        name.includes('female') ||
        (name.includes('natural') && !name.includes('guy') && !name.includes('male') && !name.includes('david'))
      );
    }) || voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('david') && !v.name.toLowerCase().includes('male'))
       || voices.find(v => v.lang.startsWith('en'));

    if (female) {
      this.selectedFemaleVoice = female;
      console.log(`[AudioEngine] Enforced Single Female Voice: "${female.name}" (${female.lang})`);
    }
    return female || null;
  }

  private connectWs(wsUrl: string) {
    try {
      if (this.wsVoice && (this.wsVoice.readyState === WebSocket.OPEN || this.wsVoice.readyState === WebSocket.CONNECTING)) {
        return;
      }
      this.wsVoice = new WebSocket(wsUrl);
      this.wsVoice.binaryType = 'arraybuffer';

      this.wsVoice.onopen = () => {
        console.log('[AudioEngine] Connected to Voice WebSocket');
      };

      this.wsVoice.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleServerVoiceEvent(msg);
        } catch {
          // Non-JSON message
        }
      };

      this.wsVoice.onclose = () => {
        console.log('[AudioEngine] Voice WS closed, reconnecting in 2s...');
        setTimeout(() => {
          this.wsVoice = null;
          this.connectWs(wsUrl);
        }, 2000);
      };

      this.wsVoice.onerror = (err) => {
        console.warn('[AudioEngine] Voice WS error:', err);
      };
    } catch (err) {
      console.error('[AudioEngine] WS connection error:', err);
    }
  }

  private handleServerVoiceEvent(msg: any) {
    switch (msg.type) {
      case 'VOICE_STATE_CHANGED':
        this.onStateChange?.(msg.state);
        break;

      case 'VOICE_INTERRUPTED':
        console.log('[AudioEngine] Server triggered BARGE-IN');
        this.cancelSpeech();
        this.onBargeIn?.();
        break;

      case 'VOICE_FINAL_TRANSCRIPT':
        if (msg.utteranceId && this.processedUtteranceIds.has(msg.utteranceId)) {
          return;
        }
        if (msg.utteranceId) this.processedUtteranceIds.add(msg.utteranceId);
        this.onFinalTranscript?.(msg.text, msg.utteranceId);
        break;

      case 'VOICE_RESPONSE':
        const spokenKey = (msg.utteranceId || '') + '-spoken-' + msg.text;
        if (this.processedUtteranceIds.has(spokenKey)) {
          console.log('[AudioEngine] Blocked duplicate VOICE_RESPONSE playback');
          return;
        }
        this.processedUtteranceIds.add(spokenKey);
        this.onSpokenResponse?.(msg.text, msg.mission, msg.utteranceId);
        this.speak(msg.text);
        break;
    }
  }

  private setupSpeechRecognition() {
    if (this.recognition) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const final = event.results[i][0].transcript.trim();
            if (final) {
              const uId = 'rec-' + Date.now();
              this.onFinalTranscript?.(final, uId);
              this.sendJson({ type: 'SUBMIT_TRANSCRIPT', text: final, utteranceId: uId });
            }
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (interim) {
          this.onPartialTranscript?.(interim);
          if (this.isSynthesizing) {
            this.cancelSpeech();
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('[AudioEngine] SpeechRecognition error:', event.error);
        if (event.error === 'not-allowed') {
          this.shouldRestartRecognition = false;
        }
      };

      this.recognition.onend = () => {
        if (this.shouldRestartRecognition && this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {
            console.debug('[AudioEngine] Recognition restart delayed');
          }
        }
      };
    }
  }

  async startMicrophone(): Promise<boolean> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone not supported on this browser context');
      }

      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000
      });

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      const source = this.audioCtx.createMediaStreamSource(this.micStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      // ScriptProcessor to capture PCM chunks and pipe to WS
      this.scriptProcessor = this.audioCtx.createScriptProcessor(4096, 1, 1);
      source.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioCtx.destination);

      this.scriptProcessor.onaudioprocess = (e) => {
        if (!this.isListening && !this.isSynthesizing) return;
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert Float32Array to 16-bit PCM Int16Array
        const pcmBuffer = new Int16Array(inputData.length);
        let energySum = 0;
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmBuffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          energySum += s * s;
        }

        const rms = Math.sqrt(energySum / inputData.length);

        // Local Instant Barge-In detection: if TTS is speaking and user mic volume rises
        if (this.isSynthesizing && rms > 0.05) {
          console.log('[AudioEngine] Local instant barge-in triggered on microphone energy');
          this.cancelSpeech();
        }

        // Stream raw binary PCM to backend WebSocket
        if (this.wsVoice && this.wsVoice.readyState === WebSocket.OPEN) {
          this.wsVoice.send(pcmBuffer.buffer);
        }
      };

      this.isListening = true;
      this.shouldRestartRecognition = true;
      this.sendJson({ type: 'START_LISTENING' });

      if (this.recognition) {
        try { 
          this.recognition.start(); 
        } catch (e) {
          console.debug('[AudioEngine] SpeechRecognition already started or error');
        }
      }

      return true;
    } catch (err: any) {
      console.error('[AudioEngine] Microphone init failed:', err.message);
      return false;
    }
  }

  stopMicrophone() {
    this.isListening = false;
    this.shouldRestartRecognition = false;
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    if (this.recognition) {
      try { this.recognition.stop(); } catch {}
    }
    this.sendJson({ type: 'STOP_LISTENING' });
  }

  getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(128);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  getTimeDomainData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(128);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(data);
    return data;
  }

  /**
   * Speak response using single high quality Female voice only with exclusive speaker lock
   */
  speak(text: string) {
    if (!('speechSynthesis' in window) || !text) return;
    
    // Prevent duplicate speech of the same text within 2.5 seconds
    const now = Date.now();
    if (this.lastSpokenText === text && now - this.lastSpokenTime < 2500) {
      console.log('[AudioEngine] Blocked duplicate speak call for same utterance within 2.5s');
      return;
    }
    this.lastSpokenText = text;
    this.lastSpokenTime = now;

    // Halt and flush any existing speech immediately
    this.cancelSpeech();

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;
    this.isSynthesizing = true;
    
    // Ensure female voice is selected
    const voice = this.selectedFemaleVoice || this.loadFemaleVoice();
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.rate = 1.02;
    utterance.pitch = 1.05;

    utterance.onstart = () => {
      this.isSynthesizing = true;
      this.sendJson({ type: 'TTS_STARTED' });
    };

    utterance.onend = () => {
      this.isSynthesizing = false;
      this.currentUtterance = null;
      this.sendJson({ type: 'TTS_STOPPED' });
    };

    utterance.onerror = () => {
      this.isSynthesizing = false;
      this.currentUtterance = null;
      this.sendJson({ type: 'TTS_STOPPED' });
    };

    window.speechSynthesis.speak(utterance);
  }

  submitTextCommand(text: string) {
    if (!text.trim()) return;
    const uId = 'txt-' + Date.now();
    this.onFinalTranscript?.(text.trim(), uId);
    this.sendJson({ type: 'SUBMIT_TRANSCRIPT', text: text.trim(), utteranceId: uId });
  }

  /**
   * BARGE-IN: Instantly cancel current TTS speech output
   */
  cancelSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSynthesizing = false;
    this.currentUtterance = null;
    this.sendJson({ type: 'TTS_STOPPED' });
    this.onStateChange?.('INTERRUPTED');
  }

  sendJson(data: any) {
    if (this.wsVoice && this.wsVoice.readyState === WebSocket.OPEN) {
      this.wsVoice.send(JSON.stringify(data));
    }
  }

  setProvider(providerId: string) {
    this.sendJson({ type: 'SET_PROVIDER', providerId });
  }
}

export const audioEngine = new AudioEngine();

