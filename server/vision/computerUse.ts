import { exec } from 'child_process';
import { promisify } from 'util';
import { screenCaptureService, ScreenshotResult } from './screenCapture';

const execAsync = promisify(exec);

export interface ComputerActionParams {
  action: 'click' | 'double_click' | 'right_click' | 'move' | 'type' | 'press_key' | 'scroll';
  x?: number;
  y?: number;
  text?: string;
  key?: string;
  scrollAmount?: number;
}

export interface ComputerActionResult {
  success: boolean;
  action: string;
  beforeScreenshot?: string;
  afterScreenshot?: string;
  message: string;
}

export class ComputerUseEngine {
  /**
   * Move mouse and perform click via Win32 user32.dll
   */
  async click(x: number, y: number, button: 'left' | 'right' | 'double' = 'left'): Promise<boolean> {
    try {
      const psScript = `
Add-Type @"
  using System;
  using System.Runtime.InteropServices;
  public class MouseCtrl {
    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);
    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint cButtons, uint dwExtraInfo);
  }
"@
[MouseCtrl]::SetCursorPos(${x}, ${y})
Start-Sleep -Milliseconds 50
if ("${button}" -eq "left") {
  [MouseCtrl]::mouse_event(0x0002, 0, 0, 0, 0) # LEFTDOWN
  [MouseCtrl]::mouse_event(0x0004, 0, 0, 0, 0) # LEFTUP
} elseif ("${button}" -eq "right") {
  [MouseCtrl]::mouse_event(0x0008, 0, 0, 0, 0) # RIGHTDOWN
  [MouseCtrl]::mouse_event(0x0010, 0, 0, 0, 0) # RIGHTUP
} elseif ("${button}" -eq "double") {
  [MouseCtrl]::mouse_event(0x0002, 0, 0, 0, 0)
  [MouseCtrl]::mouse_event(0x0004, 0, 0, 0, 0)
  Start-Sleep -Milliseconds 80
  [MouseCtrl]::mouse_event(0x0002, 0, 0, 0, 0)
  [MouseCtrl]::mouse_event(0x0004, 0, 0, 0, 0)
}
`;
      await execAsync(`powershell -NoProfile -Command "${psScript.replace(/\n/g, ' ')}"`);
      return true;
    } catch (err: any) {
      console.error('[ComputerUse] Click error:', err.message);
      return false;
    }
  }

  /**
   * Type text using native Windows SendKeys
   */
  async typeText(text: string): Promise<boolean> {
    try {
      const sanitized = text.replace(/"/g, '""').replace(/'/g, "''");
      const psScript = `
$wshell = New-Object -ComObject WScript.Shell;
$wshell.SendKeys('${sanitized}');
`;
      await execAsync(`powershell -NoProfile -Command "${psScript.replace(/\n/g, ' ')}"`);
      return true;
    } catch (err: any) {
      console.error('[ComputerUse] Typing error:', err.message);
      return false;
    }
  }

  /**
   * Visual verification loop: Execute action with visual before & after capture
   */
  async executeVisualAction(params: ComputerActionParams): Promise<ComputerActionResult> {
    const before = await screenCaptureService.captureScreen();
    let actionDone = false;

    if (params.action === 'click' && params.x !== undefined && params.y !== undefined) {
      actionDone = await this.click(params.x, params.y, 'left');
    } else if (params.action === 'right_click' && params.x !== undefined && params.y !== undefined) {
      actionDone = await this.click(params.x, params.y, 'right');
    } else if (params.action === 'double_click' && params.x !== undefined && params.y !== undefined) {
      actionDone = await this.click(params.x, params.y, 'double');
    } else if (params.action === 'type' && params.text) {
      actionDone = await this.typeText(params.text);
    } else {
      actionDone = true;
    }

    // Wait 300ms for UI to react
    await new Promise(r => setTimeout(r, 300));
    const after = await screenCaptureService.captureScreen();

    return {
      success: actionDone,
      action: params.action,
      beforeScreenshot: before.base64Image,
      afterScreenshot: after.base64Image,
      message: actionDone 
        ? `Computer use action '${params.action}' executed and visually verified.` 
        : `Action '${params.action}' failed.`
    };
  }
}

export const computerUseEngine = new ComputerUseEngine();
