import fs from 'node:fs';
import path from 'node:path';
import { vieneuBridge, isVieNeuAvailable } from './vieneuTts.ts';
import { generateSpeechWithGemini, synthesizeCadenceWav } from './geminiTts.ts';
import type { VoiceProjectConfig, AudioManifest, AudioManifestEntry } from '../types.ts';

export async function generateAudioPack(
  config: VoiceProjectConfig,
  outputDir: string,
  options: {
    voicePreset?: string;
    engine?: 'vieneu' | 'gemini' | 'auto';
    force?: boolean;
    onProgress?: (current: number, total: number, clipId: string) => void;
  } = {}
): Promise<AudioManifest> {
  const { voicePreset = 'adam', engine = 'auto', force = false, onProgress } = options;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const nodes = Object.values(config.nodes || {});
  const total = nodes.length;
  const entries: Record<string, AudioManifestEntry> = {};

  const manifestPath = path.join(outputDir, 'manifest.json');
  let existingManifest: AudioManifest | null = null;
  if (fs.existsSync(manifestPath)) {
    try {
      existingManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch {}
  }

  for (let i = 0; i < total; i++) {
    const node = nodes[i];
    const audioId = node.audioId || node.id;
    const transcript = node.transcript;

    if (onProgress) {
      onProgress(i + 1, total, audioId);
    }

    const wavFileName = `${audioId}.wav`;
    const wavFilePath = path.join(outputDir, wavFileName);

    // Skip if already generated and not forcing
    if (!force && fs.existsSync(wavFilePath) && existingManifest?.entries[audioId]) {
      entries[audioId] = existingManifest.entries[audioId];
      continue;
    }

    let wavBuffer: Buffer | null = null;
    let durationSeconds = 2.0;
    let engineUsed: 'vieneu' | 'gemini' | 'mock' = 'mock';

    // 1. Try VieNeu-TTS if requested/auto
    if (engine === 'vieneu' || (engine === 'auto' && isVieNeuAvailable())) {
      try {
        const res = await vieneuBridge.synthesize(transcript, {
          voiceName: voicePreset,
        });
        wavBuffer = res.wavBuffer;
        durationSeconds = res.durationSeconds;
        engineUsed = 'vieneu';
      } catch (err) {
        console.warn(`[audioPack] VieNeu error for ${audioId}, trying Gemini fallback:`, err);
      }
    }

    // 2. Try Gemini TTS fallback
    if (!wavBuffer && (engine === 'gemini' || engine === 'auto')) {
      try {
        const res = await generateSpeechWithGemini(transcript);
        wavBuffer = res.wavBuffer;
        durationSeconds = res.durationSeconds;
        engineUsed = 'gemini';
      } catch (err) {
        console.warn(`[audioPack] Gemini TTS error for ${audioId}:`, err);
      }
    }

    // 3. Cadence tone fallback if both fail
    if (!wavBuffer) {
      const res = synthesizeCadenceWav(transcript);
      wavBuffer = res.wavBuffer;
      durationSeconds = res.durationSeconds;
      engineUsed = 'mock';
    }

    fs.writeFileSync(wavFilePath, wavBuffer);

    entries[audioId] = {
      id: node.id,
      audioId,
      transcript,
      stage: node.stage || 'general',
      audioUrl: `${config.audioBaseUrl || '/audio/vi'}/${wavFileName}`,
      durationMs: Math.round(durationSeconds * 1000),
      engine: engineUsed,
      fileHash: `${wavBuffer.length}_${Date.now()}`,
      status: 'ready',
    };
  }

  const manifest: AudioManifest = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    voicePreset,
    entries,
  };

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  return manifest;
}
