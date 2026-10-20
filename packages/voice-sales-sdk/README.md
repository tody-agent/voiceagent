# @tody/voice-sales-sdk — AI Voice Sales Assistant & Interactive Demo HUD

Thư viện đóng gói hoàn chỉnh giúp tích hợp **Trợ lý Tư vấn Giọng nói AI (Voice Sales Assistant)** và **Demo Tương tác 2 Chiều** vào bất kỳ website hoặc landing page nào (React, Next.js, Vue, WordPress, Shopify, Webflow, hoặc HTML thuần).

Hỗ trợ tổng hợp giọng nói tiếng Việt tự nhiên chuẩn Studio với **VieNeu-TTS v3 Turbo** (giọng Adam 32 tuổi, 48kHz, chuẩn EBU R128 -16 LUFS) và cơ chế dự phòng không độ trễ bằng Web Speech API.

---

## 🌟 6 Nguyên Tắc Trải Nghiệm Cốt Lõi (Conversion UX)

1. **Khung HUD 85% Viewport Width (`85vw max-w-4xl`)**: Neo giữa đáy màn hình, dàn nút ngang 2 cột để khách thấy ngay không cần cuộn.
2. **Ẩn Mascot Khi Đang Tư Vấn/Phát Âm**: Mascot chỉ xuất hiện ở nút nổi khi rảnh; khi mở khung chỉ hiển thị chấm trạng thái + thanh sóng `AudioWaveform` 5 cột tinh giản.
3. **Phụ Đề Trôi Đi 2 Dòng ("Rolling Captions")**: Chỉ hiển thị tối đa 2 dòng câu nói mới nhất (`line-clamp-2`), lướt mượt theo ngữ điệu giọng nói.
4. **Tối Đa 2 Nút Bấm Mỗi Bước**: 1 nút Chính (`#1D1D1F` tương phản cao) + 1 nút Phụ (`#F3F4F1` viền mảnh), triệt tiêu do dự mua hàng.
5. **Không Cần Xin Quyền Micro (Listen & Choose)**: Khách nghe giọng tư vấn và bấm chọn tức thì, loại bỏ 100% rào cản từ chối quyền micro của trình duyệt.
6. **Đồng Bộ Hai Chiều Với Màn Hình Demo (Compact HUD)**: Khi bước vào Demo (`stage: 'demo'`), trợ lý tự động co về góc phải (`sm:w-[388px]`) và phát sự kiện `voice:action` / `tody:action` để cuộn trang và kích hoạt hiệu ứng tương tác.

---

## 🚀 Cách Tích Hợp

### Phương án 1: Nhúng Mọi Website (HTML, WordPress, Shopify, Webflow, Vue, PHP)
Không cần cài đặt npm hay build tool, chỉ cần nhúng file `tody-voice-sales.js` (Zero-dependency, đóng gói bằng Shadow DOM):

```html
<!-- 1. Nhúng script SDK -->
<script src="/sdk/tody-voice-sales.js"></script>

<!-- 2. Khởi tạo cấu hình trợ lý -->
<script>
  window.TodyVoice.init({
    projectId: 'my-saas-landing',
    locale: 'vi-VN',
    audioBaseUrl: '/audio/vi',
    inviteDelayMs: 4000,
    brand: {
      assistantName: 'Tody Voice',
      assistantRole: 'Tư vấn & Trình diễn',
      inviteTitle: 'Chào bạn, mình là Tody 👋',
      inviteBody: 'Nghe mình giới thiệu & trình diễn sản phẩm trong 30 giây nhé?',
      primaryColor: '#1D1D1F',
      accentColor: '#4A90E2'
    },
    offer: {
      productName: 'Tên Sản Phẩm',
      headline: 'Dùng thử 14 ngày miễn phí',
      primaryCtaLabel: 'Bắt đầu dùng thử ngay',
      primaryCtaUrl: 'https://example.com/signup'
    },
    nodes: {
      welcome: {
        id: 'welcome',
        audioId: 'welcome',
        transcript: 'Chào bạn! Mình là Tody. Bạn muốn xem màn trình diễn sản phẩm hay xem bảng giá ưu đãi?',
        stage: 'greeting',
        choices: [
          { id: 'c_demo', label: 'Xem trình diễn Demo ngay', next: 'demo_node' },
          { id: 'c_offer', label: 'Xem bảng giá & ưu đãi', next: 'offer_node' }
        ]
      },
      demo_node: {
        id: 'demo_node',
        audioId: 'show_demo',
        transcript: 'Mình đang mở màn hình Demo tương tác để bạn quan sát tính năng thực tế nhé.',
        stage: 'demo',
        compactDuringDemo: true,
        visualAction: { type: 'scrollToSection', target: 'interactive-demo-section' },
        choices: [
          { id: 'c_offer', label: 'Nhận ưu đãi dùng thử', next: 'offer_node' },
          { id: 'c_back', label: 'Nghe lại từ đầu', next: 'welcome' }
        ]
      },
      offer_node: {
        id: 'offer_node',
        audioId: 'offer',
        transcript: 'Bạn có thể đăng ký tài khoản miễn phí chỉ trong 30 giây bằng nút bấm bên dưới!',
        stage: 'offer',
        visualAction: { type: 'scrollToSection', target: 'pricing-section' },
        cta: { primaryLabel: 'Bắt đầu dùng thử miễn phí', primaryUrl: 'https://example.com/signup' },
        choices: [
          { id: 'c_demo', label: 'Xem lại màn hình Demo', next: 'demo_node' }
        ]
      }
    }
  });

  // Lắng nghe sự kiện đồng bộ 2 chiều từ Voice Assistant
  window.addEventListener('voice:action', (e) => {
    console.log('Voice Action:', e.detail);
    // e.detail.type: 'scrollToSection' | 'openDemoScene' | 'highlightArea' | 'pulseCTA'
  });
</script>
```

Hoặc dùng Web Component khai báo trực quan:
```html
<voice-sales-assistant config-url="/voice-config.json"></voice-sales-assistant>
```

---

### Phương án 2: React / Next.js / Vite (Component Hook)

```tsx
import React from 'react';
import {
  VoiceSalesWidget,
  useConversation,
  InteractiveDemoContainer,
  dispatchVoiceVisualAction,
  type VoiceAssistantConfig,
} from '@tody/voice-sales-sdk';

const voiceConfig: VoiceAssistantConfig = {
  projectId: 'touchpass',
  brand: {
    assistantName: 'Tody Voice',
    assistantRole: 'Tư vấn bán hàng',
    inviteTitle: 'Chào bạn, mình là Tody 👋',
    inviteBody: 'Trải nghiệm thử tính năng mới trong 30 giây nhé?',
  },
  offer: {
    productName: 'TouchPass Pro',
    headline: 'Bảo mật tuyệt đối trên macOS',
    summary: 'Không lưu dữ liệu đám mây, 100% on-device.',
    primaryCtaLabel: 'Tải miễn phí ngay',
    primaryCtaUrl: 'https://touchpass.dev',
  },
  nodes: {
    welcome: {
      id: 'welcome',
      audioId: 'welcome',
      transcript: 'Chào bạn! Bạn muốn xem demo thực tế hay nhận ưu đãi tải về?',
      stage: 'greeting',
      choices: [
        { id: 'c1', label: 'Xem mô phỏng Demo', next: 'demo' },
        { id: 'c2', label: 'Tải bản miễn phí ngay', next: 'offer' },
      ],
    },
    demo: {
      id: 'demo',
      audioId: 'show_demo',
      transcript: 'Nhìn màn hình nhé, bạn có thể bấm thử các tab tính năng.',
      stage: 'demo',
      compactDuringDemo: true,
      visualAction: { type: 'openDemoScene', scene: 'live_test' },
      choices: [
        { id: 'c3', label: 'Nhận ưu đãi tải về', next: 'offer' },
      ],
    },
    offer: {
      id: 'offer',
      audioId: 'offer',
      transcript: 'Nút tải nằm ngay bên dưới rồi đó, bạn kéo về trải nghiệm nhé!',
      stage: 'offer',
      choices: [],
    },
  },
};

export default function LandingPage() {
  const conv = useConversation(voiceConfig, (action) => {
    console.log('Đồng bộ màn hình Demo:', action);
  });

  return (
    <div className="relative min-h-screen">
      {/* 1. Interactive Demo Section */}
      <InteractiveDemoContainer id="interactive-demo-section">
        {({ activeScene, setActiveScene }) => (
          <div className="p-8 border rounded-2xl">
            <h3>Cảnh Demo Hiện Tại: {activeScene}</h3>
            <button onClick={() => setActiveScene('preview')}>Đổi Cảnh</button>
          </div>
        )}
      </InteractiveDemoContainer>

      {/* 2. Voice Sales HUD */}
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
```

---

## 🎙️ Tổng Hợp Giọng Đọc Tiếng Việt (VieNeu-TTS Worker)

Chạy công cụ tạo toàn bộ file âm thanh WAV (24kHz) và MP3 (nén siêu nhẹ ~70KB/clip) cho file cấu hình của bạn:

```bash
# Cài đặt phụ thuộc Python (ONNX Runtime, không cần PyTorch nặng nề)
pip install vieneu soundfile huggingface_hub

# Chạy lệnh tổng hợp âm thanh tự động
node tools/generate_voice_pack.mjs --config=./tody.config.json --out=./public/audio/vi --voice=Adam
```

Toàn bộ file âm thanh và file kiểm chứng `manifest.json` sẽ được sinh tự động trong `public/audio/vi/`.
