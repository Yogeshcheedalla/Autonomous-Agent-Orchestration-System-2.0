import { securityGuard } from '../orchestrator/securityGuard';

export type PlatformType = 
  | 'whatsapp' 
  | 'telegram' 
  | 'discord' 
  | 'slack' 
  | 'x' 
  | 'linkedin' 
  | 'gmail' 
  | 'outlook';

export interface UnifiedMessage {
  id: string;
  platform: PlatformType;
  sender: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'direct' | 'mention' | 'channel' | 'security_alert';
  isRead: boolean;
}

export interface DraftMessage {
  id: string;
  platform: PlatformType;
  recipient: string;
  content: string;
  requiresApproval: boolean;
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'scheduled';
  scheduledTime?: string;
}

export class CommunicationHub {
  private messages: UnifiedMessage[] = [
    {
      id: 'msg-1',
      platform: 'discord',
      sender: 'DevOps Alert Bot',
      content: 'Server cluster staging-node-04 CPU utilization exceeded 85%. Automated scale-out triggered.',
      timestamp: 'Just now',
      urgency: 'HIGH',
      category: 'security_alert',
      isRead: false
    },
    {
      id: 'msg-2',
      platform: 'slack',
      sender: 'Elena (Lead Architect)',
      content: 'Hey! The PR for the native Windows bridge is ready for review. Let me know when tests pass.',
      timestamp: '5m ago',
      urgency: 'MEDIUM',
      category: 'direct',
      isRead: false
    },
    {
      id: 'msg-3',
      platform: 'whatsapp',
      sender: 'Engineering Team',
      content: 'Sync scheduled at 4:30 PM for the Qwen Audio realtime latency benchmarks.',
      timestamp: '15m ago',
      urgency: 'LOW',
      category: 'channel',
      isRead: true
    },
    {
      id: 'msg-4',
      platform: 'x',
      sender: '@TechDaily',
      content: 'Mentioned you: "Exploring local-first autonomous AI operating layers with Win32 controls..."',
      timestamp: '30m ago',
      urgency: 'LOW',
      category: 'mention',
      isRead: true
    },
    {
      id: 'msg-5',
      platform: 'gmail',
      sender: 'GitHub Notifications',
      content: '[jarvis-an] Pull request #4 merged: "feat: add Silero VAD and instant barge-in support"',
      timestamp: '1h ago',
      urgency: 'MEDIUM',
      category: 'channel',
      isRead: true
    }
  ];

  private drafts: DraftMessage[] = [];

  getUnifiedInbox(): UnifiedMessage[] {
    return this.messages;
  }

  getDrafts(): DraftMessage[] {
    return this.drafts;
  }

  createDraft(platform: PlatformType, recipient: string, content: string, scheduleTime?: string): DraftMessage {
    const isHighImpact = platform === 'x' || platform === 'linkedin' || recipient.toLowerCase().includes('all') || recipient.toLowerCase().includes('everyone');
    const risk = securityGuard.evaluateRisk('Send Social Message', `${platform}:${recipient}`);

    const draft: DraftMessage = {
      id: 'dft-' + Math.random().toString(36).substring(2, 9),
      platform,
      recipient,
      content,
      requiresApproval: isHighImpact || risk !== 'SAFE',
      status: isHighImpact ? 'pending_approval' : 'draft',
      scheduledTime: scheduleTime
    };

    this.drafts.unshift(draft);
    securityGuard.logDecision(`Draft ${platform} message`, recipient, risk, !draft.requiresApproval, false);
    return draft;
  }

  approveAndSendMessage(draftId: string): { success: boolean; message: string } {
    const draft = this.drafts.find(d => d.id === draftId);
    if (!draft) return { success: false, message: 'Draft not found' };

    draft.status = 'sent';
    securityGuard.logDecision(`Execute send on ${draft.platform}`, draft.recipient, 'SAFE', true, true);
    return {
      success: true,
      message: `Message dispatched successfully to ${draft.recipient} via ${draft.platform.toUpperCase()}`
    };
  }
}

export const communicationHub = new CommunicationHub();
