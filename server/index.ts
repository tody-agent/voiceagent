import express from 'express';
import path from 'node:path';
import dotenv from 'dotenv';
import { voiceRouter } from './routes/voice.ts';

dotenv.config();

export function createVoiceServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Static audio hosting
  const audioDir = process.env.AUDIO_DIR || path.resolve(process.cwd(), 'public', 'audio');
  app.use('/audio', express.static(audioDir));

  // Voice API router
  app.use('/api/voice', voiceRouter);

  return app;
}

if (process.env.NODE_ENV !== 'test' && !process.env.VITE) {
  const app = createVoiceServer();
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`🎙️ Voice Agent Microservice listening on http://localhost:${port}`);
    console.log(`   - TTS & Pack API: http://localhost:${port}/api/voice`);
    console.log(`   - Static Audio:   http://localhost:${port}/audio`);
  });
}
