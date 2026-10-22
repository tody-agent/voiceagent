---
name: VoiceAgent
description: Chuyên dùng để hỗ trợ nâng cấp landing page hoặc gian hàng e-commerce tăng tỷ lệ chuyển đổi (CRO) với AI Voice Sales Assistant, kịch bản bán hàng 6 giai đoạn, giọng đọc tiếng Việt tự nhiên VieNeu-TTS (Adam 32 tuổi 48kHz, EBU R128 -16 LUFS), khung HUD 85vw dàn ngang tối đa 2 nút không cần quyền micro, và cơ chế đồng bộ DOM 2 chiều (scrollToSection, openDemoScene, triggerDemoAction, pulseCTA).
allowed-tools:
  - run_command
  - view_file
  - write_to_file
  - replace_file_content
---

# VoiceAgent — Chuyên Gia Nâng Cấp Landing Page Tăng Chuyển Đổi Bằng Voice Sales Assistant

Sử dụng skill này khi người dùng muốn:
1. **Sửa landing page hiện có (Retrofit / Inject Voice Agent)**: Quét cấu trúc DOM, gắn nhãn mục tiêu, tạo kịch bản bán hàng 6 giai đoạn, tổng hợp giọng đọc tiếng Việt VieNeu-TTS, và nhúng khung HUD tư vấn giọng nói đồng bộ với trang.
2. **Tạo landing page mới hoàn chỉnh (Scaffold from Scratch)**: Khởi tạo trang đích hiện đại chuẩn Apple Cupertino Daylight / Xiaomi Bento / shadcn New York với Hero, Màn hình Demo tương tác 2 chiều (Interactive Sandbox), Ma trận tính năng, Thẻ ưu đãi, và Khung HUD tư vấn giọng nói AI.
3. **Tích hợp giọng đọc tiếng Việt VieNeu-TTS**: Tự động sinh bộ âm thanh chất lượng Studio 48kHz (giọng Adam 32 tuổi trầm ấm, hài hước, thông minh) với chuẩn chuẩn hóa âm lượng EBU R128 (-16 LUFS) và cơ chế dự phòng không độ trễ.

---

## 1. 6 Quy Chuẩn Bất Biến Về Trải Nghiệm (Mandatory UX Invariants)

Khi xây dựng hoặc chỉnh sửa bất kỳ landing page nào có Voice Agent, bắt buộc tuân thủ 6 nguyên tắc sau:

1. **Khung HUD 85% Viewport Width (`w-[85vw] max-w-4xl`)**:
   - Khi mở rộng, khung tư vấn neo ở đáy màn hình (`fixed inset-x-0 bottom-4 flex justify-center`), chiếm `85vw` để dàn trải 2 nút lựa chọn theo chiều ngang, người dùng nhìn thấy ngay không cần cuộn dọc.
2. **Ẩn Mascot/Avatar Khi Đang Tư Vấn/Phát Âm**:
   - Mascot hoạt họa chỉ xuất hiện trên nút nổi góc phải màn hình lúc rảnh. Khi khách bắt đầu nghe tư vấn, ẩn mascot hoàn toàn để giải phóng diện tích hiển thị, chỉ giữ chấm trạng thái gọn gàng và thanh sóng âm `AudioWaveform` 5 cột.
3. **Phụ Đề Trôi Đi Tối Đa 2 Dòng ("2-Line Rolling Captions")**:
   - Tuyệt đối không hiển thị toàn bộ đoạn chat dài dạng cuộn. Chỉ hiển thị **câu nói mới nhất** được kẹp tối đa 2 dòng (`line-clamp-2 min-h-[2.6em] max-h-[2.75em]`), lướt nhẹ từ dưới lên theo nhịp đọc.
4. **Tuyệt Đối Tối Đa 2 Nút Bấm Mỗi Bước (Strictly Max 2 Buttons)**:
   - Mỗi câu thoại chỉ đưa ra tối đa 2 hướng đi: **1 Nút Chính** (`bg-[#1D1D1F] text-white font-semibold`) cho bước đề xuất tiếp theo + **1 Nút Phụ** (`bg-[#F3F4F1] text-[#1D1D1F] border border-[#1D1D1F]/10`) cho hướng thay thế.
5. **Không Cần Xin Quyền Micro (Listen & Choose Model)**:
   - Không yêu cầu quyền microphone của trình duyệt (`navigator.mediaDevices.getUserMedia`). Trợ lý nói cho khách nghe và khách chỉ cần chạm 1 trong 2 nút lựa chọn tức thì, loại bỏ 100% rào cản tâm lý từ chối quyền mic.
6. **Đồng Bộ Hai Chiều Với Màn Hình Demo (Two-Way Sync & Compact HUD)**:
   - Khi chuyển sang giai đoạn Demo (`stage: 'demo'` hoặc `compactDuringDemo: true`), khung tư vấn tự động thu nhỏ về góc phải đáy màn hình (`sm:w-[388px]`) và phát sự kiện `voice:action` / `tody:action` (`scrollToSection`, `openDemoScene`, `highlightArea`, `pulseCTA`) để cuộn trang và đổi cảnh demo theo ngữ cảnh giọng nói.

---

## 2. Quy Trình 1: Sửa Landing Page Hiện Có (Retrofit / Inject Voice Agent)

Khi người dùng yêu cầu thêm Voice Agent hoặc sửa một landing page đã có:

### Bước 1: Quét Cấu Trúc DOM và Gắn Nhãn Vùng Mục Tiêu
Chạy script kiểm tra hoặc quét mã nguồn trang (HTML/JSX/TSX):
```bash
node skills/voice-landing-agent/scripts/audit-landing-dom.mjs --file=src/App.tsx
```
Đảm bảo các khu vực trọng yếu trên trang có ID hoặc thuộc tính `data-voice-target`:
- Hero Section: `id="hero-section"` hoặc `data-voice-target="hero"`
- Interactive Demo Section: `id="interactive-demo-section"` hoặc `data-voice-target="demo"`
- Features / Pain Point Section: `id="features-section"` hoặc `data-voice-target="features"`
- Pricing / Special Offer: `id="pricing-section"` hoặc `data-voice-target="offer"`
- Primary CTA / Download: `id="cta-section"` hoặc `data-voice-target="cta"`

### Bước 2: Thiết Kế Kịch Bản Tư Vấn 6 Giai Đoạn (Conversion Flow)
Tạo file cấu hình `tody.config.json` hoặc `src/data/voice.config.ts` theo mẫu:
- **Giai đoạn 1 — Chào hỏi (Greeting)**: Lời chào thân thiện, dí dỏm dưới 15 giây, khơi gợi 2 lựa chọn (Xem Demo ngay / Xem Ưu đãi).
- **Giai đoạn 2 — Xác định chân dung (Qualify)**: Hỏi về vai trò hoặc thói quen của khách (ví dụ: Lập trình viên / Diễn giả / Doanh nghiệp).
- **Giai đoạn 3 — Điểm đau (Pain)**: Nêu đúng vấn đề nhức nhối (ví dụ: mỏi cổ tay, gián đoạn dòng suy nghĩ).
- **Giai đoạn 4 — Trình diễn Demo (Demo & Value)**: Co nhỏ HUD về góc, cuộn trang tới Demo và kích hoạt cử chỉ/tính năng trực quan.
- **Giai đoạn 5 — Giải tỏa thắc mắc (Objection Handling)**: Trả lời về bảo mật (100% on-device), giá cả (dùng thử miễn phí), độ tương thích phần cứng.
- **Giai đoạn 6 — Chốt ưu đãi (Offer & Close)**: Đưa ra nút CTA tải về hoặc đăng ký kèm hiệu ứng sáng viền (`pulseCTA`).

### Bước 3: Tổng Hợp Bộ Âm Thanh VieNeu-TTS
Chạy công cụ sinh file âm thanh WAV + MP3 với giọng Adam 32 tuổi:
```bash
node packages/voice-sales-sdk/tools/generate_voice_pack.mjs --config=./tody.config.json --out=./public/audio/vi --voice=Adam
```

### Bước 4: Nhúng Trợ Lý Vào Trang
- **Với HTML / WordPress / Shopify / Webflow / Vue**:
  Nhúng script standalone vào cuối trang:
  ```html
  <script src="/sdk/tody-voice-sales.js"></script>
  <script>
    window.TodyVoice.init({
      projectId: 'my-project',
      audioBaseUrl: '/audio/vi',
      brand: { assistantName: 'Tody Voice', assistantRole: 'Tư vấn & Demo' },
      offer: { productName: 'My Product', primaryCtaUrl: 'https://example.com' },
      nodes: { /* kịch bản 6 giai đoạn */ }
    });
  </script>
  ```
- **Với React / Next.js**:
  Sử dụng component `VoiceSalesWidget` kết hợp hook `useConversation`:
  ```tsx
  import { VoiceSalesWidget, useConversation } from '@/packages/voice-sales-sdk';
  import { starterVoiceConfig } from '@/skills/voice-landing-agent/templates/voice.config.template';

  export function MyLandingPage() {
    const conv = useConversation(starterVoiceConfig);
    return (
      <div className="relative">
        <VoiceSalesWidget {...conv} />
      </div>
    );
  }
  ```

### Bước 5: Lắng Nghe Sự Kiện Đồng Bộ Màn Hình Demo
Gắn listener trên trang đích:
```javascript
window.addEventListener('voice:action', function (e) {
  var detail = e.detail;
  if (detail.type === 'openDemoScene' && detail.scene) {
    // Chuyển tab hoặc đổi cảnh demo tương tác
  }
});
```

---

## 3. Quy Trình 2: Tạo Landing Page Mới Hoàn Chỉnh (Scaffold from Scratch)

Khi người dùng muốn tạo mới một landing page hoàn chỉnh có Voice Agent:

### Bước 1: Khởi Tạo Dự Án & Cấu Hình
Chạy công cụ khởi tạo:
```bash
node skills/voice-landing-agent/scripts/init-voice-landing.mjs --name="TênSảnPhẩm" --role="Tư vấn & Trình diễn" --url="https://example.com/signup"
```

### Bước 2: Thiết Kế Giao Diện Chuẩn Light-First (Apple / Xiaomi / shadcn)
- **Quy tắc 85/10/5**: 85% nền sáng trung tính (`#FAFAFA`, `#F5F5F7`, `#FFFFFF`), 10% viền mảnh 1px (`rgba(0,0,0,0.08)`), 5% điểm nhấn CTA (`#1D1D1F` hoặc `#4A90E2`).
- **Thang chữ 3 nấc**: Body `14px`, Meta `13px`, Chrome/Header `12px`, Tiêu đề trang `20px–24px font-bold`.
- **Cấu trúc 5 phần chuẩn**:
  1. **Header Kính Mờ (Backdrop Blur Glass)**: Logo sản phẩm + Nút trạng thái Voice Agent.
  2. **Hero Section**: Tiêu đề gãy gọn, lời dẫn thực tế, nút Primary CTA + nút "Nghe tư vấn 30s".
  3. **Interactive Demo Sandbox**: Khu vực mô phỏng tính năng sản phẩm tương tác thực tế với các tab hoặc bộ điều khiển, được bọc trong `<InteractiveDemoContainer>`.
  4. **Ma Trận Lợi Ích & Bằng Chứng Xã Hội**: 3 thẻ Bento bo góc 18px (`rounded-2xl`) thể hiện giải pháp triệt tiêu điểm đau.
  5. **Thẻ Chốt Giá & Tải Về**: Bảng giá rõ ràng, minh bạch, cam kết bảo mật.
  6. **Voice Sales HUD**: Khung HUD 85vw neo đáy màn hình, luôn đồng hành cùng khách lướt web.

### Bước 3: Kiểm Tra Thẩm Mỹ & Kiểm Chứng Thị Giác
Chạy kiểm toán giao diện để triệt tiêu AI-slop:
```bash
python3 -B scripts/ux_inspect.py --target http://localhost:3000 --screenshots --strict-veto
```
Đảm bảo 0 lỗi Blocker/Major: không nền tối xám u ám, không hộp màu cầu vồng, không emoji làm icon.

---

## 4. Tài Liệu Tham Khảo Kỹ Thuật (References & Templates)

- `references/config-schema.md`: Đặc tả toàn bộ kiểu TypeScript và danh sách tùy chọn cấu hình.
- `references/dom-actions.md`: Bảng tra cứu các sự kiện `voice:action` / `tody:action`.
- `references/sales-formula.md`: Công thức tâm lý học hành vi đằng sau kịch bản tư vấn giọng nói 6 bước.
- `references/vieneu-tts-guide.md`: Hướng dẫn cấu hình mô hình ONNX Runtime CPU của VieNeu-TTS v3 Turbo.
- `templates/voice.config.template.ts`: Mẫu file cấu hình tiêu chuẩn có sẵn 8 node hội thoại.
- `templates/standalone-embed.html`: Mẫu file HTML hoàn chỉnh nhúng Universal Web SDK.
- `templates/react-landing-template.tsx`: Mẫu component trang đích React hoàn chỉnh với Demo tương tác đồng bộ.
