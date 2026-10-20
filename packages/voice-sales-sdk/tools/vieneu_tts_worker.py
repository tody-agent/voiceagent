#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VieNeu-TTS v3 Turbo Worker for Tody AI.
Repo: https://github.com/pnnbao97/VieNeu-TTS
Lightweight, torch-free ONNX Runtime CPU inference (~0.5 RTF) with 48kHz audio quality.
Default persona voice: 'Adam' (32yo Witty & Intelligent AI Advisor).
"""

import glob
import json
import os
import shutil
import subprocess
import sys
import tempfile
import traceback
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")
sys.stdin.reconfigure(encoding="utf-8")

# Separate JSON-lines protocol channel from stdout to prevent library logs from corrupting JSON
_protocol_fd = os.dup(1)
os.dup2(2, 1)
_protocol = os.fdopen(_protocol_fd, "w", encoding="utf-8", newline="\n")


def log(msg: str) -> None:
    print(f"[vieneu-tts] {msg}", file=sys.stderr, flush=True)


def respond(obj: dict) -> None:
    _protocol.write(json.dumps(obj, ensure_ascii=False) + "\n")
    _protocol.flush()


def find_ffmpeg() -> str:
    for candidate in ("/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "ffmpeg"):
        if os.path.exists(candidate) or candidate == "ffmpeg":
            return candidate
    return "ffmpeg"


def ensure_onnx_model_dir() -> str:
    """
    Ensures ONNX model files are physically dereferenced into ~/.cache/vieneu_models/onnx_update
    to prevent ONNXRuntime's 'External data path escapes model directory' error on symlinks.
    """
    target_dir = Path.home() / ".cache" / "vieneu_models" / "onnx_update"
    target_dir.mkdir(parents=True, exist_ok=True)

    required_files = [
        "config.json",
        "tokenizer.json",
        "vieneu_acoustic_cached.onnx",
        "vieneu_backbone_shared.data",
        "vieneu_decode_step.onnx",
        "vieneu_prefill.onnx",
        "vieneu_v3_heads.npz",
    ]

    all_exist = all((target_dir / f).exists() and not (target_dir / f).is_symlink() for f in required_files)
    if not all_exist:
        log("Populating dereferenced ONNX model directory to prevent symlink errors...")
        from huggingface_hub import hf_hub_download

        repo = "pnnbao-ump/VieNeu-TTS-v3-Turbo"
        subfolder = "onnx_update"

        for fname in required_files:
            dest = target_dir / fname
            if not dest.exists() or dest.is_symlink():
                log(f"Downloading {fname}...")
                cached_path = hf_hub_download(repo, fname, repo_type="model", subfolder=subfolder)
                if dest.exists() or dest.is_symlink():
                    dest.unlink()
                shutil.copy2(os.path.realpath(cached_path), dest)

    # Also dereference MOSS Audio Tokenizer ONNX files so ONNXRuntime does not fail on HF cache symlinks
    codec_dir = Path.home() / ".cache" / "vieneu_models" / "codec_onnx"
    codec_dir.mkdir(parents=True, exist_ok=True)
    codec_files = [
        "moss_audio_tokenizer_decode_full.onnx",
        "moss_audio_tokenizer_decode_shared.data",
        "moss_audio_tokenizer_decode_step.onnx",
        "codec_browser_onnx_meta.json",
        "moss_audio_tokenizer_encode.onnx",
        "moss_audio_tokenizer_encode.data",
    ]
    codec_exist = all((codec_dir / f).exists() and not (codec_dir / f).is_symlink() for f in codec_files)
    if not codec_exist:
        log("Populating dereferenced MOSS Codec ONNX directory to prevent symlink errors...")
        from huggingface_hub import hf_hub_download

        codec_repo = "OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX"
        for fname in codec_files:
            dest = codec_dir / fname
            if not dest.exists() or dest.is_symlink():
                try:
                    cached_path = hf_hub_download(codec_repo, fname, repo_type="model")
                    if dest.exists() or dest.is_symlink():
                        dest.unlink()
                    shutil.copy2(os.path.realpath(cached_path), dest)
                except Exception as exc:
                    if not fname.endswith(".json"):
                        raise exc

    try:
        from vieneu._v3_turbo_engine.onnx_runtime_lite import OnnxV3LiteEngine

        orig_fetch = OnnxV3LiteEngine._fetch

        @staticmethod
        def _patched_fetch(repo: str, files: list, subfolder=None):
            if "MOSS-Audio-Tokenizer" in str(repo):
                return codec_dir
            return orig_fetch(repo, files, subfolder)

        OnnxV3LiteEngine._fetch = _patched_fetch
    except Exception as exc:
        log(f"Warning patching OnnxV3LiteEngine._fetch: {exc}")

    return str(target_dir)


_tts = None


def get_tts():
    global _tts
    if _tts is not None:
        return _tts

    from vieneu import Vieneu

    onnx_dir = ensure_onnx_model_dir()
    log(f"Loading VieNeu v3 Turbo from {onnx_dir} (ONNX Runtime, Torch-Free)...")
    _tts = Vieneu(onnx_dir=onnx_dir)
    log("VieNeu v3 Turbo initialized successfully.")
    return _tts


def handle_ping() -> None:
    respond(
        {
            "ok": True,
            "engine": "vieneu-v3-turbo",
            "voice": "adam",
            "persona": "Tody (32 tuổi, hài hước, thông minh)",
            "github": "https://github.com/pnnbao97/VieNeu-TTS",
        }
    )


def handle_list_voices() -> None:
    try:
        tts = get_tts()
        voices = tts.list_preset_voices()
        respond({"ok": True, "voices": voices})
    except Exception as exc:
        respond({"ok": False, "error": str(exc)})


def handle_synth(req: dict) -> None:
    import soundfile as sf

    text = (req.get("text") or "").strip()
    out_wav = req.get("out_wav")
    voice_name = req.get("voice") or "Adam"
    target_sr = int(req.get("sample_rate") or 24000)

    if not text:
        respond({"ok": False, "error": "Empty text"})
        return
    if not out_wav:
        respond({"ok": False, "error": "Missing out_wav"})
        return

    # Normalize voice alias
    if voice_name.lower() in ("adam", "adam bựa"):
        resolved_voice = "Adam"
    else:
        resolved_voice = voice_name

    try:
        tts = get_tts()
        native_sr = getattr(tts, "sample_rate", 48000)
        audio = tts.infer(text, voice=resolved_voice)

        out_path = Path(out_wav).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            raw_wav = tmp.name

        try:
            sf.write(raw_wav, audio, native_sr, subtype="PCM_16")
            ffmpeg_bin = find_ffmpeg()
            # 1. Trim dead silence at start & end + EBU R128 loudness normalization (-16 LUFS, True Peak -1.5dB)
            audio_filter = (
                "silenceremove=start_periods=1:start_silence=0.01:start_threshold=-50dB,"
                "areverse,silenceremove=start_periods=1:start_silence=0.01:start_threshold=-50dB,areverse,"
                "loudnorm=I=-16.0:TP=-1.5:LRA=7.0"
            )

            # Generate 24kHz 16-bit PCM WAV (Master fidelity)
            cmd_wav = [
                ffmpeg_bin,
                "-y",
                "-i",
                raw_wav,
                "-af",
                audio_filter,
                "-ar",
                str(target_sr),
                "-ac",
                "1",
                "-c:a",
                "pcm_s16le",
                str(out_path),
            ]
            subprocess.run(
                cmd_wav,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=True,
            )

            # Generate high-efficiency 24kHz MP3 VBR (~70KB fast streaming web payload)
            out_mp3 = out_path.with_suffix(".mp3")
            cmd_mp3 = [
                ffmpeg_bin,
                "-y",
                "-i",
                raw_wav,
                "-af",
                audio_filter,
                "-ar",
                str(target_sr),
                "-ac",
                "1",
                "-c:a",
                "libmp3lame",
                "-q:a",
                "4",
                str(out_mp3),
            ]
            subprocess.run(
                cmd_mp3,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=True,
            )
        finally:
            if os.path.exists(raw_wav):
                try:
                    os.remove(raw_wav)
                except OSError:
                    pass

        info = sf.info(str(out_path))
        wav_size = os.path.getsize(str(out_path))
        mp3_size = os.path.getsize(str(out_mp3)) if out_mp3.exists() else 0

        respond(
            {
                "ok": True,
                "out_wav": str(out_path),
                "out_mp3": str(out_mp3),
                "duration_sec": round(float(info.duration), 2),
                "sample_rate": int(info.samplerate),
                "wav_size_bytes": wav_size,
                "mp3_size_bytes": mp3_size,
                "voice": resolved_voice.lower(),
                "model": "VieNeu-v3-Turbo",
                "source": "vieneu_tts",
            }
        )
    except Exception as exc:
        log(f"Synth error: {traceback.format_exc()}")
        respond({"ok": False, "error": str(exc)})


def main() -> None:
    log("VieNeu-TTS Worker started. Waiting for JSON-lines commands...")
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except Exception:
            respond({"ok": False, "error": "Invalid JSON"})
            continue

        cmd = req.get("cmd")
        if cmd == "ping":
            handle_ping()
        elif cmd == "synth":
            handle_synth(req)
        elif cmd == "list_voices":
            handle_list_voices()
        elif cmd == "exit":
            respond({"ok": True})
            os._exit(0)
        else:
            respond({"ok": False, "error": f"Unknown cmd: {cmd}"})
    os._exit(0)


if __name__ == "__main__":
    main()
