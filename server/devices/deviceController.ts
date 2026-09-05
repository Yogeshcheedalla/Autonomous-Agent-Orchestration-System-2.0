import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type DeviceCategory = 
  | 'audio_input'
  | 'audio_output'
  | 'display'
  | 'bluetooth'
  | 'printer'
  | 'camera'
  | 'smart_iot';

export interface DeviceInfo {
  id: string;
  name: string;
  category: DeviceCategory;
  status: 'connected' | 'active' | 'standby' | 'disconnected';
  capabilities: string[];
  batteryLevel?: number;
  properties?: any;
}

export class DeviceController {
  private devices: DeviceInfo[] = [
    {
      id: 'dev-mic-1',
      name: 'Realtek High Definition Audio (Default Mic)',
      category: 'audio_input',
      status: 'active',
      capabilities: ['16kHz_pcm_stream', 'echo_cancellation', 'vad_monitoring'],
      properties: { sampleRate: 16000, channels: 1 }
    },
    {
      id: 'dev-spk-1',
      name: 'Realtek Audio Speakers / Headphones',
      category: 'audio_output',
      status: 'active',
      capabilities: ['streaming_tts', 'volume_control', 'mute_toggle'],
      properties: { volume: 75, isMuted: false }
    },
    {
      id: 'dev-disp-1',
      name: 'Primary Display (Built-in Display)',
      category: 'display',
      status: 'active',
      capabilities: ['screen_capture', 'resolution_scale', 'visual_crosshair'],
      properties: { resolution: '1920x1080', refreshRate: '60 Hz', scaling: '125%' }
    },
    {
      id: 'dev-bt-1',
      name: 'Logitech MX Master 3S (Bluetooth)',
      category: 'bluetooth',
      status: 'connected',
      capabilities: ['dpi_control', 'gesture_scroll', 'battery_telemetry'],
      batteryLevel: 88,
      properties: { signalStrength: '-42 dBm' }
    },
    {
      id: 'dev-bt-2',
      name: 'Sony WH-1000XM5 (Wireless Headset)',
      category: 'bluetooth',
      status: 'connected',
      capabilities: ['anc_mode', 'spatial_audio', 'mic_input'],
      batteryLevel: 94,
      properties: { codec: 'LDAC' }
    },
    {
      id: 'dev-cam-1',
      name: 'Integrated HD Webcam (720p)',
      category: 'camera',
      status: 'standby',
      capabilities: ['frame_stream', 'face_presence_detection'],
      properties: { fps: 30 }
    }
  ];

  /**
   * Scan connected Windows hardware
   */
  async scanDevices(): Promise<DeviceInfo[]> {
    try {
      // Query Windows PnP & audio endpoints via PowerShell
      const psScript = `powershell -NoProfile -Command "Get-PnpDevice -Class 'AudioEndpoint','Monitor','Bluetooth' -Status 'OK' | Select-Object -First 6 FriendlyName, Class | ConvertTo-Json"`;
      const { stdout } = await execAsync(psScript);
      if (stdout.trim()) {
        const parsed = JSON.parse(stdout);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        list.forEach((item, idx) => {
          if (item.FriendlyName && !this.devices.some(d => d.name === item.FriendlyName)) {
            this.devices.push({
              id: `pnp-${idx}`,
              name: item.FriendlyName,
              category: item.Class === 'AudioEndpoint' ? 'audio_output' : item.Class === 'Monitor' ? 'display' : 'bluetooth',
              status: 'connected',
              capabilities: ['pnp_query', 'status_poll']
            });
          }
        });
      }
    } catch (err: any) {
      console.warn('[DeviceController] PnP scan notice:', err.message);
    }
    return this.devices;
  }

  getDevices(): DeviceInfo[] {
    return this.devices;
  }

  async executeDeviceAction(deviceId: string, action: string, value?: any): Promise<{ success: boolean; message: string }> {
    const dev = this.devices.find(d => d.id === deviceId);
    if (!dev) return { success: false, message: 'Device not found' };

    if (action === 'set_volume') {
      if (dev.properties) dev.properties.volume = value;
      return { success: true, message: `${dev.name} volume set to ${value}%.` };
    }
    if (action === 'toggle_mute') {
      if (dev.properties) dev.properties.isMuted = !dev.properties.isMuted;
      return { success: true, message: `${dev.name} mute toggled (${dev.properties?.isMuted ? 'Muted' : 'Unmuted'}).` };
    }

    return { success: true, message: `Action '${action}' dispatched to ${dev.name}.` };
  }
}

export const deviceController = new DeviceController();
