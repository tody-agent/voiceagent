# Hướng Dẫn Tích Hợp Đa Nền Tảng (Multi-Platform Integration Guide)

Tody Voice Agent được thiết kế với 2 hình thức triển khai linh hoạt:
1. **Standalone Script (`tody-voice-sales.js`)**: Nhúng vào mọi website (HTML, WordPress, Shopify, Webflow, PHP, Laravel) mà không cần cài đặt build tool hay npm.
2. **NPM Package (`@tody/voice-sales-sdk`)**: Nhúng chuyên sâu vào các ứng dụng React, Next.js, Vue, Nuxt với TypeScript đầy đủ.

---

## 1. Phương Án 1: Nhúng Mọi Website Bằng Script Tag

### Bước 1: Nhúng Bundle SDK
Nhúng file `tody-voice-sales.js` vào cuối thẻ `<body>`:

```html
<script src="https://cdn.yourdomain.com/sdk/tody-voice-sales.js"></script>
```

### Bước 2: Khởi Tạo Trợ Lý Bằng JavaScript
```html
<script>
  window.TodyVoice.init({
    projectId: 'my-website-project',
    locale: 'vi-VN',
    audioBaseUrl: '/audio/vi',
    inviteDelayMs: 3000,
    brand: {
      assistantName: 'Tody Voice',
      assistantRole: 'Cố vấn Bán hàng AI',
      inviteTitle: 'Chào bạn 👋',
      inviteBody: 'Nghe mình tóm tắt tính năng sản phẩm trong 30 giây nhé?',
      primaryColor: '#18181B',
      accentColor: '#2563EB'
    },
    offer: {
      productName: 'Tên Sản Phẩm Của Bạn',
      headline: 'Ưu đãi dùng thử 14 ngày',
      primaryCtaLabel: 'Đăng ký ngay hôm nay',
      primaryCtaUrl: 'https://yourdomain.com/register'
    },
    nodes: {
      welcome: {
        id: 'welcome',
        audioId: 'welcome',
        transcript: 'Chào bạn! Mình là Tody. Bạn muốn xem màn hình biểu diễn tính năng hay xem chính sách giá ưu đãi?',
        stage: 'greeting',
        choices: [
          { id: 'c_demo', label: 'Xem trình diễn Demo', next: 'demo_scene' },
          { id: 'c_price', label: 'Xem bảng giá ưu đãi', next: 'price_scene' }
        ]
      },
      demo_scene: {
        id: 'demo_scene',
        audioId: 'demo_scene',
        transcript: 'Mình đang mở màn hình trực quan để bạn theo dõi tính năng thực tế nhé!',
        stage: 'demo',
        compactDuringDemo: true,
        visualAction: { type: 'scrollToSection', target: 'demo-section' },
        choices: [
          { id: 'c_price', label: 'Xem bảng giá', next: 'price_scene' },
          { id: 'c_back', label: 'Nghe lại', next: 'welcome' }
        ]
      },
      price_scene: {
        id: 'price_scene',
        audioId: 'price_scene',
        transcript: 'Chương trình ưu đãi giảm ba mươi phần trăm cho người dùng mới đăng ký tuần này!',
        stage: 'offer',
        visualAction: { type: 'pulseCTA', target: 'pricing-table' },
        choices: [
          { id: 'c_demo', label: 'Xem lại Demo', next: 'demo_scene' }
        ]
      }
    }
  });
</script>
```

### Bước 3: Lắng Nghe Sự Kiện Hai Chiều (DOM Sync)
```javascript
window.addEventListener('voice:action', function (event) {
  const action = event.detail;
  console.log('Voice Action triggered:', action);

  if (action.type === 'scrollToSection') {
    const el = document.getElementById(action.target);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  if (action.type === 'pulseCTA') {
    const cta = document.getElementById(action.target);
    if (cta) cta.classList.add('animate-bounce');
  }
});
```

---

## 2. Phương Án 2: Tích Hợp Vào React / Next.js (App Router & Pages Router)

### Cài đặt package
```bash
npm install @tody/voice-sales-sdk
# hoặc
pnpm add @tody/voice-sales-sdk
```

### Triển khai trong Component
```tsx
import React from 'react';
import {
  VoiceSalesWidget,
  useConversation,
  InteractiveDemoContainer,
  type VoiceProjectConfig
} from '@tody/voice-sales-sdk';

const myVoiceConfig: VoiceProjectConfig = {
  projectId: 'my-saas-app',
  locale: 'vi-VN',
  audioBaseUrl: '/audio/vi',
  nodes: {
    /* Khai báo kịch bản các node */
  }
};

export default function LandingPage() {
  const conv = useConversation(myVoiceConfig, {
    onVisualAction: (action) => {
      console.log('Action received:', action);
    }
  });

  return (
    <div className="relative min-h-screen">
      {/* 1. Màn hình Demo tương tác 2 chiều */}
      <InteractiveDemoContainer id="demo-section">
        {({ activeScene, step }) => (
          <div className="p-8 border rounded-2xl">
            <h2 className="text-xl font-bold">Cảnh hiện tại: {activeScene}</h2>
          </div>
        )}
      </InteractiveDemoContainer>

      {/* 2. Khung HUD Trợ lý Giọng nói Bán hàng */}
      <VoiceSalesWidget {...conv} />
    </div>
  );
}
```

---

## 3. Tích Hợp Vào WordPress / WooCommerce

1. Mở trang quản trị WordPress -> **Appearance** -> **Theme File Editor** (hoặc dùng plugin **WPCode / Header and Footer Scripts**).
2. Dán mã nhúng của Phương án 1 vào trước thẻ đóng `</body>`.
3. Tải thư mục audio âm thanh lên `/wp-content/uploads/voice-audio/` và đặt `audioBaseUrl: '/wp-content/uploads/voice-audio'`.

---

## 4. Tích Hợp Vào Shopify Storefront

1. Mở Shopify Admin -> **Online Store** -> **Themes** -> **Actions** -> **Edit code**.
2. Chọn file `theme.liquid`.
3. Chèn link file SDK vào thẻ `<head>` hoặc trước `</body>`.
4. Gắn các thuộc tính mục tiêu cho trang sản phẩm:
   - Thêm thuộc tính `data-voice-target="cta"` vào nút Add to cart.
   - Thêm `id="product-specs"` vào bảng thông số kỹ thuật để trợ lý tự động cuộn đến khi khách hỏi về chất liệu/bảo hành.
