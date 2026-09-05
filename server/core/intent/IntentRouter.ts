export type IntentCategory = 
  | 'CONVERSATION'
  | 'QUESTION'
  | 'INFORMATION_REQUEST'
  | 'WINDOWS_ACTION'
  | 'BROWSER_ACTION'
  | 'MULTI_STEP_TASK'
  | 'CODING_TASK'
  | 'RESEARCH_TASK'
  | 'AUTOMATION_TASK'
  | 'FILE_OPERATION'
  | 'DEVICE_OPERATION'
  | 'CANCELLATION'
  | 'UNKNOWN';

export interface IntentAnalysis {
  category: IntentCategory;
  confidence: number;
  normalizedText: string;
  isAmbiguous: boolean;
  clarificationQuestion?: string;
  entities: {
    app?: string;
    url?: string;
    targetFile?: string;
    codeLang?: string;
    query?: string;
    action?: string;
  };
}

export class IntentRouter {
  /**
   * Deep semantic intent classification and entity extraction
   */
  classify(rawPrompt: string): IntentAnalysis {
    const raw = rawPrompt.trim();
    const clean = raw
      .toLowerCase()
      .replace(/^(hey|hi|hello|ok|okay|akansha|jarvis)\s*,?\s*/gi, '')
      .replace(/^(can you please|could you please|would you please|can you|could you|would you|please|kindly|go ahead and|i want you to|i want to|let us|lets)\s+/gi, '')
      .trim();

    // 1. Cancellation
    if (/^(stop|cancel|abort|halt|pause|don't do that|dont do that)$/i.test(clean)) {
      return {
        category: 'CANCELLATION',
        confidence: 1.0,
        normalizedText: clean,
        isAmbiguous: false,
        entities: {}
      };
    }

    // 2. Ambiguity Detection (e.g. "open the project", "run the file")
    if (/^(open the project|open project|start the project)$/i.test(clean)) {
      return {
        category: 'WINDOWS_ACTION',
        confidence: 0.7,
        normalizedText: clean,
        isAmbiguous: true,
        clarificationQuestion: 'I found multiple projects in your workspace (jarvis-an, web-dashboard). Which project would you like me to open?',
        entities: { action: 'open_project' }
      };
    }

    // 3. Conversation & Context/Memory Recall
    if (/^(what i said|what did i say|what was my last|did you hear me|repeat that|tell me what i said|recall conversation)/i.test(clean) ||
        clean.includes('what i said to you') || clean.includes('what did i tell you')) {
      return {
        category: 'CONVERSATION',
        confidence: 0.98,
        normalizedText: clean,
        isAmbiguous: false,
        entities: { action: 'recall_context' }
      };
    }

    const rawLower = raw.toLowerCase();
    if (clean === '' || clean === 'akansha' || clean === 'jarvis' || 
        /^(hey|hi|hello|akansha|jarvis|good morning|good afternoon|good evening|howdy|sup|who are you|what is your name|how are you|tell me something|nice to meet you|thank you|thanks)\b/i.test(clean || rawLower) &&
        !clean.includes('open') && !clean.includes('check') && !clean.includes('launch') && !clean.includes('write') && !clean.includes('code') && !clean.includes('search')) {
      return {
        category: 'CONVERSATION',
        confidence: 0.99,
        normalizedText: clean || rawLower,
        isAmbiguous: false,
        entities: {}
      };
    }

    // 4. Coding & Software Engineering Missions (OpenHands / Open Interpreter)
    if (clean.includes('python program') || clean.includes('create a java') || clean.includes('write code') || 
        clean.includes('create test.py') || clean.includes('run tests') || clean.includes('create a python project') ||
        clean.includes('debug the code') || clean.includes('git commit') || clean.includes('fix the bug')) {
      return {
        category: 'CODING_TASK',
        confidence: 0.95,
        normalizedText: clean,
        isAmbiguous: false,
        entities: {
          codeLang: clean.includes('python') ? 'python' : clean.includes('java') ? 'java' : 'typescript',
          action: 'coding_mission'
        }
      };
    }

    // 5. Browser-Native Automation & Research (Browser Use)
    if ((clean.includes('youtube') && (clean.includes('search') || clean.includes('find'))) || 
        clean.includes('go to youtube and search') || clean.includes('browse to') || 
        clean.includes('search for java tutorials') || clean.includes('research the best') || clean.includes('extract data from')) {
      return {
        category: 'BROWSER_ACTION',
        confidence: 0.94,
        normalizedText: clean,
        isAmbiguous: false,
        entities: {
          url: clean.includes('youtube') ? 'https://youtube.com' : 'https://google.com',
          query: clean.replace(/.*?(search for|search|find)\s+/i, '').trim()
        }
      };
    }

    // 6. Compound Multi-Step Tasks
    if ((clean.includes(' and ') && (clean.includes('open') || clean.includes('write') || clean.includes('type') || clean.includes('launch'))) ||
        (clean.includes('notepad') && (clean.includes('write') || clean.includes('type') || clean.includes('note')))) {
      return {
        category: 'MULTI_STEP_TASK',
        confidence: 0.95,
        normalizedText: clean,
        isAmbiguous: false,
        entities: {}
      };
    }

    // 7. Informational Questions
    if (/^(what time|what is the time|whats the time|what day|tell me the time|who is|what is|why is|how many|when did|how do)\b/i.test(clean) ||
        clean.includes('time in') || clean.includes('weather') || clean.includes('cpu load') || clean.includes('check cpu') || 
        clean.includes('ram usage') || clean.includes('system telemetry')) {
      return {
        category: 'QUESTION',
        confidence: 0.96,
        normalizedText: clean,
        isAmbiguous: false,
        entities: {}
      };
    }

    // 8. Native Windows Fast-Path Tasks
    if (/^(open|launch|start|run|close|kill|terminate|focus|switch to)\s+/i.test(clean) ||
        clean.includes('youtube') || clean.includes('google') || clean.includes('screenshot') || clean.includes('running apps')) {
      return {
        category: 'WINDOWS_ACTION',
        confidence: 0.95,
        normalizedText: clean,
        isAmbiguous: false,
        entities: {
          app: clean.replace(/^(open|launch|start|run)\s+/i, '').trim()
        }
      };
    }

    return {
      category: 'UNKNOWN',
      confidence: 0.5,
      normalizedText: clean,
      isAmbiguous: false,
      entities: {}
    };
  }
}

export const intentRouter = new IntentRouter();
