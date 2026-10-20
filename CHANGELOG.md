# Changelog

Tất cả các thay đổi đáng chú ý của dự án **Tody Voice Agent** sẽ được ghi chép tại tài liệu này theo quy chuẩn [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) và [Semantic Versioning](https://semver.org/).

---

## [2.0.0] - 2026-10-21

### 🚀 Tính Năng Mới & Nâng Cấp Kiến Trúc Đa Dự Án (Enterprise Multi-Project)
- **Tách Biệt Hoàn Toàn Khỏi Code Dự Án Cụ Thể**:
  - Loại bỏ 100% các phụ thuộc demo nội bộ và media assets không liên quan.
  - Chuẩn hóa kiến trúc độc lập, sẵn sàng triển khai cho mọi dự án SaaS, E-Commerce PDP, B2B Landing Page và EdTech.
- **Mở Rộng Hệ Thống Hành Động Trực Quan (VoiceVisualAction)**:
  - Bổ sung `triggerDemoAction`, `setDemoStep` bên cạnh `openDemoScene`, `scrollToSection`, `highlightArea`, `pulseCTA`.
  - Hỗ trợ truyền `payload` linh hoạt cho các framework frontend khác nhau.
- **Standalone Zero-Dependency Script (`tody-voice-sales.js`)**:
  - Đóng gói bằng Web Component & Shadow DOM, cách ly hoàn toàn CSS/JS với trang chủ.
  - Hỗ trợ nhúng vào HTML thuần, WordPress, Shopify, Webflow, Vue, Laravel.
- **Bộ 3 Ví Dụ Mẫu Hoàn Chỉnh (`examples/`)**:
  - `examples/html-standalone/`: Mẫu trang HTML tích hợp qua thẻ `<script>`.
  - `examples/react-nextjs/`: Mẫu component React 19 / Next.js 15 với `VoiceSalesWidget` và `InteractiveDemoContainer`.
  - `examples/ecommerce-pdp/`: Mẫu trang chi tiết sản phẩm bán lẻ với tư vấn kích cỡ, tính năng và nháy nút Thêm vào giỏ.
- **Hệ Thống Tài Liệu Chuyên Sâu (`docs/`)**:
  - `ARCHITECTURE.md`: Chi tiết kiến trúc HUD, 6 quy luật chuyển đổi, máy trạng thái 6 giai đoạn và chuẩn âm thanh EBU R128.
  - `INTEGRATION_GUIDE.md`: Hướng dẫn chi tiết từng bước cho HTML, React, Next.js, WordPress và Shopify.
  - `MULTI_PROJECT_DEPLOY.md`: Sổ tay hướng dẫn triển khai hàng loạt cho 50+ website.
  - `VIENEU_TTS_STUDIO.md`: Hướng dẫn cài đặt và tối ưu hóa VieNeu-TTS v3 Turbo trên Apple Silicon / CPU.
  - `API_REFERENCE.md`: Danh mục đầy đủ interfaces, props, methods và custom events.

---

## [1.0.0] - 2026-10-19

### ✨ Tính Năng Ban Đầu
- Khởi tạo `@tody/voice-sales-sdk` với các component React cốt lõi:
  - `VoiceSalesWidget`: Khung HUD neo đáy 85vw.
  - `VoiceCaption`: Phụ đề trôi đi tối đa 2 dòng (`line-clamp-2`).
  - `AudioWaveform`: Hiệu ứng sóng âm 5 cột theo nhịp đọc.
  - `QuickReplies`: Cơ chế dàn ngang tối đa 2 nút lựa chọn (Primary & Secondary).
  - `InteractiveDemoContainer`: Khung bọc tương tác đồng bộ 2 chiều với giọng nói.
- Tích hợp VieNeu-TTS v3 Turbo với giọng đọc Adam 32 tuổi (48kHz, EBU R128 -16 LUFS).
- Cơ chế dự phòng không độ trễ (Web Speech API Fallback).
- Skill `voice-landing-agent` hỗ trợ Claude Code, Gemini CLI, Antigravity.
