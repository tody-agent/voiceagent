# Hướng Dẫn Triển Khai Cho Nhiều Dự Án (Multi-Project Deployment Playbook)

Tài liệu này cung cấp quy chuẩn kiến trúc để đưa Tody Voice Agent vào quy trình sản xuất hàng loạt (multi-tenant / multi-product deployment), giúp một đội ngũ có thể triển khai trợ lý giọng nói cho 50+ landing page, gian hàng e-commerce hoặc sản phẩm SaaS khác nhau mà không bị trùng lặp code hay phân mảnh tài nguyên.

---

## 1. Mô Hình Triển Khai Tập Trung (Centralized Architecture)

```
                       ┌────────────────────────┐
                       │  Central Voice Engine  │
                       │  (CDN / Static Assets) │
                       └───────────┬────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Dự án SaaS A   │     │  E-Commerce PDP  │     │   Khóa học EdTech│
│ (Landing Page)   │     │ (Shopify / TIK)  │     │  (Next.js App)   │
│                  │     │                  │     │                  │
│ config: saas.json│     │ config: pdp.json │     │ config: edu.json │
│ audio: /cdn/saas │     │ audio: /cdn/pdp  │     │ audio: /cdn/edu  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

### Các Thành Phần Dùng Chung:
1. **Script Bundle duy nhất**: `tody-voice-sales.js` (Lưu trên CDN: `https://cdn.example.com/sdk/v2/tody-voice-sales.js`).
2. **Audio Studio Worker**: `vieneu_tts_worker.py` và `generate_voice_pack.mjs` chạy ở máy chủ CI/CD hoặc máy lập trình viên.
3. **Skill voice-landing-agent**: Dùng chung cho Claude Code, Gemini CLI, Antigravity để tự động scan DOM và generate kịch bản 6 giai đoạn cho bất kỳ repo nào.

### Các Thành Phần Tách Biệt Theo Từng Dự Án:
1. **File cấu hình kịch bản**: `voice.config.json` (quy định tên trợ lý, màu sắc thương hiệu, câu thoại, ưu đãi).
2. **Thư mục âm thanh pre-rendered**: `/audio/{project_id}/` chứa các file WAV/MP3 đã chuẩn hóa -16 LUFS và `manifest.json`.

---

## 2. Quy Trình 3 Bước Triển Khai Cho 1 Dự Án Mới (The 3-Step Rollout)

Khi nhận bàn giao một dự án website mới:

### Bước 1: Khảo Sát DOM & Gắn Nhãn Vùng Mục Tiêu
Sử dụng công cụ audit có sẵn trong skill:
```bash
node skills/voice-landing-agent/scripts/audit-landing-dom.mjs --file=path/to/App.tsx
```
Đảm bảo trang đích có tối thiểu 4 mốc định danh:
- Hero: `id="hero-section"` hoặc `data-voice-target="hero"`
- Demo / Tính năng: `id="interactive-demo-section"` hoặc `data-voice-target="demo"`
- Bảng giá / Ưu đãi: `id="pricing-section"` hoặc `data-voice-target="offer"`
- Kêu gọi hành động: `id="cta-section"` hoặc `data-voice-target="cta"`

### Bước 2: Sinh Kịch Bản Bán Hàng 6 Giai Đoạn
Khởi tạo file `voice.config.json` theo template mẫu:
```bash
node skills/voice-landing-agent/scripts/init-voice-landing.mjs --out=./voice.config.json --project=project-name
```
Chỉnh sửa lời thoại của 6 giai đoạn (Greeting $\rightarrow$ Qualify $\rightarrow$ Pain $\rightarrow$ Demo $\rightarrow$ Objection $\rightarrow$ Offer) cho phù hợp với sản phẩm của dự án đó.

### Bước 3: Batch Generate Bộ Âm Thanh VieNeu-TTS
Chạy CLI để xuất toàn bộ âm thanh chất lượng Studio 48kHz:
```bash
node packages/voice-sales-sdk/tools/generate_voice_pack.mjs \
  --config=./voice.config.json \
  --out=./public/audio/vi \
  --voice=Adam
```

---

## 3. Tối Ưu Hóa Chi Phí & Tốc Độ (Performance & Cost Optimization)

1. **Pre-rendered Audio thay vì Dynamic Streaming**:
   - 90% khách hàng trên landing page nghe các thông điệp giống nhau (Chào hỏi, Tính năng, Giá, Bảo hành). Việc render sẵn âm thanh bằng VieNeu-TTS giúp:
     - **Chi phí API = 0₫**.
     - **Độ trễ phát âm = 0ms** (Audio được cache trên CDN / Browser HTTP cache).
     - **Chất lượng âm thanh luôn đồng đều chuẩn EBU R128 -16 LUFS**.
2. **Kích Thước Bundle Siêu Nhẹ**:
   - Bản standalone `tody-voice-sales.js` chỉ nặng ~34KB (Gzip ~9KB), sử dụng Shadow DOM để hoàn toàn cách ly CSS và JS với trang chính, không làm chậm chỉ số LCP/CLS của trang.
3. **Cơ Chế Dynamic Intent Khi Cần Thiết**:
   - Nếu dự án có tính năng hỏi đáp tự do bằng giọng nói, kích hoạt backend microservice `server/` để phân loại ý định khách hàng qua Gemini Flash 3.8 với chi phí siêu rẻ và chuyển hướng về đúng node định sẵn.
