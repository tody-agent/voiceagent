# Voice Assistant Configuration Schema & Type Reference

Tài liệu đặc tả toàn bộ kiểu dữ liệu TypeScript dùng cho cấu hình Voice Sales Assistant.

```typescript
export type VoiceStage =
  | 'greeting'    // Chào hỏi ban đầu
  | 'qualify'     // Xác định chân dung / phân loại khách hàng
  | 'pain'        // Nêu điểm đau / vấn đề khách gặp phải
  | 'value'       // Giá trị mang lại & giải pháp
  | 'demo'        // Trình diễn tính năng thực tế trên trang
  | 'objection'   // Giải tỏa băn khoăn (giá, bảo mật, tương thích)
  | 'offer'       // Chốt ưu đãi / mở liên kết tải về
  | 'closing';    // Lời chào kết thúc

export interface VoiceVisualAction {
  type:
    | 'scrollToSection'  // Cuộn trang mượt mà tới section mục tiêu
    | 'highlightArea'    // Sáng viền xung quanh section trong 3.2s
    | 'openDemoScene'    // Đổi cảnh hoặc tab trong màn hình Demo
    | 'playGestureDemo'  // Mô phỏng cử chỉ hoặc tính năng cụ thể
    | 'showOfferCard'    // Mở thẻ ưu đãi chốt đơn
    | 'pulseCTA'         // Nháy sáng nút kêu gọi hành động
    | 'collapseToCorner' // Thu nhỏ HUD về góc phải đáy màn hình
    | 'customEvent';     // Sự kiện tùy biến phát cho host page
  target?: string;
  scene?: string;
  gesture?: string;
  step?: number;
  payload?: Record<string, unknown>;
}

export interface VoiceChoice {
  id: string;
  label: string;       // Nhãn nút bấm (Tối đa 2 lựa chọn mỗi bước)
  next: string;        // ID của node tiếp theo sẽ chuyển sang
  tags?: Record<string, string | boolean>;
}

export interface VoiceNodeCTA {
  primaryLabel: string;
  primaryUrl: string;
  secondaryLabel?: string;
  secondaryNextNode?: string;
  badge?: string;
}

export interface VoiceFlowNode {
  id: string;
  audioId: string;
  transcript: string;
  stage: VoiceStage;
  choices: VoiceChoice[];       // Tối đa 2 lựa chọn (index 0 = Primary, index 1 = Secondary)
  compactDuringDemo?: boolean; // Thu nhỏ HUD khi vào demo
  visualAction?: VoiceVisualAction;
  cta?: VoiceNodeCTA;
}

export interface VoiceBrandConfig {
  assistantName: string;       // Tên trợ lý (ví dụ: "Tody Voice")
  assistantRole: string;       // Vai trò hiển thị (ví dụ: "Tư vấn & Trình diễn")
  inviteTitle: string;         // Lời chào ở bong bóng nổi
  inviteBody: string;          // Lời dẫn ngắn gợi ý bấm nghe
  primaryColor?: string;       // Màu nút chính (Mặc định: #1D1D1F)
  accentColor?: string;        // Màu sóng âm & điểm nhấn (Mặc định: #4A90E2)
}

export interface VoiceProductOffer {
  productName: string;
  versionOrTier?: string;
  headline: string;
  summary: string;
  primaryCtaLabel: string;
  primaryCtaUrl: string;
}

export interface VoiceAssistantConfig {
  projectId: string;
  locale?: string;             // Mặc định: 'vi-VN'
  audioBaseUrl?: string;       // Mặc định: '/audio/vi'
  initialNodeId?: string;      // Mặc định: 'welcome'
  inviteDelayMs?: number;      // Độ trễ hiện lời mời (Mặc định: 4000ms, -1 để tắt)
  brand: VoiceBrandConfig;
  offer: VoiceProductOffer;
  nodes: Record<string, VoiceFlowNode>;
}
```
