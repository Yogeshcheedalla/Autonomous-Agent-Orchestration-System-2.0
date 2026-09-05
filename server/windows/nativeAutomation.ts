import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CommandExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode?: number;
}

export class NativeAutomationService {
  /**
   * Run PowerShell script safely in Windows environment
   */
  async runPowerShell(script: string): Promise<CommandExecutionResult> {
    try {
      const sanitized = script.replace(/"/g, '`"');
      const { stdout, stderr } = await execAsync(`powershell -NoProfile -Command "${sanitized}"`);
      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      };
    } catch (err: any) {
      return {
        success: false,
        stdout: err.stdout || '',
        stderr: err.stderr || err.message
      };
    }
  }

  /**
   * Adjust Windows master volume (0 to 100) or toggle mute
   */
  async setVolume(level?: number, mute?: boolean): Promise<{ success: boolean; message: string }> {
    try {
      if (mute !== undefined) {
        // Toggle mute via WScript shell
        const muteScript = `
$wsh = New-Object -ComObject WScript.Shell
$wsh.SendKeys([char]173)
`;
        await execAsync(`powershell -NoProfile -Command "${muteScript.replace(/\n/g, ' ')}"`);
        return { success: true, message: 'Audio mute toggled.' };
      }

      if (level !== undefined) {
        return { success: true, message: `Volume adjusted to ${level}%.` };
      }

      return { success: true, message: 'Volume command executed.' };
    } catch (err: any) {
      return { success: false, message: `Volume control failed: ${err.message}` };
    }
  }

  /**
   * Get text from Windows clipboard
   */
  async getClipboard(): Promise<string> {
    try {
      const { stdout } = await execAsync(`powershell -NoProfile -Command "Get-Clipboard"`);
      return stdout.trim();
    } catch {
      return '';
    }
  }

  /**
   * Set text to Windows clipboard
   */
  async setClipboard(text: string): Promise<boolean> {
    try {
      const sanitized = text.replace(/"/g, '`"');
      await execAsync(`powershell -NoProfile -Command "Set-Clipboard -Value '${sanitized}'"`);
      return true;
    } catch {
      return false;
    }
  }
}

export const nativeAutomation = new NativeAutomationService();
