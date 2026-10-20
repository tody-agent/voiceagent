# Hướng Dẫn VieNeu-TTS Studio & Voice Generation

**VieNeu-TTS v3 Turbo** là công nghệ tổng hợp giọng nói tiếng Việt thế hệ mới dựa trên kiến trúc Neural Acoustic & Vocoder tối ưu hóa bằng ONNX Runtime. Hệ thống cho phép xuất âm thanh chất lượng Studio 48kHz trực tiếp trên CPU / Apple Silicon MPS với tốc độ siêu nhanh (~0.5 RTF) mà không cần card đồ họa đắt tiền hay PyTorch cồng kềnh.

---

## 1. Thiết Lập Môi Trường (Setup Requirements)

### Yêu Cầu Phần Cứng & Phần Mềm:
- macOS (Apple Silicon M1/M2/M3/M4) hoặc Linux x86_64.
- Python 3.10+ (Khuyến nghị 3.11).
- `ffmpeg` (để nén MP3 và chuẩn hóa EBU R128).

### Cài Đặt Thư Viện Python Cần Thiết:
```bash
pip install onnxruntime numpy soundfile huggingface_hub librosa
```

---

## 2. Giọng Đọc Chủ Đạo: Adam (32 Tuổi)

- **Đặc trưng**: Nam miền Bắc, độ tuổi 32, chất giọng trầm ấm, trí tuệ, tự nhiên, nhịp điệu đĩnh đạc và pha chút hóm hỉnh.
- **Mục tiêu ứng dụng**: Đóng vai trò cố vấn công nghệ, chuyên gia bán hàng, người bạn đồng hành tin cậy trên landing page.
- **Tiêu chuẩn âm thanh xuất ra**:
  - Sample Rate: 48,000 Hz.
  - Loudness: -16.0 LUFS (EBU R128).
  - True Peak: -1.5 dBFS.

---

## 3. Cách Sử Dụng CLI Sinh Âm Thanh (CLI Usage)

```bash
# 1. Sinh toàn bộ file âm thanh từ file cấu hình dự án
node packages/voice-sales-sdk/tools/generate_voice_pack.mjs \
  --config=./tody.config.json \
  --out=./public/audio/vi \
  --voice=Adam

# 2. Bắt buộc tạo lại tất cả file (kể cả file đã có)
node packages/voice-sales-sdk/tools/generate_voice_pack.mjs \
  --config=./tody.config.json \
  --out=./public/audio/vi \
  --force=true
```

---

## 4. Kỷ Luật Viết Kịch Bản Đạt Độ Tự Nhiên Cao Nhất

Để VieNeu-TTS phát âm tự nhiên như người thật:
1. **Viết rõ số thành chữ tiếng Việt**:
   - Viết `ba mươi hai tuổi` thay vì `32 tuổi`.
   - Viết `ba mili giây` thay vì `3ms`.
   - Viết `hai chấm hai` thay vì `v2.2`.
   - Viết `bốn mươi tiếng` thay vì `40h`.
2. **Ngắt nhịp bằng dấu phẩy và dấu chấm hợp lý**:
   - VieNeu-TTS mô phỏng nhịp lấy hơi thở người thật dựa trên dấu `,` và `.`. Mỗi câu thoại nên ngắt từ 5–8 từ một nhịp.
3. **Độ dài mỗi clip**:
   - Lý tưởng từ 15 đến 35 từ (tương đương 6 đến 14 giây nói). Đây là ngưỡng vàng giữ chân người nghe trên web mà không gây mệt mỏi.
