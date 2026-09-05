import { WebSocket } from 'ws';

export type AgentEventType =
  | 'RUN_STARTED'
  | 'PLAN_CREATED'
  | 'STEP_STARTED'
  | 'STEP_FINISHED'
  | 'TOOL_CALL_STARTED'
  | 'TOOL_CALL_ARGS'
  | 'TOOL_CALL_RESULT'
  | 'OBSERVATION_CREATED'
  | 'STATE_UPDATED'
  | 'MESSAGE_STARTED'
  | 'MESSAGE_DELTA'
  | 'MESSAGE_FINISHED'
  | 'APPROVAL_REQUIRED'
  | 'APPROVAL_GRANTED'
  | 'APPROVAL_DENIED'
  | 'GENERATIVE_UI_EMITTED'
  | 'ERROR'
  | 'RECOVERY_STARTED'
  | 'RECOVERY_FINISHED'
  | 'MEMORY_UPDATED'
  | 'RUN_FINISHED';

export interface GenerativeUIPayload {
  component: string; // e.g. 'ResearchResultsCard', 'AgentGraphVisualizer', 'CodeDiffCard', 'ConfirmationDialog'
  props: Record<string, any>;
  timestamp: string;
}

export interface AgentEvent {
  eventId: string;
  runId: string;
  type: AgentEventType;
  timestamp: string;
  source: string; // e.g. 'MasterOrchestrator', 'ResearchAgent', 'VerificationSentinel'
  data?: any;
  uiPayload?: GenerativeUIPayload;
}

export class AgentEventStream {
  private subscribers: Set<WebSocket> = new Set();
  private eventHistory: AgentEvent[] = [];

  subscribe(ws: WebSocket) {
    this.subscribers.add(ws);
    // Send recent events for synchronization
    const recent = this.eventHistory.slice(-25);
    for (const evt of recent) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(evt));
      }
    }
  }

  unsubscribe(ws: WebSocket) {
    this.subscribers.delete(ws);
  }

  /**
   * Broadcast an authentic AG-UI event to all connected UI clients
   */
  emit(
    runId: string, 
    type: AgentEventType, 
    source: string, 
    data?: any, 
    uiPayload?: GenerativeUIPayload
  ): AgentEvent {
    const event: AgentEvent = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      runId,
      type,
      timestamp: new Date().toISOString(),
      source,
      data,
      uiPayload
    };

    this.eventHistory.push(event);
    if (this.eventHistory.length > 500) {
      this.eventHistory.shift();
    }

    const payload = JSON.stringify(event);
    for (const ws of this.subscribers) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }

    return event;
  }

  getHistory(runId?: string): AgentEvent[] {
    if (runId) {
      return this.eventHistory.filter(e => e.runId === runId);
    }
    return this.eventHistory;
  }
}

export const agentEventStream = new AgentEventStream();
