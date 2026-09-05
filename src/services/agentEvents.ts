export interface GenerativeUIPayload {
  component: string;
  props: Record<string, any>;
  timestamp: string;
}

export interface AgentEvent {
  eventId: string;
  runId: string;
  type: string;
  timestamp: string;
  source: string;
  data?: any;
  uiPayload?: GenerativeUIPayload;
}

export class AgentEventsClient {
  private ws: WebSocket | null = null;
  private listeners: Set<(event: AgentEvent) => void> = new Set();
  private uiListeners: Set<(payload: GenerativeUIPayload) => void> = new Set();
  private events: AgentEvent[] = [];
  private activeUIPayloads: GenerativeUIPayload[] = [];

  init(wsUrl?: string) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const defaultWsUrl = `${protocol}//${window.location.hostname}:5000/ws/events`;
    const targetUrl = wsUrl || defaultWsUrl;

    try {
      this.ws = new WebSocket(targetUrl);

      this.ws.onopen = () => {
        console.log('[AgentEventsClient] Connected to AG-UI Event Stream.');
      };

      this.ws.onmessage = (msgEvent) => {
        try {
          const event: AgentEvent = JSON.parse(msgEvent.data);
          this.events.unshift(event);
          if (this.events.length > 200) this.events.pop();

          // Dispatch to general listeners
          this.listeners.forEach(cb => cb(event));

          // If event has Generative UI payload, dispatch to UI listeners
          if (event.uiPayload) {
            this.activeUIPayloads.unshift(event.uiPayload);
            if (this.activeUIPayloads.length > 20) this.activeUIPayloads.pop();
            this.uiListeners.forEach(cb => cb(event.uiPayload!));
          }
        } catch (err) {
          // ignore non-JSON
        }
      };

      this.ws.onclose = () => {
        setTimeout(() => this.init(targetUrl), 2500);
      };

      this.ws.onerror = () => {};
    } catch (e) {
      console.warn('[AgentEventsClient] Failed to establish WS:', e);
    }
  }

  onEvent(callback: (event: AgentEvent) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  onGenerativeUI(callback: (payload: GenerativeUIPayload) => void) {
    this.uiListeners.add(callback);
    return () => this.uiListeners.delete(callback);
  }

  getEvents(): AgentEvent[] {
    return this.events;
  }

  getActiveUIPayloads(): GenerativeUIPayload[] {
    return this.activeUIPayloads;
  }
}

export const agentEventsClient = new AgentEventsClient();
