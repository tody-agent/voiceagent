/**
 * TODY AI Sales Assistant — Universal Multi-Platform Web SDK (v1.2.0)
 * Works on any website: Astro, HTML, WordPress, Shopify, Webflow, React, Next.js, Vue, Svelte.
 *
 * Enforces the 6 Conversion UX Invariants:
 * 1. 85vw Expanded HUD (max-w-4xl / 896px) anchored at bottom center
 * 2. Hidden Mascot during active speech (clean status dot + 5-bar AudioWaveform)
 * 3. 2-Line Rolling Captions (line-clamp-2, smooth vertical transition)
 * 4. Strictly Max 2 Buttons per step (1 Primary #1D1D1F + 1 Secondary #F3F4F1)
 * 5. Zero Microphone Permission Friction (Listen & Choose model)
 * 6. Two-Way DOM Sync & Compact Demo Mode (388px corner HUD + voice:action & tody:action)
 */
(function (global) {
  'use strict';

  const UI_STRINGS = {
    vi: {
      mute: 'Tắt tiếng',
      unmute: 'Bật tiếng',
      expand: 'Mở rộng',
      close: 'Đóng',
      start: 'Nghe ngay',
      later: 'Để sau',
    },
    en: {
      mute: 'Mute',
      unmute: 'Unmute',
      expand: 'Expand',
      close: 'Close',
      start: 'Listen now',
      later: 'Later',
    },
    zh: {
      mute: '静音',
      unmute: '取消静音',
      expand: '展开',
      close: '关闭',
      start: '立即收听',
      later: '稍后',
    },
    de: {
      mute: 'Stumm',
      unmute: 'Ton an',
      expand: 'Erweitern',
      close: 'Schließen',
      start: 'Jetzt hören',
      later: 'Später',
    },
    ja: {
      mute: 'ミュート',
      unmute: '音声オン',
      expand: '拡大',
      close: '閉じる',
      start: '今すぐ聞く',
      later: 'あとで',
    },
    ko: {
      mute: '음소거',
      unmute: '소리 켜기',
      expand: '확장',
      close: '닫기',
      start: '지금 듣기',
      later: '나중에',
    },
  };

  const BCP47_MAP = {
    vi: 'vi-VN',
    'vi-VN': 'vi-VN',
    en: 'en-US',
    'en-US': 'en-US',
    zh: 'zh-CN',
    'zh-Hans': 'zh-CN',
    'zh-CN': 'zh-CN',
    de: 'de-DE',
    'de-DE': 'de-DE',
    ja: 'ja-JP',
    'ja-JP': 'ja-JP',
    ko: 'ko-KR',
    'ko-KR': 'ko-KR',
  };

  const DEFAULT_CONFIG = {
    projectId: 'remoter-macos',
    locale: 'vi-VN',
    audioBaseUrl: '/audio/vi',
    initialNodeId: 'welcome',
    inviteDelayMs: 3500,
    brand: {
      assistantName: 'Tody · Remoter AI',
      assistantRole: 'Tư vấn & Biểu diễn 30s',
      inviteTitle: 'Chào bạn, mình là Tody (32 tuổi)',
      inviteBody: 'Nghe mình biểu diễn cách dùng Siri Remote điều khiển Codex & Claude Desktop trong 30s nhé?',
      primaryColor: '#1D1D1F',
      accentColor: '#0066CC',
    },
    offer: {
      productName: 'Remoter for macOS',
      versionOrTier: 'v0.2.3 beta · Apple Silicon',
      headline: 'Điều khiển Codex Desktop & Claude Desktop từ xa bằng Siri Remote',
      primaryCtaLabel: 'Tải bản Mac Beta miễn phí',
      primaryCtaUrl: '/downloads/Remoter-0.2.3-macOS-arm64.zip',
    },
    nodes: {},
  };

  function splitIntoTwoLineChunks(transcript, maxCharsPerChunk) {
    const limit = maxCharsPerChunk || 105;
    const clean = (transcript || '').replace(/\s+/g, ' ').trim();
    if (!clean) return [''];
    if (clean.length <= limit) return [clean];

    const clauses = clean
      .split(/(?<=[.!?…;:。！？；：])\s*|(?<=[,，、])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const chunks = [];
    let current = '';

    for (const clause of clauses) {
      if (!current) {
        current = clause;
      } else if (current.length + 1 + clause.length <= limit) {
        current = current + ' ' + clause;
      } else {
        chunks.push(current);
        current = clause;
      }
    }
    if (current) chunks.push(current);
    return chunks.length > 0 ? chunks : [clean];
  }

  function injectHostHighlightStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('tody-host-bridge-styles')) return;
    const style = document.createElement('style');
    style.id = 'tody-host-bridge-styles';
    style.textContent = `
      @keyframes todyPulseRing {
        0%, 100% { box-shadow: 0 0 0 0 rgba(0, 102, 204, 0.45), 0 18px 40px -12px rgba(0, 102, 204, 0.22); }
        50% { box-shadow: 0 0 0 8px rgba(0, 102, 204, 0.16), 0 22px 48px -10px rgba(0, 102, 204, 0.34); }
      }
      .tody-highlight-ring {
        outline: 2px solid #0066CC !important;
        outline-offset: 4px !important;
        transition: outline 150ms cubic-bezier(0.2, 0, 0, 1), box-shadow 150ms cubic-bezier(0.2, 0, 0, 1) !important;
        animation: todyPulseRing 1.4s ease-in-out infinite !important;
      }
    `;
    document.head.appendChild(style);
  }

  class TodyUniversalInstance {
    constructor(userConfig) {
      this.applyConfig(userConfig || {});
      this.currentNodeId = this.config.initialNodeId || 'welcome';
      this.isExpanded = false;
      this.isCompact = false;
      this.isInviting = false;
      this.isPlaying = false;
      this.isMuted = false;
      this.progress = 0;
      this.audioEl = null;
      this.fallbackTimer = null;
      this.firedCueIndexes = new Set();
      this.hostEl = null;
      this.shadow = null;
      this.inviteTimer = null;
    }

    applyConfig(userConfig) {
      this.config = Object.assign({}, DEFAULT_CONFIG, userConfig || {});
      this.config.brand = Object.assign(
        {},
        DEFAULT_CONFIG.brand,
        (userConfig && userConfig.brand) || {}
      );
      this.config.offer = Object.assign(
        {},
        DEFAULT_CONFIG.offer,
        (userConfig && userConfig.offer) || {}
      );
      this.config.nodes =
        userConfig && userConfig.nodes && Object.keys(userConfig.nodes).length > 0
          ? userConfig.nodes
          : DEFAULT_CONFIG.nodes;
    }

    getShortLang() {
      const loc = (this.config.locale || 'vi-VN').toLowerCase();
      if (loc.startsWith('vi')) return 'vi';
      if (loc.startsWith('zh')) return 'zh';
      if (loc.startsWith('de')) return 'de';
      if (loc.startsWith('ja')) return 'ja';
      if (loc.startsWith('ko')) return 'ko';
      return 'en';
    }

    getUiStrings() {
      return UI_STRINGS[this.getShortLang()] || UI_STRINGS.en;
    }

    mount(targetContainer) {
      if (this.hostEl) return this;
      injectHostHighlightStyles();
      this.hostEl = document.createElement('div');
      this.hostEl.id = 'tody-ai-sales-root';
      this.hostEl.setAttribute('translate', 'no');
      this.shadow = this.hostEl.attachShadow({ mode: 'open' });
      (targetContainer || document.body).appendChild(this.hostEl);

      this.render();

      const delay =
        typeof this.config.inviteDelayMs === 'number'
          ? this.config.inviteDelayMs
          : 3500;
      if (delay >= 0) {
        this.inviteTimer = setTimeout(() => {
          if (!this.isExpanded && window.innerWidth >= 768) {
            this.isInviting = true;
            this.render();
          }
        }, delay);
      }
      return this;
    }

    unmount() {
      if (this.inviteTimer) {
        clearTimeout(this.inviteTimer);
        this.inviteTimer = null;
      }
      this.stopAudio();
      if (this.hostEl && this.hostEl.parentNode) {
        this.hostEl.parentNode.removeChild(this.hostEl);
      }
      this.hostEl = null;
      this.shadow = null;
    }

    updateConfig(newConfig, options) {
      const opts = options || {};
      const wasExpanded = this.isExpanded;
      const wasPlaying = this.isPlaying;
      const activeNodeId = this.currentNodeId;
      this.applyConfig(newConfig);
      if (!this.config.nodes[this.currentNodeId]) {
        this.currentNodeId = this.config.initialNodeId || 'welcome';
      }
      if (wasExpanded && (wasPlaying || opts.replayIfOpen)) {
        this.playNode(activeNodeId, { skipScroll: true });
      } else {
        this.render();
      }
    }

    getCurrentNode() {
      return (
        this.config.nodes[this.currentNodeId] ||
        Object.values(this.config.nodes)[0]
      );
    }

    findTargetElement(target) {
      if (!target || typeof document === 'undefined') return null;
      return (
        document.getElementById(target) ||
        document.querySelector('[data-voice-target="' + target + '"]') ||
        document.querySelector('[data-tody-target="' + target + '"]')
      );
    }

    dispatchVisualAction(action) {
      if (!action || typeof window === 'undefined') return;
      window.dispatchEvent(
        new CustomEvent('voice:action', { detail: action, bubbles: true })
      );
      window.dispatchEvent(
        new CustomEvent('tody:action', { detail: action, bubbles: true })
      );
      if (typeof this.config.onVisualAction === 'function') {
        this.config.onVisualAction(action);
      }
      if (
        (action.type === 'scrollToSection' ||
          action.type === 'highlightArea' ||
          action.type === 'pulseCTA' ||
          action.type === 'playGestureDemo' ||
          action.type === 'openDemoScene') &&
        action.target
      ) {
        const el = this.findTargetElement(action.target);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (action.type === 'highlightArea' || action.type === 'pulseCTA') {
            el.classList.add('tody-highlight-ring');
            const primaryBtn = el.querySelector('.button-primary, a[download]');
            if (primaryBtn) primaryBtn.classList.add('tody-highlight-ring');
            setTimeout(() => {
              el.classList.remove('tody-highlight-ring');
              if (primaryBtn) primaryBtn.classList.remove('tody-highlight-ring');
            }, 3400);
          }
        }
      }
    }

    checkTimelineCues(elapsedSeconds) {
      const node = this.getCurrentNode();
      if (!node || !Array.isArray(node.animationTimeline)) return;
      node.animationTimeline.forEach((cue, idx) => {
        if (!this.firedCueIndexes.has(idx) && elapsedSeconds >= cue.timeSeconds) {
          this.firedCueIndexes.add(idx);
          if (cue.action) {
            this.dispatchVisualAction(cue.action);
          }
        }
      });
    }

    stopAudio() {
      if (this.fallbackTimer) {
        clearInterval(this.fallbackTimer);
        this.fallbackTimer = null;
      }
      if (this.audioEl) {
        try {
          this.audioEl.onended = null;
          this.audioEl.onerror = null;
          this.audioEl.ontimeupdate = null;
          this.audioEl.pause();
          this.audioEl.currentTime = 0;
        } catch (_e) {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (_e) {}
      }
      this.isPlaying = false;
    }

    playNode(nodeId, options) {
      const opts = options || {};
      this.stopAudio();
      const node = this.config.nodes[nodeId];
      if (!node) return;
      this.currentNodeId = nodeId;
      this.isCompact = Boolean(node.compactDuringDemo);
      this.progress = 0;
      this.firedCueIndexes = new Set();

      if (node.visualAction && !opts.fromHost) {
        const actionToSend = Object.assign(
          { nodeId: nodeId },
          node.visualAction,
          opts.skipScroll ? { target: undefined } : {}
        );
        this.dispatchVisualAction(actionToSend);
      }

      if (this.isMuted) {
        this.isPlaying = false;
        this.progress = 1;
        this.render();
        return;
      }

      // Only use pre-rendered VieNeu-TTS audio pack for Vietnamese locale
      const isVietnamese = this.getShortLang() === 'vi';
      if (!isVietnamese) {
        this.render();
        this.runSpeechFallback(node.transcript);
        return;
      }

      const baseUrl = (this.config.audioBaseUrl || '/audio/vi').replace(/\/$/, '');
      const mp3Url = baseUrl + '/' + node.audioId + '.mp3';
      const wavUrl = baseUrl + '/' + node.audioId + '.wav';

      if (!this.audioEl) {
        this.audioEl = new Audio();
      }

      this.isPlaying = true;
      this.render();

      let triedWavFallback = false;
      this.audioEl.src = mp3Url;
      this.audioEl.muted = this.isMuted;

      this.audioEl.ontimeupdate = () => {
        if (this.audioEl && this.audioEl.duration > 0) {
          const cur = this.audioEl.currentTime;
          this.progress = Math.min(1, cur / this.audioEl.duration);
          this.checkTimelineCues(cur);
          this.renderCaptionOnly();
        }
      };

      this.audioEl.onended = () => {
        const dur = (this.audioEl && this.audioEl.duration) || 999;
        this.checkTimelineCues(dur);
        this.isPlaying = false;
        this.progress = 1;
        this.render();
      };

      this.audioEl.onerror = () => {
        if (!triedWavFallback) {
          triedWavFallback = true;
          this.audioEl.src = wavUrl;
          this.audioEl.play().catch(() => {
            this.runSpeechFallback(node.transcript);
          });
        } else {
          this.runSpeechFallback(node.transcript);
        }
      };

      this.audioEl.play().catch(() => {
        if (!triedWavFallback) {
          triedWavFallback = true;
          this.audioEl.src = wavUrl;
          this.audioEl.play().catch(() => {
            this.runSpeechFallback(node.transcript);
          });
        } else {
          this.runSpeechFallback(node.transcript);
        }
      });
    }

    runSpeechFallback(transcript) {
      this.stopAudio();
      this.isPlaying = true;
      this.progress = 0;
      const estMs = Math.max(4200, (transcript || '').length * 62);
      const start = Date.now();

      if (!this.isMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          const utter = new SpeechSynthesisUtterance(transcript);
          const rawLocale = this.config.locale || 'vi-VN';
          utter.lang = BCP47_MAP[rawLocale] || rawLocale;
          utter.rate = 1.02;
          window.speechSynthesis.speak(utter);
        } catch (_e) {}
      }

      this.fallbackTimer = setInterval(() => {
        const elapsedMs = Date.now() - start;
        const elapsedSec = elapsedMs / 1000;
        this.progress = Math.min(1, elapsedMs / estMs);
        this.checkTimelineCues(elapsedSec);
        this.renderCaptionOnly();
        if (elapsedMs >= estMs) {
          clearInterval(this.fallbackTimer);
          this.fallbackTimer = null;
          this.isPlaying = false;
          this.progress = 1;
          this.render();
        }
      }, 150);
    }

    open(nodeId, options) {
      this.isInviting = false;
      this.isExpanded = true;
      this.playNode(nodeId || this.currentNodeId || 'welcome', options);
    }

    syncFromHostDemo(nodeId) {
      if (!this.config.nodes[nodeId]) return;
      this.isInviting = false;
      this.isExpanded = true;
      this.playNode(nodeId, { fromHost: true, skipScroll: true });
    }

    close() {
      this.stopAudio();
      this.isExpanded = false;
      this.isCompact = false;
      this.isInviting = false;
      this.render();
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      if (this.isMuted) {
        this.stopAudio();
      } else {
        this.playNode(this.currentNodeId, { skipScroll: true });
      }
      this.render();
    }

    getActiveChunkInfo() {
      const node = this.getCurrentNode();
      const chunks = splitIntoTwoLineChunks(
        node ? node.transcript : '',
        this.isCompact ? 78 : 112
      );
      const idx = this.isPlaying
        ? Math.min(
            chunks.length - 1,
            Math.max(0, Math.floor(this.progress * chunks.length))
          )
        : chunks.length - 1;
      return {
        text: chunks[idx] || '',
        index: idx,
        total: chunks.length,
      };
    }

    renderCaptionOnly() {
      if (!this.shadow) return;
      const capEl = this.shadow.getElementById('tody-live-caption-text');
      if (!capEl) return;
      const info = this.getActiveChunkInfo();
      if (capEl.getAttribute('data-chunk-idx') !== String(info.index)) {
        capEl.setAttribute('data-chunk-idx', String(info.index));
        capEl.textContent = '“' + info.text + '”';
        capEl.classList.remove('tody-flow-anim');
        void capEl.offsetWidth;
        capEl.classList.add('tody-flow-anim');
      }
    }

    render() {
      if (!this.shadow) return;
      const node = this.getCurrentNode();
      const choices = ((node && node.choices) || []).slice(0, 2);
      const chunkInfo = this.getActiveChunkInfo();
      const showOffer = node && (node.stage === 'offer' || Boolean(node.cta));
      const ui = this.getUiStrings();

      const styles = `
        :host {
          all: initial;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Plus Jakarta Sans', 'Segoe UI', Roboto, sans-serif;
          color: #1D1D1F;
          font-variant-numeric: tabular-nums;
        }
        * { box-sizing: border-box; }
        @keyframes captionFlowIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes waveBounce {
          0%, 100% { height: 4px; }
          50% { height: 14px; }
        }
        .tody-flow-anim {
          animation: captionFlowIn 150ms cubic-bezier(0.2, 0, 0, 1) forwards;
        }
        .tody-expanded-wrap {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 16px;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .tody-dialog {
          width: 85vw;
          max-width: 896px;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 20px;
          box-shadow: 0 20px 48px -12px rgba(15, 23, 42, 0.18);
          pointer-events: auto;
          overflow: hidden;
        }
        .tody-compact-dialog {
          position: fixed;
          right: 16px;
          bottom: 16px;
          width: min(85vw, 388px);
          max-width: 100%;
          z-index: 99999;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 18px;
          box-shadow: 0 16px 36px -10px rgba(15, 23, 42, 0.18);
          padding: 12px;
        }
        .tody-header {
          padding: 10px 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .tody-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1;
          overflow: hidden;
        }
        .tody-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: ${this.isPlaying ? '#0066CC' : '#10B981'};
          flex-shrink: 0;
        }
        .tody-title {
          font-size: 13px;
          font-weight: 600;
          color: #1D1D1F;
          white-space: nowrap;
        }
        .tody-role-badge {
          font-size: 12px;
          color: #6E6E73;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tody-wave {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          height: 14px;
          padding: 0 4px;
          flex-shrink: 0;
        }
        .tody-wave span {
          width: 2.5px;
          height: 4px;
          border-radius: 999px;
          background: ${this.isPlaying && !this.isMuted ? '#0066CC' : '#D4D4D8'};
          ${
            this.isPlaying && !this.isMuted
              ? 'animation: waveBounce 0.65s ease-in-out infinite;'
              : ''
          }
        }
        .tody-wave span:nth-child(2) { animation-delay: 0.12s; }
        .tody-wave span:nth-child(3) { animation-delay: 0.24s; }
        .tody-wave span:nth-child(4) { animation-delay: 0.16s; }
        .tody-wave span:nth-child(5) { animation-delay: 0.08s; }
        .tody-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .tody-icon-btn {
          min-height: 36px;
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: #F5F5F7;
          color: #1D1D1F;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: background 150ms cubic-bezier(0.2, 0, 0, 1);
        }
        .tody-icon-btn:hover {
          background: #E8E8ED;
        }
        .tody-body {
          padding: 12px 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tody-caption-box {
          background: #F5F5F7;
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 12px;
          padding: 10px 14px;
          min-height: 54px;
          max-height: 60px;
          display: flex;
          align-items: center;
          overflow: hidden;
        }
        .tody-caption-text {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
          line-height: 1.38;
          min-height: 2.6em;
          max-height: 2.76em;
          color: #1D1D1F;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .tody-grid-2 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 8px;
          align-items: stretch;
        }
        .tody-btn-primary {
          min-height: 44px;
          padding: 8px 16px;
          border-radius: 12px;
          border: none;
          background: ${this.config.brand.primaryColor || '#1D1D1F'};
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          white-space: nowrap;
          flex-shrink: 0;
          transition: opacity 150ms cubic-bezier(0.2, 0, 0, 1);
        }
        .tody-btn-primary:hover {
          opacity: 0.92;
        }
        .tody-btn-secondary {
          min-height: 44px;
          padding: 8px 16px;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: #F3F4F1;
          color: #1D1D1F;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          white-space: nowrap;
          flex-shrink: 0;
          transition: background 150ms cubic-bezier(0.2, 0, 0, 1);
        }
        .tody-btn-secondary:hover {
          background: #E8E8ED;
        }
        .tody-floating {
          position: fixed;
          right: 16px;
          bottom: 16px;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }
        .tody-invite {
          width: min(88vw, 312px);
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 16px;
          padding: 14px;
          box-shadow: 0 16px 36px -10px rgba(15, 23, 42, 0.16);
        }
        .tody-trigger {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 48px;
          padding: 8px 16px 8px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 10px 24px -6px rgba(15, 23, 42, 0.16);
          cursor: pointer;
        }
        @media (max-width: 767px) {
          .tody-dialog {
            width: 85vw;
            border-radius: 16px;
          }
          .tody-compact-dialog {
            right: 12px;
            left: 12px;
            bottom: 12px;
            width: auto;
            padding: 10px 12px;
          }
          .tody-grid-2 {
            grid-template-columns: 1fr;
          }
          .tody-btn-primary,
          .tody-btn-secondary {
            white-space: normal;
            font-size: 13px;
            min-height: 44px;
          }
          .tody-role-badge {
            display: none;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .tody-flow-anim,
          .tody-wave span {
            animation: none !important;
          }
        }
      `;

      if (this.isExpanded && this.isCompact) {
        this.shadow.innerHTML = `
          <style>${styles}</style>
          <aside class="tody-compact-dialog" role="region" aria-label="${this.config.brand.assistantName}">
            <div class="tody-header" style="padding: 0 0 8px 0;">
              <div class="tody-header-left">
                <span class="tody-dot"></span>
                <span class="tody-title">${this.config.brand.assistantName}</span>
                <div class="tody-wave" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
              </div>
              <div class="tody-header-actions">
                <button class="tody-icon-btn" id="tody-mute-btn" type="button">${this.isMuted ? ui.unmute : ui.mute}</button>
                <button class="tody-icon-btn" id="tody-expand-btn" type="button">${ui.expand}</button>
                <button class="tody-icon-btn" id="tody-close-btn" type="button">${ui.close}</button>
              </div>
            </div>
            <div class="tody-caption-box" style="margin-bottom: 8px;">
              <p class="tody-caption-text tody-flow-anim" id="tody-live-caption-text" data-chunk-idx="${chunkInfo.index}">“${chunkInfo.text}”</p>
            </div>
            <div class="tody-grid-2">
              ${choices
                .map(
                  (c, i) =>
                    `<button type="button" class="${i === 0 ? 'tody-btn-primary' : 'tody-btn-secondary'}" data-choice-idx="${i}">${c.label}</button>`
                )
                .join('')}
            </div>
          </aside>
        `;
      } else if (this.isExpanded) {
        this.shadow.innerHTML = `
          <style>${styles}</style>
          <div class="tody-expanded-wrap">
            <section class="tody-dialog" role="dialog" aria-label="${this.config.brand.assistantName}">
              <div class="tody-header">
                <div class="tody-header-left">
                  <span class="tody-dot"></span>
                  <span class="tody-title">${this.config.brand.assistantName}</span>
                  <span class="tody-role-badge">· ${this.config.brand.assistantRole}</span>
                  <div class="tody-wave" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
                </div>
                <div class="tody-header-actions">
                  <button class="tody-icon-btn" id="tody-mute-btn" type="button">${this.isMuted ? ui.unmute : ui.mute}</button>
                  <button class="tody-icon-btn" id="tody-close-btn" type="button">${ui.close}</button>
                </div>
              </div>
              <div class="tody-body">
                <div class="tody-caption-box">
                  <p class="tody-caption-text tody-flow-anim" id="tody-live-caption-text" data-chunk-idx="${chunkInfo.index}">“${chunkInfo.text}”</p>
                </div>
                ${
                  showOffer
                    ? `<div class="tody-grid-2">
                        <a class="tody-btn-primary" href="${(node.cta && node.cta.primaryUrl) || this.config.offer.primaryCtaUrl}" download>
                          ${(node.cta && node.cta.primaryLabel) || this.config.offer.primaryCtaLabel}
                        </a>
                        ${
                          choices[0]
                            ? `<button type="button" class="tody-btn-secondary" data-choice-idx="0">${choices[0].label}</button>`
                            : ''
                        }
                      </div>`
                    : `<div class="tody-grid-2">
                        ${choices
                          .map(
                            (c, i) =>
                              `<button type="button" class="${i === 0 ? 'tody-btn-primary' : 'tody-btn-secondary'}" data-choice-idx="${i}">${c.label}</button>`
                          )
                          .join('')}
                      </div>`
                }
              </div>
            </section>
          </div>
        `;
      } else {
        this.shadow.innerHTML = `
          <style>${styles}</style>
          <div class="tody-floating">
            ${
              this.isInviting
                ? `<div class="tody-invite" role="dialog" aria-label="${this.config.brand.inviteTitle}">
                    <p style="margin:0 0 4px 0;font-size:13px;font-weight:600;color:#1D1D1F;">${this.config.brand.inviteTitle}</p>
                    <p style="margin:0 0 12px 0;font-size:12px;line-height:1.45;color:#6E6E73;">${this.config.brand.inviteBody}</p>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                      <button type="button" class="tody-btn-primary" id="tody-invite-start" style="min-height:40px;font-size:12px;padding:6px 12px;">${ui.start}</button>
                      <button type="button" class="tody-btn-secondary" id="tody-invite-dismiss" style="min-height:40px;font-size:12px;padding:6px 12px;">${ui.later}</button>
                    </div>
                  </div>`
                : ''
            }
            <button type="button" class="tody-trigger" id="tody-trigger-btn" aria-label="${this.config.brand.assistantName}">
              <span class="tody-dot"></span>
              <div style="text-align:left;">
                <div style="font-size:13px;font-weight:600;color:#1D1D1F;line-height:1.2;">${this.config.brand.assistantName}</div>
                <div style="font-size:12px;color:#6E6E73;line-height:1.2;">${this.config.brand.assistantRole}</div>
              </div>
            </button>
          </div>
        `;
      }

      this.bindEvents(choices);
    }

    bindEvents(choices) {
      if (!this.shadow) return;
      const triggerBtn = this.shadow.getElementById('tody-trigger-btn');
      if (triggerBtn) triggerBtn.onclick = () => this.open();

      const startBtn = this.shadow.getElementById('tody-invite-start');
      if (startBtn) startBtn.onclick = () => this.open('welcome');

      const dismissBtn = this.shadow.getElementById('tody-invite-dismiss');
      if (dismissBtn) {
        dismissBtn.onclick = () => {
          this.isInviting = false;
          this.render();
        };
      }

      const muteBtn = this.shadow.getElementById('tody-mute-btn');
      if (muteBtn) muteBtn.onclick = () => this.toggleMute();

      const closeBtn = this.shadow.getElementById('tody-close-btn');
      if (closeBtn) closeBtn.onclick = () => this.close();

      const expandBtn = this.shadow.getElementById('tody-expand-btn');
      if (expandBtn) {
        expandBtn.onclick = () => {
          this.isCompact = false;
          this.render();
        };
      }

      const choiceBtns = this.shadow.querySelectorAll('[data-choice-idx]');
      choiceBtns.forEach((btn) => {
        btn.onclick = () => {
          const idx = Number(btn.getAttribute('data-choice-idx'));
          const chosen = choices[idx];
          if (chosen && chosen.next) {
            this.playNode(chosen.next);
          }
        };
      });
    }
  }

  // Register Custom Elements for declarative HTML usage
  if (typeof customElements !== 'undefined') {
    class TodySalesAssistantElement extends HTMLElement {
      connectedCallback() {
        const configUrl = this.getAttribute('config-url');
        if (configUrl) {
          fetch(configUrl)
            .then((r) => r.json())
            .then((cfg) => {
              this.instance = new TodyUniversalInstance(cfg).mount(this);
            })
            .catch(() => {
              this.instance = new TodyUniversalInstance().mount(this);
            });
        } else {
          this.instance = new TodyUniversalInstance().mount(this);
        }
      }
      disconnectedCallback() {
        if (this.instance) this.instance.unmount();
      }
    }
    if (!customElements.get('tody-sales-assistant')) {
      customElements.define('tody-sales-assistant', TodySalesAssistantElement);
    }
    if (!customElements.get('voice-sales-assistant')) {
      customElements.define('voice-sales-assistant', class extends TodySalesAssistantElement {});
    }
  }

  const exportObj = {
    version: '1.2.0',
    TodyUniversalInstance: TodyUniversalInstance,
    VoiceUniversalInstance: TodyUniversalInstance,
    get instance() {
      return global.__todyActiveInstance || null;
    },
    init: function (config) {
      if (global.__todyActiveInstance) {
        global.__todyActiveInstance.unmount();
      }
      const inst = new TodyUniversalInstance(config).mount(document.body);
      global.__todyActiveInstance = inst;
      return inst;
    },
    open: function (nodeId, options) {
      if (global.__todyActiveInstance) {
        global.__todyActiveInstance.open(nodeId, options);
      }
    },
    goTo: function (nodeId, options) {
      if (global.__todyActiveInstance) {
        global.__todyActiveInstance.open(nodeId, options);
      }
    },
    syncFromHostDemo: function (nodeId) {
      if (global.__todyActiveInstance) {
        global.__todyActiveInstance.syncFromHostDemo(nodeId);
      }
    },
    updateConfig: function (config, options) {
      if (global.__todyActiveInstance) {
        global.__todyActiveInstance.updateConfig(config, options);
      }
    },
  };

  global.TodyAI = exportObj;
  global.TodyVoice = exportObj;
})(typeof window !== 'undefined' ? window : this);
