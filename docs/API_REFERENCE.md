# Tài Liệu Tham Chiếu API (API Reference)

Tài liệu chi tiết về toàn bộ các interface, cấu trúc dữ liệu, React components, hooks và custom events của `@tody/voice-sales-sdk`.

---

## 1. Cấu Trúc Dữ Liệu Cốt Lõi (Core Interfaces)

### `VoiceProjectConfig`
```typescript
export interface VoiceProjectConfig {
  /** Định danh duy nhất của dự án */
  projectId: string;
  /** Mã ngôn ngữ, mặc định: 'vi-VN' */
  locale?: string;
  /** Đường dẫn gốc chứa file audio (.wav/.mp3), ví dụ: '/audio/vi' */
  audioBaseUrl?: string;
  /** Thời gian trễ trước khi hiện lời mời (ms), mặc định: 3000 */
  inviteDelayMs?: number;
  /** Tùy biến nhận diện thương hiệu của trợ lý */
  brand?: {
    assistantName: string;
    assistantRole: string;
    inviteTitle?: string;
    inviteBody?: string;
    avatarUrl?: string;
    primaryColor?: string;
    accentColor?: string;
  };
  /** Thông tin ưu đãi khi chuyển đổi */
  offer?: {
    productName: string;
    headline?: string;
    primaryCtaLabel?: string;
    primaryCtaUrl?: string;
  };
  /** Danh sách các node hội thoại */
  nodes: Record<string, VoiceFlowNode>;
}
```

### `VoiceFlowNode`
```typescript
export interface VoiceFlowNode {
  /** ID duy nhất của node */
  id: string;
  /** Tên file audio tương ứng (không bao gồm đuôi .wav) */
  audioId: string;
  /** Lời thoại bằng chữ (tự động chia phụ đề tối đa 2 dòng) */
  transcript: string;
  /** Giai đoạn chuyển đổi */
  stage: 'greeting' | 'qualify' | 'pain' | 'value' | 'demo' | 'objection' | 'offer' | 'closing';
  /** Tự động thu nhỏ HUD về góc khi đang demo (chỉ áp dụng cho stage: 'demo') */
  compactDuringDemo?: boolean;
  /** Hành động trực quan đồng bộ xuống trang web */
  visualAction?: VoiceVisualAction;
  /** Danh sách tối đa 2 lựa chọn (index 0 = Primary, index 1 = Secondary) */
  choices?: VoiceChoice[];
  /** Thẻ CTA chuyển đổi đặc biệt */
  cta?: {
    primaryLabel: string;
    primaryUrl: string;
    secondaryLabel?: string;
    secondaryNextNode?: string;
    badge?: string;
  };
}
```

### `VoiceVisualAction`
```typescript
export interface VoiceVisualAction {
  type:
    | 'scrollToSection'     // Cuộn trang tới phần tử mục tiêu
    | 'highlightArea'       // Làm nổi bật vùng chỉ định
    | 'openDemoScene'       // Chuyển cảnh trong màn hình demo
    | 'triggerDemoAction'   // Kích hoạt một hành động demo
    | 'setDemoStep'         // Đổi bước hướng dẫn trong demo
    | 'showOfferCard'       // Mở thẻ ưu đãi chốt sale
    | 'pulseCTA'            // Nháy sáng nút kêu gọi hành động
    | 'collapseToCorner'    // Thu nhỏ khung HUD về góc
    | 'customEvent';        // Phát sự kiện tùy chỉnh
  target?: string;
  scene?: string;
  action?: string;
  step?: number;
  payload?: Record<string, unknown>;
}
```

---

## 2. API Trình Duyệt Toàn Cục (`window.TodyVoice`)

Khi nhúng bundle `tody-voice-sales.js`, đối tượng `window.TodyVoice` được tạo tự động:

- `window.TodyVoice.init(config: VoiceProjectConfig): void`
  Khởi tạo và gắn HUD vào trang (sử dụng Shadow DOM hoàn toàn biệt lập).
- `window.TodyVoice.open(): void`
  Mở rộng khung HUD và bắt đầu phát âm node hiện tại.
- `window.TodyVoice.close(): void`
  Đóng khung HUD và dừng âm thanh.
- `window.TodyVoice.goToNode(nodeId: string): void`
  Chuyển thẳng tới một node hội thoại bất kỳ.
- `window.TodyVoice.stopAudio(): void`
  Dừng ngay lập tức âm thanh đang phát.

---

## 3. Các Sự Kiện Tùy Chỉnh (Custom DOM Events)

Lắng nghe trên `window`:

- `voice:action` / `tody:action`:
  Phát ra khi node hiện tại có cấu hình `visualAction`. Dữ liệu nằm trong `event.detail`.
- `voice:nodeChanged`:
  Phát ra khi người dùng chuyển sang một node mới.
- `voice:choiceSelected`:
  Phát ra khi người dùng bấm vào 1 trong 2 nút lựa chọn.
- `voice:stateChanged`:
  Phát ra khi trạng thái HUD thay đổi (`IDLE`, `INVITING`, `SPEAKING`, `WAITING_FOR_RESPONSE`).
