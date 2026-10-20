# 🎙️ Tody Voice Agent — Enterprise AI Voice Sales Experience & Interactive Demo HUD Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Platform: Web & React](https://img.shields.io/badge/Platform-HTML5%20%7C%20React%2019%20%7C%20Next.js-orange.svg)](https://github.com/tody-agent/voiceagent)
[![Voice: VieNeu--TTS v3 Turbo](https://img.shields.io/badge/TTS-VieNeu--TTS%2048kHz%20Adam-success.svg)](https://github.com/pnnbao97/VieNeu-TTS)
[![Acoustics: EBU R128](https://img.shields.io/badge/Mastering--16%20LUFS%20True%20Peak-purple.svg)](./docs/ARCHITECTURE.md)
[![Zero-Dependency Script](https://img.shields.io/badge/Bundle-34KB%20Shadow%20DOM-brightgreen.svg)](./packages/voice-sales-sdk)

> **Biến mọi Landing Page, Gian Hàng E-Commerce và Ứng Dụng SaaS thành Cỗ Máy Bán Hàng Trực Tiếp (Voice Sales Machine) bằng Giọng Nói AI Chuẩn Studio và Màn Hình Trình Diễn Tương Tác 2 Chiều.**

---

## 🌟 Tổng Quan (Overview)

**Tody Voice Agent** là một bộ giải pháp hoàn chỉnh (Production-grade SDK, AI Agent Skill và Voice Generation Studio) được tối ưu hóa cho **Tỷ lệ Chuyển đổi (Conversion Rate Optimization - CRO)**. 

Khác với các chatbot văn bản truyền thống có tỷ lệ phản hồi thấp hoặc các voicebot xin quyền micro gây e ngại, Tody Voice Agent áp dụng triết lý **"Listen & Choose"** (Nghe tư vấn giọng tự nhiên và Chạm chọn tức thì), kết hợp với khả năng **đồng bộ hai chiều xuống giao diện trang web** để tự động cuộn trang, đổi cảnh demo và làm nổi bật các nút hành động đúng thời điểm.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Tody Voice Agent Ecosystem                       │
├─────────────────────┬───────────────────────┬──────────────────────────┤
│ 📦 SDK & Library    │ 🧠 AI Agent Skill     │ 🎙️ Studio Voice Engine   │
│ (@tody/voice-sales) │ (voice-landing-agent) │ (VieNeu-TTS v3 Turbo)    │
│                     │                       │                          │
│ • React 18/19 SDK   │ • Audit DOM cấu trúc  │ • Giọng Adam 32 tuổi     │
│ • Standalone JS     │ • Kịch bản 6 giai đoạn│ • Chuẩn EBU R128 -16LUFS │
│ • 2-Way DOM Bridge  │ • Scaffold trang mới  │ • CLI batch synthesis    │
│ • Shadow DOM HUD    │ • Tự động gắn nhãn    │ • Zero-latency fallback  │
└─────────────────────┴───────────────────────┴──────────────────────────┘
```

---

## 🎯 6 Quy Chuẩn Bất Biến Về Trải Nghiệm (Conversion UX Invariants)

Mọi giao diện Voice Agent trong hệ sinh thái đều tuân thủ nghiêm ngặt 6 nguyên tắc vàng:

1. **Khung HUD 85% Viewport Width (`w-[85vw] max-w-4xl`)**:
   - Khi mở rộng, khung tư vấn neo chính giữa đáy màn hình, chiếm `85vw` để dàn trải 2 nút lựa chọn theo chiều ngang. Khách nhìn thấy ngay cả lời nói và 2 nút lựa chọn mà không cần cuộn chuột.
2. **Ẩn Mascot Khi Đang Tư Vấn/Phát Âm**:
   - Mascot hoạt họa chỉ xuất hiện trên nút nổi lúc rảnh. Khi khách bắt đầu nghe tư vấn, mascot ẩn hoàn toàn để giải phóng diện tích, chỉ giữ chấm trạng thái gọn gàng và thanh sóng âm `AudioWaveform` 5 cột tinh giản.
3. **Phụ Đề Trôi Đi Tối Đa 2 Dòng ("2-Line Rolling Captions")**:
   - Tuyệt đối không giữ lịch sử chat dài dạng cuộn. Chỉ hiển thị duy nhất câu nói mới nhất được kẹp tối đa 2 dòng (`line-clamp-2`), lướt nhẹ từ dưới lên theo nhịp đọc.
4. **Tuyệt Đối Tối Đa 2 Nút Bấm Mỗi Bước (Strictly Max 2 Buttons)**:
   - Mỗi câu thoại chỉ đưa ra tối đa 2 hướng đi: **1 Nút Chính** (`#1D1D1F` tương phản cao) cho bước đề xuất tiếp theo + **1 Nút Phụ** (`#F3F4F1` viền mảnh) cho hướng thay thế. Triệt tiêu 100% sự do dự của khách hàng.
5. **Không Cần Xin Quyền Micro (Listen & Choose Model)**:
   - Không yêu cầu quyền microphone của trình duyệt (`getUserMedia`). Trợ lý nói bằng giọng tự nhiên và khách chỉ cần chạm nút chọn ngay tức thì. Loại bỏ 100% rào cản từ chối quyền mic.
6. **Đồng Bộ Hai Chiều Với Màn Hình Demo (Two-Way Sync & Compact HUD)**:
   - Khi bước vào giai đoạn Demo (`stage: 'demo'`), khung tư vấn tự động thu nhỏ về góc phải màn hình (`sm:w-[388px]`) và phát sự kiện `voice:action` (`scrollToSection`, `openDemoScene`, `triggerDemoAction`, `pulseCTA`) để cuộn trang và đổi cảnh demo theo ngữ cảnh giọng nói.

---

## 🚀 Cách Bắt Đầu Nhanh (Quickstart)

### Cách 1: Nhúng Mọi Website Qua Script Tag (HTML, WordPress, Shopify, Webflow)

Không cần cài đặt npm hay build tool phức tạp, chỉ cần nhúng file `tody-voice-sales.js` (Zero-dependency, đóng gói bằng Shadow DOM):

```html
<!-- 1. Nhúng script SDK -->
<script src="https://cdn.jsdelivr.net/gh/tody-agent/voiceagent@main/packages/voice-sales-sdk/sdk/tody-voice-sales.js"></script>

<!-- 2. Khởi tạo cấu hình trợ lý -->
<script>
  window.TodyVoice.init({
    projectId: 'my-saas-landing',
    locale: 'vi-VN',
    audioBaseUrl: '/audio/vi',
    inviteDelayMs: 3000,
    brand: {
      assistantName: 'Tody Voice',
      assistantRole: 'Cố vấn Bán hàng AI',
      inviteTitle: 'Chào bạn, mình là Tody 👋',
      inviteBody: 'Nghe mình tóm tắt tính năng sản phẩm trong 30 giây nhé?',
      primaryColor: '#18181B',
      accentColor: '#2563EB'
    },
    offer: {
      productName: 'Tên Sản Phẩm Của Bạn',
      headline: 'Dùng thử 14 ngày miễn phí',
      primaryCtaLabel: 'Bắt đầu ngay hôm nay',
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
        audioId: 'demo_node',
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
        audioId: 'offer_node',
        transcript: 'Bạn có thể đăng ký tài khoản miễn phí chỉ trong ba mươi giây bằng nút bấm bên dưới!',
        stage: 'offer',
        visualAction: { type: 'pulseCTA', target: 'pricing-section' },
        choices: [
          { id: 'c_demo', label: 'Xem lại Demo', next: 'demo_node' }
        ]
      }
    }
  });

  // Lắng nghe sự kiện đồng bộ 2 chiều từ Voice Assistant
  window.addEventListener('voice:action', (e) => {
    console.log('Voice Action triggered:', e.detail);
  });
</script>
```

---

### Cách 2: Tích Hợp Vào React / Next.js (App Router / Pages Router)

```bash
npm install @tody/voice-sales-sdk
```

```tsx
import React from 'react';
import {
  VoiceSalesWidget,
  useConversation,
  InteractiveDemoContainer,
  type VoiceProjectConfig
} from '@tody/voice-sales-sdk';

const voiceConfig: VoiceProjectConfig = {
  projectId: 'saas-pro',
  locale: 'vi-VN',
  audioBaseUrl: '/audio/vi',
  nodes: {
    /* Khai báo kịch bản các node */
  }
};

export function LandingPage() {
  const conv = useConversation(voiceConfig, {
    onVisualAction: (action) => {
      console.log('Action:', action);
    }
  });

  return (
    <div className="relative min-h-screen">
      {/* Màn hình Demo tương tác 2 chiều */}
      <InteractiveDemoContainer id="interactive-demo-section">
        {({ activeScene }) => (
          <div className="p-8 border rounded-2xl">
            <h3>Cảnh hiện tại: {activeScene}</h3>
          </div>
        )}
      </InteractiveDemoContainer>

      {/* Khung HUD Trợ lý Giọng nói Bán hàng */}
      <VoiceSalesWidget {...conv} />
    </div>
  );
}
```

---

## 🛠️ Công Cụ Sinh Âm Thanh VieNeu-TTS Studio (CLI Audio Pack Generator)

Tự động chuyển đổi toàn bộ câu thoại trong file cấu hình thành các file âm thanh WAV + MP3 chất lượng Studio 48kHz chuẩn EBU R128 (-16 LUFS):

```bash
node packages/voice-sales-sdk/tools/generate_voice_pack.mjs \
  --config=./voice.config.json \
  --out=./public/audio/vi \
  --voice=Adam
```

### Tham Số CLI:
- `--config`: Đường dẫn tới file JSON kịch bản (mặc định: `voice.config.json`).
- `--out`: Thư mục xuất âm thanh (mặc định: `public/audio/vi`).
- `--voice`: Tên giọng đọc (`Adam`, `HaiDang`, `MaiAnh`).
- `--force`: Đặt `true` nếu muốn tạo lại toàn bộ file kể cả khi đã tồn tại.

---

## 🤖 Sử Dụng Skill AI Cho Claude Code / Gemini CLI / Antigravity

Skill `voice-landing-agent` cho phép các AI coding assistant tự động:
1. **Audit cấu trúc DOM** của landing page hiện tại và gợi ý gắn các thuộc tính `data-voice-target`.
2. **Khởi tạo kịch bản bán hàng 6 giai đoạn** phù hợp với chân dung khách hàng của dự án.
3. **Tự động kích hoạt bộ sinh âm thanh** và nhúng HUD vào mã nguồn.

### Cài Đặt Skill Vào Hệ Thống Của Bạn:
```bash
# Dành cho Antigravity / Gemini CLI:
cp -r skills/voice-landing-agent ~/.gemini/config/skills/

# Dành cho Claude Code:
cp -r skills/voice-landing-agent ~/.claude/skills/
```

### Câu Lệnh Kích Hoạt Skill:
- *"Thêm trợ lý tư vấn giọng nói AI vào landing page này."*
- *"Tạo kịch bản bán hàng 6 giai đoạn và xuất âm thanh VieNeu-TTS cho sản phẩm X."*
- *"Kiểm tra DOM của trang để tích hợp voice HUD đồng bộ 2 chiều."*

---

## 📂 Cấu Trúc Thư Mục Kho Lưu Trữ (Repository Structure)

```
voiceagent/
├── README.md                      # Tài liệu tổng quan dự án
├── CHANGELOG.md                   # Lịch sử cập nhật phiên bản
├── LICENSE                        # Giấy phép MIT
├── package.json                   # Cấu hình workspace monorepo
├── tsconfig.json                  # Cấu hình TypeScript
│
├── docs/                          # Hệ thống tài liệu chi tiết
│   ├── ARCHITECTURE.md            # Kiến trúc hệ thống, 6 quy luật CRO, EBU R128
│   ├── INTEGRATION_GUIDE.md       # Hướng dẫn tích hợp HTML, React, Next.js, Shopify
│   ├── MULTI_PROJECT_DEPLOY.md    # Sổ tay triển khai cho 50+ website
│   ├── VIENEU_TTS_STUDIO.md       # Cài đặt và sử dụng VieNeu-TTS Studio
│   └── API_REFERENCE.md           # Toàn bộ interfaces, methods, và events
│
├── packages/
│   └── voice-sales-sdk/           # Package cốt lõi (@tody/voice-sales-sdk)
│       ├── src/                   # React components, hooks, services, types
│       ├── sdk/                   # Standalone browser bundle (tody-voice-sales.js)
│       └── tools/                 # CLI generate_voice_pack.mjs & vieneu_tts_worker.py
│
├── skills/
│   └── voice-landing-agent/       # Skill cho Claude Code / Gemini CLI / Antigravity
│       ├── SKILL.md               # Quy chuẩn vận hành skill
│       ├── references/            # Quy tắc viết thoại, công thức CRO, DOM actions
│       ├── scripts/               # audit-landing-dom.mjs, init-voice-landing.mjs
│       └── templates/             # Template React, Standalone HTML, Config TS
│
├── server/                        # Backend microservice cho TTS on-demand & intent routing
│   ├── routes/voice.ts            # REST API endpoints
│   ├── services/                  # Intent classifier, audio pack service, VieNeu bridge
│   └── index.ts                   # Express server entry point
│
└── examples/                      # 3 ví dụ mẫu thực tế
    ├── html-standalone/           # Mẫu HTML thuần nhúng script tag
    ├── react-nextjs/              # Mẫu React 19 / Next.js 15 app
    └── ecommerce-pdp/             # Mẫu trang chi tiết sản phẩm thương mại điện tử
```

---

## 📖 Thư Mục Tài Liệu Bổ Sung

- [Kiến Trúc & Quy Chuẩn CRO (ARCHITECTURE.md)](./docs/ARCHITECTURE.md)
- [Hướng Dẫn Tích Hợp Đa Nền Tảng (INTEGRATION_GUIDE.md)](./docs/INTEGRATION_GUIDE.md)
- [Sổ Tay Triển Khai Cho Nhiều Dự Án (MULTI_PROJECT_DEPLOY.md)](./docs/MULTI_PROJECT_DEPLOY.md)
- [VieNeu-TTS Studio & Voice Generation (VIENEU_TTS_STUDIO.md)](./docs/VIENEU_TTS_STUDIO.md)
- [API Reference Đầy Đủ (API_REFERENCE.md)](./docs/API_REFERENCE.md)
- [Lịch Sử Phiên Bản (CHANGELOG.md)](./CHANGELOG.md)

---

## 📄 Bản Quyền (License)

Dự án phát hành theo giấy phép [MIT License](./LICENSE).  
Bản quyền © 2026 [tody-agent](https://github.com/tody-agent).
