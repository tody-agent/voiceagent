#!/usr/bin/env node
/**
 * Voice Landing Agent — Project Initializer Script
 * Usage:
 *   node skills/voice-landing-agent/scripts/init-voice-landing.mjs --name="AcmeCloud" --role="Tư vấn & Trình diễn" --url="https://acme.dev"
 */
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [k, v] = arg.replace(/^--/, '').split('=');
    return [k, v || 'true'];
  })
);

const productName = args.name || 'Sản Phẩm Của Bạn';
const assistantRole = args.role || 'Tư vấn & Demo';
const ctaUrl = args.url || 'https://example.com/signup';
const outFile = path.resolve(process.cwd(), args.out || 'tody.config.json');

const generatedConfig = {
  projectId: productName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  locale: 'vi-VN',
  audioBaseUrl: '/audio/vi',
  initialNodeId: 'welcome',
  inviteDelayMs: 4000,
  brand: {
    assistantName: 'Tody Voice',
    assistantRole,
    inviteTitle: 'Chào bạn, mình là Tody 👋',
    inviteBody: `Nghe mình giới thiệu & trình diễn ${productName} trong 30 giây nhé?`,
    primaryColor: '#1D1D1F',
    accentColor: '#4A90E2',
  },
  offer: {
    productName,
    versionOrTier: 'Bản chính thức · Dùng thử 14 ngày',
    headline: `Trải nghiệm ${productName} ngay hôm nay`,
    summary: 'Khởi tạo tài khoản miễn phí trong 30 giây, không cần thẻ tín dụng.',
    primaryCtaLabel: `Bắt đầu với ${productName}`,
    primaryCtaUrl: ctaUrl,
  },
  nodes: {
    welcome: {
      id: 'welcome',
      audioId: 'welcome',
      transcript: `Chào bạn! Mình là Tody — trợ lý giọng nói AI của ${productName}. Mình có thể trình diễn trực tiếp sản phẩm trên màn hình hoặc gửi ưu đãi dùng thử trong 30 giây. Bạn muốn xem phần nào trước?`,
      stage: 'greeting',
      choices: [
        { id: 'c1', label: 'Xem trình diễn Demo trực tiếp', next: 'demo' },
        { id: 'c2', label: 'Nhận ưu đãi & dùng thử ngay', next: 'offer' },
      ],
    },
    demo: {
      id: 'demo',
      audioId: 'show_demo',
      transcript: `Tuyệt vời! Mình đang mở màn hình Demo tương tác của ${productName} ngay giữa trang. Bạn quan sát cách sản phẩm vận hành mượt mà nhé!`,
      stage: 'demo',
      compactDuringDemo: true,
      visualAction: {
        type: 'scrollToSection',
        target: 'interactive-demo-section',
      },
      choices: [
        { id: 'c3', label: `Bắt đầu dùng ${productName}`, next: 'offer' },
        { id: 'c4', label: 'Nghe lại từ đầu', next: 'welcome' },
      ],
    },
    offer: {
      id: 'offer',
      audioId: 'offer',
      transcript: `Bạn có thể bắt đầu trải nghiệm ${productName} hoàn toàn miễn phí ngay hôm nay. Chỉ cần bấm vào nút chính bên dưới để bắt đầu nhé!`,
      stage: 'offer',
      visualAction: {
        type: 'scrollToSection',
        target: 'download-cta-section',
      },
      cta: {
        primaryLabel: `Trải nghiệm ${productName} miễn phí`,
        primaryUrl: ctaUrl,
      },
      choices: [
        { id: 'c5', label: 'Xem lại màn hình Demo', next: 'demo' },
      ],
    },
  },
};

fs.writeFileSync(outFile, JSON.stringify(generatedConfig, null, 2), 'utf-8');
console.log(`✅ Đã khởi tạo cấu hình Voice Landing Agent tại: ${outFile}`);
