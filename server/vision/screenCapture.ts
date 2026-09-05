import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';

const execAsync = promisify(exec);

export interface ScreenMetrics {
  width: number;
  height: number;
  monitorsCount: number;
  scaling: number;
  timestamp: string;
}

export interface ScreenshotResult {
  success: boolean;
  base64Image?: string;
  metrics?: ScreenMetrics;
  error?: string;
}

export class ScreenCaptureService {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp_captures');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Capture full desktop screen using native .NET System.Drawing on Windows
   */
  async captureScreen(): Promise<ScreenshotResult> {
    const filename = `screen_${Date.now()}.png`;
    const filePath = path.join(this.tempDir, filename);

    const psScript = `
Add-Type -AssemblyName System.Windows.Forms;
Add-Type -AssemblyName System.Drawing;
$screen = [System.Windows.Forms.Screen]::PrimaryScreen;
$bounds = $screen.Bounds;
$bitmap = New-Object System.Drawing.Bitmap($bounds.Width, $bounds.Height);
$graphics = [System.Drawing.Graphics]::FromImage($bitmap);
$graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size);
$bitmap.Save('${filePath.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png);
$graphics.Dispose();
$bitmap.Dispose();
[PSCustomObject]@{ Width = $bounds.Width; Height = $bounds.Height; Monitors = [System.Windows.Forms.Screen]::AllScreens.Count } | ConvertTo-Json;
`;

    try {
      const { stdout } = await execAsync(`powershell -NoProfile -Command "${psScript.replace(/\n/g, ' ')}"`);
      const meta = JSON.parse(stdout || '{}');

      if (fs.existsSync(filePath)) {
        const imageBuffer = fs.readFileSync(filePath);
        const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;

        // Cleanup temporary image file after reading
        try { fs.unlinkSync(filePath); } catch {}

        return {
          success: true,
          base64Image,
          metrics: {
            width: meta.Width || 1920,
            height: meta.Height || 1080,
            monitorsCount: meta.Monitors || 1,
            scaling: 1.0,
            timestamp: new Date().toLocaleTimeString()
          }
        };
      }

      return {
        success: false,
        error: 'Screenshot file was not generated'
      };
    } catch (err: any) {
      console.error('[ScreenCapture] Error capturing screen:', err.message);
      return {
        success: false,
        error: err.message
      };
    }
  }
}

export const screenCaptureService = new ScreenCaptureService();
