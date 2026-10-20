#!/usr/bin/env node
/**
 * Standalone Audio Pack Generator for VieNeu-TTS v3 Turbo
 * Synthesizes all script clips in a voice configuration file into 24kHz/48kHz WAV & MP3
 * with EBU R128 loudness normalization (-16 LUFS, True Peak -1.5dB).
 *
 * Usage:
 *   node generate_voice_pack.mjs --config=./tody.config.json --out=./public/audio/vi
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [k, v] = arg.replace(/^--/, '').split('=');
    return [k, v || 'true'];
  })
);

const configPath = path.resolve(process.cwd(), args.config || 'tody.config.json');
const outDir = path.resolve(process.cwd(), args.out || 'public/audio/vi');
const voice = args.voice || 'Adam';
const forceAll = args.force === 'true';

if (!fs.existsSync(configPath)) {
  console.error(`❌ Không tìm thấy file cấu hình: ${configPath}`);
  console.error(`Sử dụng: node generate_voice_pack.mjs --config=path/to/voice.config.json --out=public/audio/vi`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const nodes = config.nodes || {};
const scriptEntries = Object.values(nodes).map((node, idx) => ({
  id: node.audioId || node.id,
  order: idx + 1,
  text: node.transcript,
  stage: node.stage,
}));

function resolvePythonBin() {
  if (process.env.VIENEU_PYTHON_BIN && fs.existsSync(process.env.VIENEU_PYTHON_BIN)) {
    return process.env.VIENEU_PYTHON_BIN;
  }
  const localVenv = path.resolve(process.cwd(), '.venv', 'bin', 'python3');
  if (fs.existsSync(localVenv)) return localVenv;
  return 'python3';
}

const PYTHON_BIN = resolvePythonBin();
const WORKER_SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'vieneu_tts_worker.py');

async function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`🎙️ Khởi động VieNeu-TTS v3 Turbo Worker (Python: ${PYTHON_BIN})...`);
  console.log(`Target Output: ${outDir} | Voice: ${voice} | Total Clips: ${scriptEntries.length}`);

  const child = spawn(PYTHON_BIN, ['-u', WORKER_SCRIPT], {
    env: { ...process.env, PYTHONUNBUFFERED: '1' },
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  const rl = readline.createInterface({ input: child.stdout });
  const queue = [];
  let waitingResolver = null;

  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) return;
    try {
      const parsed = JSON.parse(trimmed);
      if (waitingResolver) {
        const res = waitingResolver;
        waitingResolver = null;
        res(parsed);
      } else {
        queue.push(parsed);
      }
    } catch {}
  });

  const send = (payload) =>
    new Promise((resolve) => {
      if (queue.length > 0) return resolve(queue.shift());
      waitingResolver = resolve;
      child.stdin.write(`${JSON.stringify(payload)}\n`);
    });

  const ping = await send({ cmd: 'ping' });
  console.log('✓ Worker sẵn sàng:', ping);

  const manifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    voicePreset: voice.toLowerCase(),
    modelUsed: 'VieNeu-v3-Turbo',
    entries: {},
  };

  for (let i = 0; i < scriptEntries.length; i++) {
    const entry = scriptEntries[i];
    const outWav = path.join(outDir, `${entry.id}.wav`);
    const outMp3 = path.join(outDir, `${entry.id}.mp3`);

    if (!forceAll && fs.existsSync(outWav) && fs.statSync(outWav).size > 1000) {
      console.log(`[${i + 1}/${scriptEntries.length}] Bỏ qua ${entry.id}.wav (đã tồn tại)`);
      continue;
    }

    console.log(`[${i + 1}/${scriptEntries.length}] Đang tổng hợp ${entry.id}.wav...`);
    const start = Date.now();
    const res = await send({
      cmd: 'synth',
      text: entry.text,
      voice,
      out_wav: outWav,
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    if (res && res.ok) {
      console.log(`  ✓ Đã lưu ${entry.id} (${res.duration_sec}s, WAV: ${Math.round(res.wav_size_bytes / 1024)}KB) trong ${elapsed}s`);
      manifest.entries[entry.id] = {
        id: entry.id,
        order: entry.order,
        transcript: entry.text,
        audioUrl: `/audio/vi/${entry.id}.wav`,
        mp3Url: fs.existsSync(outMp3) ? `/audio/vi/${entry.id}.mp3` : undefined,
        duration: res.duration_sec,
        status: 'ready',
      };
    } else {
      console.warn(`  ⚠ Lỗi tổng hợp ${entry.id}:`, res);
    }
  }

  await send({ cmd: 'exit' });
  child.kill();

  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`✅ Hoàn tất! Manifest đã được ghi vào: ${path.join(outDir, 'manifest.json')}`);
}

main().catch((err) => {
  console.error('Lỗi sinh voice pack:', err);
  process.exit(1);
});
