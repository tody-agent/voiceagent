import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { ensureValidWavBuffer } from './geminiTts.ts';

export type VieNeuPresetId = 'adam' | 'truc_ly' | 'thien_minh' | 'mai_anh' | 'hai_dang';

export interface VieNeuPresetInfo {
  id: string;
  label: string;
  description: string;
}

export const VIENEU_PRESETS: VieNeuPresetInfo[] = [
  {
    id: 'adam',
    label: 'Adam — Tody 32 tuổi (Duy nhất toàn hệ thống)',
    description:
      'Giọng nam 32 tuổi trầm ấm, hài hước, thông minh, đĩnh đạc — chuẩn VieNeu-TTS v3 Turbo 48kHz',
  },
  {
    id: 'hai_dang',
    label: 'Hải Đăng — Nam Bắc tự nhiên',
    description: 'Giọng nam miền Bắc phong cách tự nhiên, truyền cảm',
  },
  {
    id: 'mai_anh',
    label: 'Mai Anh — Nữ Bắc tin tức',
    description: 'Giọng nữ miền Bắc phong cách chuyên nghiệp, thanh lịch',
  },
];

function resolvePythonBin(): string {
  if (process.env.VIENEU_PYTHON_BIN && fs.existsSync(process.env.VIENEU_PYTHON_BIN)) {
    return process.env.VIENEU_PYTHON_BIN;
  }
  const localVenvPy = path.resolve(process.cwd(), '.venv', 'bin', 'python3');
  if (fs.existsSync(localVenvPy)) {
    return localVenvPy;
  }
  return 'python3';
}

function resolveWorkerScript(): string {
  if (process.env.VIENEU_WORKER_SCRIPT && fs.existsSync(process.env.VIENEU_WORKER_SCRIPT)) {
    return process.env.VIENEU_WORKER_SCRIPT;
  }
  const candidates = [
    path.resolve(process.cwd(), 'packages', 'voice-sales-sdk', 'tools', 'vieneu_tts_worker.py'),
    path.resolve(process.cwd(), 'tools', 'vieneu_tts_worker.py'),
    path.resolve(process.cwd(), 'scripts', 'vieneu_tts_worker.py'),
    path.resolve(import.meta.dirname || '', '../../packages/voice-sales-sdk/tools/vieneu_tts_worker.py'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

export interface VieNeuSynthResult {
  wavBuffer: Buffer;
  durationSeconds: number;
  modelUsed: string;
  voiceName: string;
  source: 'vieneu_tts';
  mp3Path?: string;
  mp3SizeBytes?: number;
}

export function isVieNeuAvailable(): boolean {
  const pyBin = resolvePythonBin();
  const workerPath = resolveWorkerScript();
  if (!fs.existsSync(workerPath)) return false;
  if (pyBin === 'python3') return true;
  return fs.existsSync(pyBin);
}

// Backward-compatibility alias
export const isOmniVoiceAvailable = isVieNeuAvailable;
export type OmniVoicePresetId = VieNeuPresetId;
export type OmniVoiceSynthResult = VieNeuSynthResult;
export const OMNIVOICE_PRESETS = VIENEU_PRESETS;

interface PendingJob {
  resolve: (data: Record<string, unknown>) => void;
  reject: (err: Error) => void;
}

class VieNeuBridge {
  private proc: ChildProcessWithoutNullStreams | null = null;
  private queue: PendingJob[] = [];
  private activeJob: PendingJob | null = null;

  private ensureWorker(): ChildProcessWithoutNullStreams {
    if (this.proc && !this.proc.killed) {
      return this.proc;
    }

    const pyBin = resolvePythonBin();
    const workerPath = resolveWorkerScript();

    const child = spawn(pyBin, ['-u', workerPath], {
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const rl = readline.createInterface({ input: child.stdout });
    rl.on('line', (line) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith('{')) return;
      try {
        const parsed = JSON.parse(trimmed) as Record<string, unknown>;
        if (this.activeJob) {
          const job = this.activeJob;
          this.activeJob = null;
          if (parsed.ok) {
            job.resolve(parsed);
          } else {
            job.reject(new Error(String(parsed.error || 'VieNeu-TTS worker error')));
          }
          this.drainQueue();
        }
      } catch {
        // Ignore non-JSON stdout lines
      }
    });

    child.on('exit', (code) => {
      this.proc = null;
      if (this.activeJob) {
        const job = this.activeJob;
        this.activeJob = null;
        job.reject(new Error(`VieNeu-TTS worker exited with code ${code}`));
      }
    });

    child.stderr?.on('data', (data) => {
      const msg = data.toString().trim();
      if (msg && !msg.includes('unauthenticated requests')) {
        // Log stderr for diagnostics
        console.warn(`[vieneu-worker] ${msg}`);
      }
    });

    this.proc = child;
    return child;
  }

  private drainQueue() {
    if (this.activeJob || this.queue.length === 0) return;
    const next = this.queue.shift();
    if (!next) return;
    this.activeJob = next;
  }

  public sendCommand(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      let worker: ChildProcessWithoutNullStreams;
      try {
        worker = this.ensureWorker();
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
        return;
      }

      const job: PendingJob = {
        resolve,
        reject,
      };

      const executeNow = () => {
        this.activeJob = job;
        worker.stdin.write(`${JSON.stringify(payload)}\n`);
      };

      if (!this.activeJob) {
        executeNow();
      } else {
        this.queue.push({
          resolve: (res) => {
            resolve(res);
          },
          reject: (err) => {
            reject(err);
          },
        });
        const wrappedJob = this.queue[this.queue.length - 1];
        if (wrappedJob) {
          const origResolve = wrappedJob.resolve;
          const origReject = wrappedJob.reject;
          this.queue[this.queue.length - 1] = {
            resolve: origResolve,
            reject: origReject,
          };
        }
      }
    });
  }

  public async synthesizeToWavFile(options: {
    text: string;
    outWavPath: string;
    voice?: string;
    speed?: number;
    sampleRate?: number;
  }): Promise<VieNeuSynthResult> {
    if (!isVieNeuAvailable()) {
      throw new Error(
        'Không tìm thấy môi trường VieNeu-TTS (scripts/vieneu_tts_worker.py hoặc .venv).'
      );
    }

    const voiceName = options.voice || 'Adam';
    const outDir = path.dirname(options.outWavPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const worker = this.ensureWorker();
    const response = await new Promise<Record<string, unknown>>((resolve, reject) => {
      const runJob = () => {
        this.activeJob = { resolve, reject };
        worker.stdin.write(
          `${JSON.stringify({
            cmd: 'synth',
            text: options.text,
            voice: voiceName,
            out_wav: options.outWavPath,
            speed: options.speed ?? 1.0,
            sample_rate: options.sampleRate ?? 24000,
          })}\n`
        );
      };

      if (!this.activeJob) {
        runJob();
      } else {
        const checkInterval = setInterval(() => {
          if (!this.activeJob) {
            clearInterval(checkInterval);
            runJob();
          }
        }, 50);
      }
    });

    if (!fs.existsSync(options.outWavPath)) {
      throw new Error('VieNeu-TTS Worker không xuất ra file WAV.');
    }

    const rawBuffer = fs.readFileSync(options.outWavPath);
    const { wavBuffer, durationSeconds } = ensureValidWavBuffer(rawBuffer, 24000, 1, 16);
    const reportedDuration =
      typeof response.duration_sec === 'number'
        ? Number(response.duration_sec.toFixed(2))
        : durationSeconds;

    const mp3Path = typeof response.out_mp3 === 'string' ? response.out_mp3 : undefined;
    const mp3SizeBytes =
      typeof response.mp3_size_bytes === 'number' ? response.mp3_size_bytes : undefined;

    return {
      wavBuffer,
      durationSeconds: reportedDuration || durationSeconds,
      modelUsed: 'VieNeu-v3-Turbo',
      voiceName: voiceName.toLowerCase(),
      source: 'vieneu_tts',
      mp3Path,
      mp3SizeBytes,
    };
  }

  public shutdown() {
    if (this.proc && !this.proc.killed) {
      try {
        this.proc.stdin.write(`${JSON.stringify({ cmd: 'exit' })}\n`);
        this.proc.kill();
      } catch {
        // Ignore shutdown errors
      }
      this.proc = null;
    }
  }
}

export const vieneuBridge = new VieNeuBridge();
// Backward-compatibility alias
export const omnivoiceBridge = vieneuBridge;
