import { Router, type Request, type Response } from 'express';
import path from 'node:path';
import { vieneuBridge, isVieNeuAvailable, VIENEU_PRESETS } from '../services/vieneuTts.ts';
import { generateSpeechWithGemini, synthesizeCadenceWav } from '../services/geminiTts.ts';
import { classifyVoiceIntent } from '../services/intentClassifier.ts';
import { generateAudioPack } from '../services/audioPackService.ts';
import type { VoiceProjectConfig } from '../types.ts';

export const voiceRouter = Router();

// 1. Health & Capability inspection
voiceRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    engine: 'voiceagent-server',
    version: '1.0.0',
    capabilities: {
      vieneuTts: isVieNeuAvailable(),
      geminiTts: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    },
    presets: VIENEU_PRESETS,
  });
});

// 2. Synthesize single audio clip on the fly
voiceRouter.post('/tts', async (req: Request, res: Response) => {
  const { text, voice = 'adam', engine = 'auto', format = 'wav' } = req.body || {};

  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Missing required field: text (string)' });
    return;
  }

  try {
    let wavBuffer: Buffer | null = null;
    let durationSeconds = 2.0;
    let modelUsed = 'fallback';

    if (engine === 'vieneu' || (engine === 'auto' && isVieNeuAvailable())) {
      try {
        const result = await vieneuBridge.synthesize(text, { voiceName: voice });
        wavBuffer = result.wavBuffer;
        durationSeconds = result.durationSeconds;
        modelUsed = result.modelUsed;
      } catch (err) {
        console.warn('[voiceRouter] VieNeu failed, fallback to Gemini:', err);
      }
    }

    if (!wavBuffer && (engine === 'gemini' || engine === 'auto')) {
      try {
        const result = await generateSpeechWithGemini(text);
        wavBuffer = result.wavBuffer;
        durationSeconds = result.durationSeconds;
        modelUsed = result.modelUsed;
      } catch (err) {
        console.warn('[voiceRouter] Gemini TTS failed:', err);
      }
    }

    if (!wavBuffer) {
      const fallback = synthesizeCadenceWav(text);
      wavBuffer = fallback.wavBuffer;
      durationSeconds = fallback.durationSeconds;
      modelUsed = 'cadence-synth';
    }

    if (format === 'binary') {
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', wavBuffer.length);
      res.send(wavBuffer);
      return;
    }

    res.json({
      ok: true,
      text,
      durationSeconds,
      modelUsed,
      audioBase64: wavBuffer.toString('base64'),
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Audio synthesis failed.',
    });
  }
});

// 3. Batch generate audio pack from config
voiceRouter.post('/generate-pack', async (req: Request, res: Response) => {
  const { config, outDir = 'public/audio/vi', voicePreset = 'adam', force = false } = req.body || {};

  if (!config || !config.nodes) {
    res.status(400).json({ error: 'Missing valid VoiceProjectConfig with nodes.' });
    return;
  }

  try {
    const targetDir = path.resolve(process.cwd(), outDir);
    const manifest = await generateAudioPack(config as VoiceProjectConfig, targetDir, {
      voicePreset,
      force: Boolean(force),
    });

    res.json({
      ok: true,
      manifest,
      totalGenerated: Object.keys(manifest.entries).length,
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Batch pack generation failed.',
    });
  }
});

// 4. Intent Classification
voiceRouter.post('/classify', async (req: Request, res: Response) => {
  const { query, currentNodeId, candidateNodes, productContext } = req.body || {};

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Missing query string.' });
    return;
  }

  try {
    const result = await classifyVoiceIntent({
      query,
      currentNodeId,
      candidateNodes,
      productContext,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Intent classification failed.',
    });
  }
});
