# Hướng Dẫn Kỹ Thuật VieNeu-TTS v3 Turbo Cho Voice Landing Agent

VieNeu-TTS là mô hình tổng hợp giọng nói tiếng Việt hiện đại, nhẹ, chất lượng cao 48kHz, chạy hoàn toàn bằng **ONNX Runtime trên CPU** (~0.5 RTF trên Apple Silicon M-series) mà không cần cài đặt PyTorch nặng nề.

Repo gốc: [https://github.com/pnnbao97/VieNeu-TTS](https://github.com/pnnbao97/VieNeu-TTS)
Model weights: [https://huggingface.co/pnnbao-ump/VieNeu-TTS-v3-Turbo](https://huggingface.co/pnnbao-ump/VieNeu-TTS-v3-Turbo)

---

## 1. Cài Đặt Môi Trường

Chỉ cần cài đặt các thư viện Python tối giản:
```bash
pip install vieneu soundfile huggingface_hub
```
*Lưu ý: Bắt buộc cài đặt `ffmpeg` trên máy để xử lý cắt khoảng lặng và chuẩn hóa âm lượng EBU R128:*
```bash
brew install ffmpeg
```

---

## 2. Danh Sách Giọng Đọc Sẵn Có (Preset Voices)

- **`Adam` (Khuyến nghị cho Tody)**: Giọng nam 32 tuổi, âm vực trung-trầm, phong cách đĩnh đạc, hài hước, tự nhiên.
- **`Hai_Dang`**: Giọng nam miền Bắc tự nhiên, truyền cảm.
- **`Mai_Anh`**: Giọng nữ miền Bắc thanh lịch, phong cách bản tin/thuyết trình.

---

## 3. Quy Trình Xử Lý Âm Thanh Chuẩn Studio (Audio Pipeline)

Trong worker `vieneu_tts_worker.py`, mỗi file âm thanh sau khi mô hình infer sẽ đi qua bộ lọc ffmpeg chuyên nghiệp:
1. **Cắt khoảng lặng đầu & cuối (Silence Removal)**: Triệt tiêu hoàn toàn độ trễ vô nghĩa ở đầu câu:
   ```
   silenceremove=start_periods=1:start_silence=0.01:start_threshold=-50dB,
   areverse,
   silenceremove=start_periods=1:start_silence=0.01:start_threshold=-50dB,
   areverse
   ```
2. **Chuẩn Hóa Âm Lượng Chuẩn Phát Thanh EBU R128 (`loudnorm`)**:
   - `I = -16.0 LUFS` (âm lượng chuẩn podcast/web streaming)
   - `TP = -1.5 dB` (chống méo tiếng khi phát trên loa điện thoại/laptop)
   - `LRA = 7.0` (dải động tự nhiên)
3. **Xuất Định Dạng Kép (Dual Export)**:
   - **File `.wav`**: 24kHz/48kHz 16-bit Mono (Master audio phục vụ Web Audio API waveform analysis).
   - **File `.mp3`**: VBR Quality 4 siêu nhẹ (~50–80KB cho clip 10 giây), tải cực nhanh trên mạng di động 4G/5G.

---

## 4. Chạy Worker Và Lệnh Tổng Hợp

```bash
# Lệnh tổng hợp tự động dựa trên file cấu hình
node skills/voice-landing-agent/scripts/generate-voice-pack.mjs --config=./tody.config.json --out=./public/audio/vi --voice=Adam
```

Toàn bộ clip sẽ được đánh mã băm MD5 và lưu vào `public/audio/vi/manifest.json`. Trình duyệt web sẽ tự động nạp file `.wav` / `.mp3`, hoặc chuyển mượt sang Web Speech API nếu thiết bị đang ngoại tuyến.
