# Bảng Tra Cứu Sự Kiện Đồng Bộ DOM (`voice:action` & `tody:action`)

Mỗi khi Voice Sales Assistant phát một câu nói hoặc chuyển bước có khai báo `visualAction`, hệ thống sẽ tự động phát 2 sự kiện DOM chuẩn:
1. `window.dispatchEvent(new CustomEvent('voice:action', { detail: action, bubbles: true }))`
2. `window.dispatchEvent(new CustomEvent('tody:action', { detail: action, bubbles: true }))`

---

## 1. Danh Sách Các Loại Hành Động (Action Types)

| Action Type | Ý Nghĩa | Tham Số Kèm Theo | Hành Động Mặc Định Của SDK |
| :--- | :--- | :--- | :--- |
| `scrollToSection` | Cuộn trang tới vùng chỉ định | `target`: string (id hoặc data-voice-target) | Tự động gọi `element.scrollIntoView({ behavior: 'smooth', block: 'center' })` |
| `highlightArea` | Tạo hiệu ứng viền sáng xanh quanh section | `target`: string | Tự động thêm class `.tody-highlight-ring` trong 3.2 giây |
| `openDemoScene` | Đổi cảnh/tab trong màn hình Demo | `scene`: string | Phát sự kiện để host page hoặc `<InteractiveDemoContainer>` chuyển tab |
| `playGestureDemo` | Minh họa một thao tác/cử chỉ cụ thể | `scene`: string, `gesture`: string, `step`: number | Kích hoạt chuỗi animation minh họa trong sandbox demo |
| `showOfferCard` | Mở trực tiếp thẻ chốt đơn | `target`: string (tùy chọn) | Đổi giao diện HUD từ danh sách lựa chọn sang Thẻ Ưu Đãi có nút mua/tải |
| `pulseCTA` | Nháy sáng nút kêu gọi hành động chính | `target`: string | Cuộn tới nút và thêm hiệu ứng nhấp nháy thu hút sự chú ý |
| `collapseToCorner`| Thu nhỏ HUD xuống góc phải | Không | Tự động chuyển widget sang chế độ Compact Companion (`sm:w-[388px]`) |
| `customEvent` | Sự kiện nghiệp vụ riêng của dự án | `payload`: object | Chuyển toàn bộ payload cho host page xử lý theo logic riêng |

---

## 2. Cách Lắng Nghe Trong Dự Án Host

### JavaScript thuần / WordPress / Shopify / Webflow:
```javascript
window.addEventListener('voice:action', function (event) {
  const action = event.detail;
  console.log('Voice Action nhận được:', action);

  if (action.type === 'openDemoScene') {
    // Đổi tab trong bộ demo của bạn:
    myDemoTabs.switchTab(action.scene);
  }

  if (action.type === 'pulseCTA') {
    const ctaBtn = document.querySelector('#download-btn');
    if (ctaBtn) {
      ctaBtn.classList.add('ring-4', 'ring-blue-500', 'animate-pulse');
      setTimeout(() => ctaBtn.classList.remove('ring-4', 'ring-blue-500', 'animate-pulse'), 3000);
    }
  }
});
```

### React / Next.js:
```tsx
import { useEffect } from 'react';

export function DemoComponent() {
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail.type === 'openDemoScene') {
        setActiveTab(e.detail.scene);
      }
    };
    window.addEventListener('voice:action' as any, handler);
    return () => window.removeEventListener('voice:action' as any, handler);
  }, []);

  return <div>{/* Demo content */}</div>;
}
```
Hoặc đơn giản dùng component bọc sẵn `<InteractiveDemoContainer>`:
```tsx
<InteractiveDemoContainer id="interactive-demo-section">
  {({ activeScene, setActiveScene }) => (
    <div>Tab hiện tại do Voice Agent điều khiển: {activeScene}</div>
  )}
</InteractiveDemoContainer>
```
