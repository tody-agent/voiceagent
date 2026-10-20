#!/usr/bin/env node
/**
 * Voice Landing Agent — DOM & Section Audit Tool
 * Scans an HTML or React/TSX file to verify that key conversion sections
 * have target anchors for Voice Sales synchronization.
 *
 * Usage:
 *   node audit-landing-dom.mjs --file=src/App.tsx
 */
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [k, v] = arg.replace(/^--/, '').split('=');
    return [k, v || 'true'];
  })
);

const targetFile = path.resolve(process.cwd(), args.file || 'index.html');

if (!fs.existsSync(targetFile)) {
  console.error(`❌ Không tìm thấy file: ${targetFile}`);
  process.exit(1);
}

const content = fs.readFileSync(targetFile, 'utf-8');

const TARGET_SECTIONS = [
  {
    name: 'Hero Section',
    tag: 'hero',
    idRegex: /id=["'](?:hero|hero-section)["']/i,
    dataRegex: /data-voice-target=["']hero["']/i,
    recommendation: 'Thêm id="hero-section" hoặc data-voice-target="hero" vào thẻ container của Hero.',
  },
  {
    name: 'Interactive Demo Section',
    tag: 'demo',
    idRegex: /id=["'](?:demo|interactive-demo|interactive-demo-section)["']/i,
    dataRegex: /data-voice-target=["']demo["']/i,
    recommendation: 'Thêm id="interactive-demo-section" hoặc data-voice-target="demo" vào container phần Demo.',
  },
  {
    name: 'Features / Benefits Section',
    tag: 'features',
    idRegex: /id=["'](?:features|benefits|features-section)["']/i,
    dataRegex: /data-voice-target=["']features["']/i,
    recommendation: 'Thêm id="features-section" hoặc data-voice-target="features" vào phần ma trận tính năng.',
  },
  {
    name: 'Pricing / Offer Section',
    tag: 'offer',
    idRegex: /id=["'](?:pricing|offer|pricing-section)["']/i,
    dataRegex: /data-voice-target=["']offer["']/i,
    recommendation: 'Thêm id="pricing-section" hoặc data-voice-target="offer" vào khu vực báo giá/ưu đãi.',
  },
  {
    name: 'Primary CTA / Download Section',
    tag: 'cta',
    idRegex: /id=["'](?:cta|download|cta-section|download-cta-section)["']/i,
    dataRegex: /data-voice-target=["']cta["']/i,
    recommendation: 'Thêm id="download-cta-section" hoặc data-voice-target="cta" vào nút kêu gọi hành động cuối trang.',
  },
];

const hasVoiceWidget =
  content.includes('tody-voice-sales.js') ||
  content.includes('tody-ai-sales.js') ||
  content.includes('VoiceSalesWidget') ||
  content.includes('TodyWidget') ||
  content.includes('voice-sales-assistant');

console.log(`\n🔍 KIỂM TOÁN CẤU TRÚC DOM CHO VOICE AGENT: ${targetFile}\n${'='.repeat(60)}`);

let passedCount = 0;
const missing = [];

for (const sec of TARGET_SECTIONS) {
  const hasId = sec.idRegex.test(content);
  const hasData = sec.dataRegex.test(content);
  if (hasId || hasData) {
    console.log(`  ✓ ${sec.name}: Đã có anchor (${hasData ? 'data-voice-target' : 'id'})`);
    passedCount++;
  } else {
    console.log(`  ✗ ${sec.name}: Chưa có anchor đồng bộ`);
    missing.push(sec);
  }
}

console.log(`  ${hasVoiceWidget ? '✓' : '✗'} Voice Sales Widget: ${hasVoiceWidget ? 'Đã được nhúng' : 'Chưa được nhúng vào file'}`);

console.log(`\n📊 KẾT QUẢ: ${passedCount}/${TARGET_SECTIONS.length} vùng mục tiêu đã sẵn sàng.`);

if (missing.length > 0) {
  console.log(`\n💡 HƯỚNG DẪN BỔ SUNG ĐỂ HOÀN THIỆN:`);
  for (const m of missing) {
    console.log(`  - ${m.name}: ${m.recommendation}`);
  }
}

if (!hasVoiceWidget) {
  console.log(`  - Nhúng Widget: Thêm <script src="/sdk/tody-voice-sales.js"></script> hoặc import <VoiceSalesWidget />.`);
}
console.log('');
