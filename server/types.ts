export interface VoiceFlowNode {
  id: string;
  audioId: string;
  transcript: string;
  stage: string;
  choices?: Array<{
    id: string;
    label: string;
    next: string;
  }>;
  [key: string]: unknown;
}

export interface VoiceProjectConfig {
  projectId: string;
  locale?: string;
  audioBaseUrl?: string;
  brand?: {
    assistantName: string;
    assistantRole: string;
    primaryColor?: string;
    accentColor?: string;
  };
  offer?: {
    productName: string;
    headline?: string;
    primaryCtaLabel?: string;
    primaryCtaUrl?: string;
  };
  nodes: Record<string, VoiceFlowNode>;
}

export interface AudioManifestEntry {
  id: string;
  audioId: string;
  transcript: string;
  stage: string;
  audioUrl: string;
  durationMs: number;
  engine: 'vieneu' | 'gemini' | 'browser_speech' | 'mock';
  fileHash: string;
  status: 'ready' | 'missing' | 'error';
}

export interface AudioManifest {
  version: string;
  generatedAt: string;
  voicePreset: string;
  entries: Record<string, AudioManifestEntry>;
}

export interface IntentClassificationRequest {
  query: string;
  currentNodeId?: string;
  candidateNodes?: Array<{ id: string; label?: string; stage?: string; transcript?: string }>;
  productContext?: string;
}

export interface IntentClassificationResult {
  intent: string;
  confidence: number;
  targetNodeId: string;
  source: 'rule' | 'gemini_api' | 'fallback';
}
