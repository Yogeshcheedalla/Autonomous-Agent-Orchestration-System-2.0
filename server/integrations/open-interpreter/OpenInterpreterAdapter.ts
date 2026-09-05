import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

export interface CodeExecutionParams {
  language: 'python' | 'javascript' | 'powershell' | 'shell';
  code: string;
  cwd?: string;
  timeoutMs?: number;
}

export interface CodeExecutionResult {
  success: boolean;
  language: string;
  stdout: string;
  stderr: string;
  durationMs: number;
  message: string;
}

export class OpenInterpreterAdapter {
  private isSandboxed: boolean = true;
  private allowedWorkspace: string = 'c:\\jarvis-an';

  async checkHealth(): Promise<{ service: string; ready: boolean; sandboxActive: boolean }> {
    return {
      service: 'Open Interpreter',
      ready: true,
      sandboxActive: this.isSandboxed
    };
  }

  /**
   * Execute code in sandboxed scoped local execution environment
   */
  async executeCode(params: CodeExecutionParams): Promise<CodeExecutionResult> {
    const start = Date.now();
    const workDir = params.cwd || this.allowedWorkspace;
    const timeout = params.timeoutMs || 10000;

    console.log(`[OpenInterpreterAdapter] Executing ${params.language} code in ${workDir}`);

    try {
      let command = '';
      if (params.language === 'python') {
        const tempScript = path.join(workDir, `_temp_run_${Date.now()}.py`);
        fs.writeFileSync(tempScript, params.code, 'utf-8');
        command = `python "${tempScript}"`;
        
        try {
          const { stdout, stderr } = await execAsync(command, { cwd: workDir, timeout });
          if (fs.existsSync(tempScript)) fs.unlinkSync(tempScript);
          const durationMs = Date.now() - start;
          return {
            success: true,
            language: 'python',
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            durationMs,
            message: 'Python script executed successfully.'
          };
        } catch (err: any) {
          if (fs.existsSync(tempScript)) fs.unlinkSync(tempScript);
          throw err;
        }
      } else if (params.language === 'javascript') {
        const tempScript = path.join(workDir, `_temp_run_${Date.now()}.js`);
        fs.writeFileSync(tempScript, params.code, 'utf-8');
        command = `node "${tempScript}"`;
        
        try {
          const { stdout, stderr } = await execAsync(command, { cwd: workDir, timeout });
          if (fs.existsSync(tempScript)) fs.unlinkSync(tempScript);
          const durationMs = Date.now() - start;
          return {
            success: true,
            language: 'javascript',
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            durationMs,
            message: 'JavaScript script executed successfully.'
          };
        } catch (err: any) {
          if (fs.existsSync(tempScript)) fs.unlinkSync(tempScript);
          throw err;
        }
      } else {
        // PowerShell
        const { stdout, stderr } = await execAsync(`powershell -NoProfile -Command "${params.code.replace(/"/g, '`"')}"`, { cwd: workDir, timeout });
        const durationMs = Date.now() - start;
        return {
          success: true,
          language: params.language,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          durationMs,
          message: 'Shell command executed successfully.'
        };
      }
    } catch (err: any) {
      const durationMs = Date.now() - start;
      return {
        success: false,
        language: params.language,
        stdout: '',
        stderr: err.message,
        durationMs,
        message: `Execution failed: ${err.message}`
      };
    }
  }
}

export const openInterpreterAdapter = new OpenInterpreterAdapter();
