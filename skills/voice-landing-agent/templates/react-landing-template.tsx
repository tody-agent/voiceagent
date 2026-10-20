import React, { useState } from 'react';
import {
  VoiceSalesWidget,
  useConversation,
  InteractiveDemoContainer,
  type VoiceAssistantConfig,
} from '../../../packages/voice-sales-sdk/src/index.ts';
import { Headphones, ShieldCheck, Sparkles, Zap } from 'lucide-react';

const voiceConfig: VoiceAssistantConfig = {
  projectId: 'touchpass',
  brand: {
    assistantName: 'Tody Voice',
    assistantRole: 'Tư vấn & Trình diễn',
    inviteTitle: 'Chào bạn, mình là Tody 👋',
    inviteBody: 'Nghe mình giới thiệu & trình diễn sản phẩm trong 30 giây nhé?',
    primaryColor: '#1D1D1F',
    accentColor: '#4A90E2',
  },
  offer: {
    productName: 'TouchPass Pro',
    headline: 'Bảo mật mật khẩu & OTP bằng cử chỉ tay',
    summary: 'Chạy nội bộ 100% trên chip Apple Silicon, không gửi dữ liệu lên cloud.',
    primaryCtaLabel: 'Tải miễn phí ngay',
    primaryCtaUrl: 'https://touchpass.dev',
  },
  nodes: {
    welcome: {
      id: 'welcome',
      audioId: 'welcome',
      transcript:
        'Chào bạn! Mình là Tody. Bạn muốn xem màn trình diễn tự động điền mật khẩu bằng cử chỉ, hay nhận liên kết tải về máy Mac?',
      stage: 'greeting',
      choices: [
        { id: 'c1', label: 'Xem trình diễn Demo trực tiếp', next: 'demo' },
        { id: 'c2', label: 'Nhận ưu đãi tải về ngay', next: 'offer' },
      ],
    },
    demo: {
      id: 'demo',
      audioId: 'show_demo',
      transcript:
        'Nhìn màn hình nhé: bạn chỉ cần chụm nhẹ ngón tay trên không trung, TouchPass sẽ nhận diện và điền tự động trong 3 mili giây.',
      stage: 'demo',
      compactDuringDemo: true,
      visualAction: {
        type: 'openDemoScene',
        scene: 'autofill_demo',
      },
      choices: [
        { id: 'c3', label: 'Tải về máy Mac ngay', next: 'offer' },
        { id: 'c4', label: 'Nghe lại từ đầu', next: 'welcome' },
      ],
    },
    offer: {
      id: 'offer',
      audioId: 'offer',
      transcript:
        'Bản cài đặt cho macOS đang cho tải miễn phí. Nút tải nằm ngay bên dưới, bạn kéo về dùng thử nhé!',
      stage: 'offer',
      visualAction: {
        type: 'scrollToSection',
        target: 'download-cta-section',
      },
      choices: [
        { id: 'c5', label: 'Xem lại màn hình Demo', next: 'demo' },
      ],
    },
  },
};

export default function StarterLandingPage() {
  const conv = useConversation(voiceConfig);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#09090B]">
      {/* 1. Glass Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[#E4E4E7] bg-white/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm tracking-tight">
            <span className="w-2 h-2 rounded-full bg-[#18181B]" />
            <span>TouchPass</span>
          </div>

          <button
            type="button"
            onClick={() => conv.startVoice()}
            className="px-3 py-1.5 rounded-full bg-[#F4F4F5] hover:bg-[#E4E4E7] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Headphones className="w-3.5 h-3.5 text-[#4A90E2]" />
            <span>Nghe Tody tư vấn</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16 space-y-20">
        {/* 2. Hero Section */}
        <section id="hero-section" data-voice-target="hero" className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4F4F5] text-xs font-medium text-[#71717A]">
            <Sparkles className="w-3.5 h-3.5 text-[#4A90E2]" />
            <span>Công nghệ điều khiển cử chỉ không chạm</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#09090B]">
            Điều Khiển Mọi Thứ Bằng Cử Chỉ Bàn Tay & Giọng Nói
          </h1>
          <p className="text-sm sm:text-base text-[#71717A] leading-relaxed">
            Độ trễ chỉ 3 mili giây, chạy hoàn toàn nội bộ trên chip Apple Silicon Neural Engine, không bao giờ gửi hình ảnh lên đám mây.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <a
              href="#download-cta-section"
              className="px-5 py-2.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-semibold transition-all shadow-sm"
            >
              Tải miễn phí cho Mac
            </a>
            <button
              type="button"
              onClick={() => conv.startVoice('demo')}
              className="px-5 py-2.5 rounded-xl bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#18181B] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Headphones className="w-3.5 h-3.5 text-[#4A90E2]" />
              <span>Xem Demo cùng Tody</span>
            </button>
          </div>
        </section>

        {/* 3. Interactive Demo Sandbox (Synchronized with Voice Agent) */}
        <InteractiveDemoContainer id="interactive-demo-section">
          {({ activeScene, setActiveScene }: { activeScene: string; setActiveScene: (s: string) => void }) => (
            <div className="p-6 rounded-2xl bg-white border border-[#E4E4E7] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#F4F4F5] pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#4A90E2]" />
                  <span className="text-sm font-bold">Màn Hình Mô Phỏng Tương Tác</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {['overview', 'autofill_demo', 'gesture_lock'].map((scene) => (
                    <button
                      key={scene}
                      type="button"
                      onClick={() => setActiveScene(scene)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        activeScene === scene
                          ? 'bg-[#18181B] text-white'
                          : 'bg-[#F4F4F5] text-[#71717A] hover:text-[#09090B]'
                      }`}
                    >
                      {scene}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-64 rounded-xl bg-[#FAFAFA] border border-dashed border-[#E4E4E7] flex flex-col items-center justify-center p-6 text-center">
                <span className="text-xs uppercase tracking-wider text-[#71717A] font-semibold mb-1">
                  Cảnh hiện tại được kích hoạt:
                </span>
                <span className="text-base font-bold font-mono text-[#09090B]">
                  {activeScene}
                </span>
                <p className="text-xs text-[#71717A] mt-2 max-w-sm">
                  Khi Tody giải thích đến đoạn nào, hệ thống tự động đổi cảnh và kích hoạt cử chỉ tương ứng.
                </p>
              </div>
            </div>
          )}
        </InteractiveDemoContainer>

        {/* 4. Pricing / Offer Section */}
        <section id="download-cta-section" data-voice-target="offer" className="p-8 rounded-2xl bg-white border border-[#E4E4E7] text-center space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#22C55E] font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>Miễn phí 100% · Không cần thẻ tín dụng</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Trải Nghiệm Ngay Trên Máy Mac Của Bạn
          </h2>
          <p className="text-xs sm:text-sm text-[#71717A] max-w-md mx-auto">
            Hỗ trợ đầy đủ macOS từ Sonoma đến Sequoia trên chip Apple Silicon M1, M2, M3, M4.
          </p>
          <div className="pt-2">
            <a
              href="https://touchpass.dev"
              className="inline-block px-6 py-3 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white text-xs sm:text-sm font-semibold transition-all shadow-md"
            >
              Tải TouchPass Cho Mac
            </a>
          </div>
        </section>
      </main>

      {/* 5. Voice Sales Assistant HUD */}
      <VoiceSalesWidget
        config={conv.config}
        currentNode={conv.currentNode}
        widgetState={conv.widgetState}
        isExpanded={conv.isExpanded}
        isCompactCompanion={conv.isCompactCompanion}
        isPlaying={conv.audioState.isPlaying}
        isMuted={conv.audioState.isMuted}
        playbackProgress={conv.audioState.progress}
        audioLevels={conv.audioState.levels}
        onStartVoice={conv.startVoice}
        onDismissInvite={conv.dismissInvite}
        onSelectChoice={conv.selectChoice}
        onSkipSpeech={conv.skipSpeech}
        onRestart={conv.restart}
        onToggleMute={conv.toggleMute}
        onClose={conv.close}
        onExpandFromCompact={conv.expandFromCompact}
        onSetCompact={conv.setCompact}
      />
    </div>
  );
}
