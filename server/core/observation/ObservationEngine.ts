import { processManager, ProcessInfo } from '../../windows/processManager';
import { screenCaptureService, ScreenshotResult } from '../../vision/screenCapture';

export interface DesktopObservation {
  timestamp: number;
  activeWindows: ProcessInfo[];
  foregroundWindow?: ProcessInfo;
  screenshotBase64?: string;
  hasNotepad: boolean;
  hasBrowser: boolean;
  hasVSCode: boolean;
  hasTerminal: boolean;
}

export class ObservationEngine {
  /**
   * Observe the current complete desktop environment state
   */
  async observeDesktop(includeScreenshot: boolean = false): Promise<DesktopObservation> {
    const windows = await processManager.getRunningWindows();
    let screenshot: ScreenshotResult | undefined;
    
    if (includeScreenshot) {
      try {
        screenshot = await screenCaptureService.captureScreen();
      } catch (e) {
        console.warn('[ObservationEngine] Screen capture omitted or failed:', e);
      }
    }

    const foreground = windows[0]; // First window in enumerated list
    const hasNotepad = windows.some(w => w.name.toLowerCase().includes('notepad') || (w.windowTitle && w.windowTitle.toLowerCase().includes('notepad')));
    const hasBrowser = windows.some(w => ['chrome', 'msedge', 'firefox', 'brave', 'opera'].some(b => w.name.toLowerCase().includes(b)));
    const hasVSCode = windows.some(w => w.name.toLowerCase().includes('code') || (w.windowTitle && w.windowTitle.toLowerCase().includes('visual studio code')));
    const hasTerminal = windows.some(w => ['wt', 'powershell', 'cmd', 'windowsterminal'].some(t => w.name.toLowerCase().includes(t)));

    return {
      timestamp: Date.now(),
      activeWindows: windows,
      foregroundWindow: foreground,
      screenshotBase64: screenshot?.base64Image,
      hasNotepad,
      hasBrowser,
      hasVSCode,
      hasTerminal
    };
  }

  /**
   * Observe specific application window
   */
  async observeWindow(appQuery: string): Promise<ProcessInfo | undefined> {
    const windows = await processManager.getRunningWindows();
    const q = appQuery.toLowerCase();
    return windows.find(w => w.name.toLowerCase().includes(q) || (w.windowTitle && w.windowTitle.toLowerCase().includes(q)));
  }
}

export const observationEngine = new ObservationEngine();
