export interface AudioPlaybackState {
  isPlaying: boolean;
  isMuted: boolean;
  progress: number;
  duration: number;
  currentTime: number;
  levels: number[];
  currentAudioId: string | null;
}

export type AudioStateSubscriber = (state: AudioPlaybackState) => void;

export class AudioManager {
  private audioEl: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private animFrameId: number | null = null;
  private fallbackTimer: NodeJS.Timeout | null = null;

  private state: AudioPlaybackState = {
    isPlaying: false,
    isMuted: false,
    progress: 0,
    duration: 0,
    currentTime: 0,
    levels: [0.2, 0.4, 0.7, 0.5, 0.3],
    currentAudioId: null,
  };

  private subscribers = new Set<AudioStateSubscriber>();
  private audioBaseUrl: string;
  private locale: string;

  constructor(audioBaseUrl = '/audio/vi', locale = 'vi-VN') {
    this.audioBaseUrl = audioBaseUrl.replace(/\/$/, '');
    this.locale = locale;
  }

  public subscribe(cb: AudioStateSubscriber): () => void {
    this.subscribers.add(cb);
    cb(this.state);
    return () => this.subscribers.delete(cb);
  }

  private notify() {
    for (const sub of this.subscribers) {
      sub({ ...this.state });
    }
  }

  private ensureAudioElement(): HTMLAudioElement {
    if (this.audioEl) return this.audioEl;

    const el = new Audio();
    el.preload = 'auto';

    el.onplay = () => {
      this.state.isPlaying = true;
      this.notify();
      this.startAnalyserLoop();
    };

    el.onpause = () => {
      this.state.isPlaying = false;
      this.stopAnalyserLoop();
      this.notify();
    };

    el.onended = () => {
      this.state.isPlaying = false;
      this.state.progress = 1;
      this.stopAnalyserLoop();
      this.notify();
    };

    el.ontimeupdate = () => {
      if (el.duration > 0) {
        this.state.duration = el.duration;
        this.state.currentTime = el.currentTime;
        this.state.progress = Math.min(1, el.currentTime / el.duration);
        this.notify();
      }
    };

    this.audioEl = el;
    return el;
  }

  private initWebAudio() {
    if (typeof window === 'undefined') return;
    if (this.audioContext && this.analyser) return;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;

      const el = this.ensureAudioElement();
      if (!this.sourceNode) {
        this.sourceNode = this.audioContext.createMediaElementSource(el);
        this.sourceNode.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
      }
    } catch {
      // Browsers may block AudioContext before user gesture
    }
  }

  private startAnalyserLoop() {
    this.stopAnalyserLoop();
    const update = () => {
      if (!this.state.isPlaying || this.state.isMuted) {
        this.state.levels = [0.2, 0.3, 0.4, 0.3, 0.2];
        this.notify();
        return;
      }

      if (this.analyser) {
        const data = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(data);
        const barCount = 5;
        const step = Math.floor(data.length / barCount);
        const levels: number[] = [];

        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) {
            sum += data[i * step + j] || 0;
          }
          levels.push(Math.min(1, (sum / step / 255) * 1.5));
        }
        this.state.levels = levels;
        this.notify();
      } else {
        // Fallback pulsing if Web Audio blocked
        const t = Date.now() / 200;
        this.state.levels = [
          0.3 + 0.3 * Math.sin(t),
          0.4 + 0.4 * Math.cos(t * 1.2),
          0.6 + 0.3 * Math.sin(t * 1.5),
          0.4 + 0.4 * Math.sin(t * 0.8),
          0.3 + 0.2 * Math.cos(t),
        ];
        this.notify();
      }

      this.animFrameId = requestAnimationFrame(update);
    };

    this.animFrameId = requestAnimationFrame(update);
  }

  private stopAnalyserLoop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public async playClip(audioId: string, fallbackTranscript?: string): Promise<void> {
    this.stop();
    this.state.currentAudioId = audioId;
    this.state.progress = 0;

    if (this.state.isMuted) {
      this.state.isPlaying = false;
      this.state.progress = 1;
      this.notify();
      return;
    }

    const el = this.ensureAudioElement();
    const wavUrl = `${this.audioBaseUrl}/${audioId}.wav`;

    try {
      this.initWebAudio();
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      el.src = wavUrl;
      el.muted = this.state.isMuted;
      await el.play();
    } catch {
      // Fallback to SpeechSynthesis
      if (fallbackTranscript) {
        this.playSpeechSynthesis(fallbackTranscript);
      }
    }
  }

  private playSpeechSynthesis(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.state.isPlaying = false;
      this.state.progress = 1;
      this.notify();
      return;
    }

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = this.locale;
    utter.rate = 1.05;

    const estDurationSec = Math.max(3, text.length * 0.065);
    const startMs = Date.now();
    this.state.isPlaying = true;
    this.state.duration = estDurationSec;
    this.notify();

    this.fallbackTimer = setInterval(() => {
      const elapsed = (Date.now() - startMs) / 1000;
      this.state.progress = Math.min(1, elapsed / estDurationSec);
      this.state.currentTime = elapsed;
      this.notify();

      if (elapsed >= estDurationSec) {
        if (this.fallbackTimer) clearInterval(this.fallbackTimer);
        this.state.isPlaying = false;
        this.state.progress = 1;
        this.notify();
      }
    }, 150);

    utter.onend = () => {
      if (this.fallbackTimer) clearInterval(this.fallbackTimer);
      this.state.isPlaying = false;
      this.state.progress = 1;
      this.notify();
    };

    window.speechSynthesis.speak(utter);
  }

  public stop() {
    if (this.fallbackTimer) {
      clearInterval(this.fallbackTimer);
      this.fallbackTimer = null;
    }
    if (this.audioEl) {
      try {
        this.audioEl.pause();
        this.audioEl.currentTime = 0;
      } catch {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.stopAnalyserLoop();
    this.state.isPlaying = false;
    this.notify();
  }

  public toggleMute(): boolean {
    this.state.isMuted = !this.state.isMuted;
    if (this.audioEl) {
      this.audioEl.muted = this.state.isMuted;
    }
    if (this.state.isMuted) {
      this.stop();
    }
    this.notify();
    return this.state.isMuted;
  }

  public getState(): AudioPlaybackState {
    return { ...this.state };
  }
}
