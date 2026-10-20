import type { VoiceAssistantConfig } from '../../../packages/voice-sales-sdk/src/types.ts';

/**
 * Cấu hình mẫu cho Voice Sales Assistant trong dự án mới.
 * Quy tắc: Mỗi node chỉ có tối đa 2 lựa chọn (index 0: Nút chính, index 1: Nút phụ).
 */
export const starterVoiceConfig: VoiceAssistantConfig = {
  projectId: 'my-saas-product',
  locale: 'vi-VN',
  audioBaseUrl: '/audio/vi',
  initialNodeId: 'welcome',
  inviteDelayMs: 4000,
  brand: {
    assistantName: 'Tody Voice',
    assistantRole: 'Tư vấn & Trình diễn',
    inviteTitle: 'Chào bạn, mình là Tody 👋',
    inviteBody: 'Nghe mình giới thiệu & trình diễn sản phẩm trong 30 giây nhé?',
    primaryColor: '#1D1D1F',
    accentColor: '#4A90E2',
  },
  offer: {
    productName: 'Tên Sản Phẩm Của Bạn',
    versionOrTier: 'Gói Pro · Dùng thử 14 ngày',
    headline: 'Tăng 3x hiệu suất làm việc ngay hôm nay',
    summary: 'Khởi tạo tài khoản miễn phí trong 30 giây, không cần thẻ tín dụng.',
    primaryCtaLabel: 'Bắt đầu dùng thử miễn phí',
    primaryCtaUrl: 'https://your-product.com/signup',
  },
  nodes: {
    welcome: {
      id: 'welcome',
      audioId: 'welcome',
      transcript:
        'Chào bạn! Mình là Tody — trợ lý giọng nói AI. Mình có thể trình diễn trực tiếp sản phẩm trên màn hình hoặc báo giá nhanh trong 30 giây. Bạn muốn xem phần nào trước?',
      stage: 'greeting',
      choices: [
        {
          id: 'choice_demo',
          label: 'Xem trình diễn Demo trực tiếp',
          next: 'product_demo',
        },
        {
          id: 'choice_pricing',
          label: 'Xem ưu đãi & dùng thử ngay',
          next: 'special_offer',
        },
      ],
    },
    product_demo: {
      id: 'product_demo',
      audioId: 'show_demo',
      transcript:
        'Mình đang mở màn hình Demo tương tác ngay trước mắt bạn. Bạn có thể bấm thử từng tab tính năng và nghe mình thuyết minh song song.',
      stage: 'demo',
      compactDuringDemo: true,
      visualAction: {
        type: 'scrollToSection',
        target: 'interactive-demo-section',
      },
      choices: [
        {
          id: 'demo_to_offer',
          label: 'Nhận ưu đãi dùng thử ngay',
          next: 'special_offer',
        },
        {
          id: 'demo_restart',
          label: 'Nghe lại giới thiệu từ đầu',
          next: 'welcome',
        },
      ],
    },
    special_offer: {
      id: 'special_offer',
      audioId: 'offer',
      transcript:
        'Bạn có thể bắt đầu trải nghiệm miễn phí ngay hôm nay chỉ với một cú nhấp chuột vào nút chính bên dưới.',
      stage: 'offer',
      visualAction: {
        type: 'scrollToSection',
        target: 'download-cta-section',
      },
      cta: {
        primaryLabel: 'Bắt đầu dùng thử miễn phí',
        primaryUrl: 'https://your-product.com/signup',
      },
      choices: [
        {
          id: 'offer_back_demo',
          label: 'Xem lại màn hình Demo',
          next: 'product_demo',
        },
      ],
    },
  },
};
