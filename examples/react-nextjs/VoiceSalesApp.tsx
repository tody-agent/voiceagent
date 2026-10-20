import React, { useState } from 'react';
import {
  VoiceSalesWidget,
  useConversation,
  InteractiveDemoContainer,
  type VoiceProjectConfig,
} from '../../packages/voice-sales-sdk/src/index.ts';

const DEMO_CONFIG: VoiceProjectConfig = {
  projectId: 'enterprise-analytics',
  locale: 'vi-VN',
  audioBaseUrl: '/audio/vi',
  brand: {
    assistantName: 'Tody Analytics',
    assistantRole: 'Chuyên gia Giải pháp',
    inviteTitle: 'Xin chào quý doanh nghiệp 👋',
    inviteBody: 'Khám phá giải pháp phân tích dữ liệu đa kênh trong 30 giây?',
    primaryColor: '#09090B',
    accentColor: '#2563EB',
  },
  offer: {
    productName: 'Enterprise Analytics Cloud',
    headline: 'Miễn phí tích hợp & dùng thử 30 ngày',
    primaryCtaLabel: 'Đặt lịch tư vấn chuyên sâu',
    primaryCtaUrl: 'https://example.com/demo-booking',
  },
  nodes: {
    welcome: {
      id: 'welcome',
      audioId: 'welcome',
      transcript: 'Kính chào quý anh chị! Em là Tody. Anh chị muốn xem trực tiếp bảng dashboard phân tích hay nhận báo giá doanh nghiệp?',
      stage: 'greeting',
      choices: [
        { id: 'c_dashboard', label: 'Xem trực tiếp Dashboard', next: 'dashboard_view' },
        { id: 'c_quote', label: 'Nhận báo giá doanh nghiệp', next: 'quote_view' },
      ],
    },
    dashboard_view: {
      id: 'dashboard_view',
      audioId: 'dashboard_view',
      transcript: 'Em đã mở màn hình báo cáo thời gian thực. Hệ thống tự động hợp nhất doanh thu từ các kênh bán lẻ chỉ trong một giây.',
      stage: 'demo',
      compactDuringDemo: true,
      visualAction: {
        type: 'openDemoScene',
        scene: 'realtime_revenue',
        target: 'interactive-demo-section',
      },
      choices: [
        { id: 'c_quote', label: 'Xem giải pháp giá', next: 'quote_view' },
        { id: 'c_restart', label: 'Nghe lại', next: 'welcome' },
      ],
    },
    quote_view: {
      id: 'quote_view',
      audioId: 'quote_view',
      transcript: 'Bên em đang hỗ trợ gói triển khai miễn phí cho một trăm doanh nghiệp đầu tiên trong tháng này. Anh chị bấm nút đặt lịch bên dưới nhé!',
      stage: 'offer',
      visualAction: {
        type: 'pulseCTA',
        target: 'cta-section',
      },
      choices: [
        { id: 'c_dashboard', label: 'Xem lại Dashboard', next: 'dashboard_view' },
      ],
    },
  },
};

export function VoiceSalesApp() {
  const [selectedDashboardTab, setSelectedDashboardTab] = useState<'revenue' | 'funnel' | 'retention'>('revenue');

  const conv = useConversation(DEMO_CONFIG, {
    onVisualAction: (action) => {
      console.log('Action received in parent:', action);
      if (action.type === 'openDemoScene' && action.scene) {
        if (action.scene === 'realtime_revenue') setSelectedDashboardTab('revenue');
      }
    },
  });

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#09090B]">
      {/* Hero */}
      <header className="py-20 text-center px-4 max-w-4xl mx-auto space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Nền tảng Quản trị & Phân tích Đa kênh
        </h1>
        <p className="text-base text-zinc-500">
          Tối ưu hóa doanh số và ra quyết định tức thì dựa trên dữ liệu thời gian thực.
        </p>
      </header>

      {/* Interactive Sandbox synchronized with Voice Agent */}
      <main className="max-w-4xl mx-auto px-4 pb-24">
        <InteractiveDemoContainer id="interactive-demo-section" defaultScene="overview">
          {({ activeScene }) => (
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
              <div className="flex gap-2 border-b border-zinc-100 pb-3">
                <button
                  onClick={() => setSelectedDashboardTab('revenue')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    selectedDashboardTab === 'revenue' || activeScene === 'realtime_revenue'
                      ? 'bg-zinc-900 text-white'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  Doanh thu thời gian thực
                </button>
                <button
                  onClick={() => setSelectedDashboardTab('funnel')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    selectedDashboardTab === 'funnel' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  Phễu chuyển đổi
                </button>
              </div>

              <div className="h-64 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 text-sm">
                Bảng biểu đồ động đang hiển thị chế độ: <strong className="ml-1 text-zinc-800">{selectedDashboardTab}</strong>
              </div>
            </div>
          )}
        </InteractiveDemoContainer>
      </main>

      {/* Embedded High-Converting Voice Sales Widget */}
      <VoiceSalesWidget {...conv} />
    </div>
  );
}
