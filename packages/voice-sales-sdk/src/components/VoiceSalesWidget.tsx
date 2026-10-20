import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  Headphones,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  Sparkles,
} from 'lucide-react';
import type {
  VoiceAssistantConfig,
  VoiceChoice,
  VoiceFlowNode,
  VoiceWidgetState,
} from '../types.ts';
import { AudioWaveform } from './AudioWaveform.tsx';
import { VoiceCaption } from './VoiceCaption.tsx';
import { QuickReplies } from './QuickReplies.tsx';
import { OfferCard } from './OfferCard.tsx';
import { StageProgressBar } from './StageProgressBar.tsx';

export interface VoiceSalesWidgetProps {
  config: VoiceAssistantConfig;
  currentNode: VoiceFlowNode;
  widgetState: VoiceWidgetState;
  isExpanded: boolean;
  isCompactCompanion: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  playbackProgress: number;
  audioLevels?: number[];
  onStartVoice: () => void;
  onDismissInvite?: () => void;
  onSelectChoice: (choice: VoiceChoice) => void;
  onSkipSpeech?: () => void;
  onRestart?: () => void;
  onToggleMute?: () => void;
  onClose?: () => void;
  onExpandFromCompact?: () => void;
  onSetCompact?: (compact: boolean) => void;
}

export const VoiceSalesWidget: React.FC<VoiceSalesWidgetProps> = ({
  config,
  currentNode,
  widgetState,
  isExpanded,
  isCompactCompanion,
  isPlaying,
  isMuted,
  playbackProgress,
  audioLevels = [0.2, 0.4, 0.7, 0.5, 0.3],
  onStartVoice,
  onDismissInvite,
  onSelectChoice,
  onSkipSpeech,
  onRestart,
  onToggleMute,
  onClose,
  onExpandFromCompact,
  onSetCompact,
}) => {
  const brand = config.brand;
  const showOfferCard =
    currentNode.stage === 'offer' ||
    Boolean(currentNode.cta) ||
    currentNode.id.includes('offer');

  // Choices clamped strictly to max 2 items (1 Primary + 1 Secondary)
  const choices = (currentNode.choices || []).slice(0, 2);

  // 1. COMPACT HUD MODE (During interactive demo)
  if (isExpanded && isCompactCompanion) {
    return (
      <aside
        className="fixed right-4 bottom-4 z-50 w-[min(90vw,388px)] bg-white/95 backdrop-blur-xl border border-[#1D1D1F]/15 rounded-2xl shadow-2xl p-3 space-y-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200"
        role="region"
        aria-label="Trợ lý giọng nói đồng hành Demo"
      >
        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#1D1D1F]/[0.08]">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isPlaying && !isMuted ? 'bg-[#4A90E2] animate-pulse' : 'bg-[#7BC9B2]'
              }`}
            />
            <span className="text-xs font-bold text-[#1D1D1F] truncate">
              {brand.assistantName}
            </span>
            <AudioWaveform
              levels={audioLevels}
              isPlaying={isPlaying}
              isMuted={isMuted}
              activeColor={brand.accentColor}
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onToggleMute && (
              <button
                type="button"
                onClick={onToggleMute}
                className="p-1 rounded-lg hover:bg-[#F3F4F1] text-[#6E6E73] hover:text-[#1D1D1F] transition-colors cursor-pointer"
                title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            )}
            {onExpandFromCompact && (
              <button
                type="button"
                onClick={onExpandFromCompact}
                className="px-2 py-0.5 rounded-lg bg-[#F3F4F1] hover:bg-[#E5E6E1] text-[11px] font-semibold text-[#1D1D1F] transition-colors cursor-pointer"
              >
                Mở rộng
              </button>
            )}
          </div>
        </div>

        <VoiceCaption
          transcript={currentNode.transcript}
          progress={playbackProgress}
          isPlaying={isPlaying}
          onSkip={onSkipSpeech}
          compact={true}
        />

        <QuickReplies
          choices={choices}
          onSelect={onSelectChoice}
          disabled={false}
        />
      </aside>
    );
  }

  // 2. EXPANDED HUD MODE (85vw viewport width, centered bottom)
  if (isExpanded) {
    return (
      <div
        className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pointer-events-none"
        role="region"
        aria-label="Khung tư vấn bán hàng bằng giọng nói"
      >
        <section className="pointer-events-auto w-[85vw] max-w-4xl bg-white/98 backdrop-blur-2xl border border-[#1D1D1F]/15 rounded-3xl shadow-[0_24px_64px_-12px_rgba(0,0,0,0.22)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-250 flex flex-col max-h-[82vh]">
          {/* Header */}
          <div className="px-4 py-2.5 sm:px-6 sm:py-3 border-b border-[#1D1D1F]/[0.08] flex items-center justify-between gap-3 bg-[#FAFAF8]/90 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  isPlaying && !isMuted ? 'bg-[#4A90E2] animate-pulse' : 'bg-[#7BC9B2]'
                }`}
              />
              <span className="text-xs sm:text-sm font-bold text-[#1D1D1F] truncate">
                {brand.assistantName}
              </span>
              <span className="text-xs text-[#6E6E73] hidden sm:inline truncate">
                · {brand.assistantRole}
              </span>
              <AudioWaveform
                levels={audioLevels}
                isPlaying={isPlaying}
                isMuted={isMuted}
                activeColor={brand.accentColor}
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {onToggleMute && (
                <button
                  type="button"
                  onClick={onToggleMute}
                  className="p-1.5 rounded-xl hover:bg-[#F3F4F1] text-[#6E6E73] hover:text-[#1D1D1F] transition-colors cursor-pointer"
                  title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-[#E65100]" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}

              {onRestart && (
                <button
                  type="button"
                  onClick={onRestart}
                  className="p-1.5 rounded-xl hover:bg-[#F3F4F1] text-[#6E6E73] hover:text-[#1D1D1F] transition-colors cursor-pointer hidden sm:inline-flex"
                  title="Bắt đầu lại từ đầu"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              {onSetCompact && (
                <button
                  type="button"
                  onClick={() => onSetCompact(true)}
                  className="p-1.5 rounded-xl hover:bg-[#F3F4F1] text-[#6E6E73] hover:text-[#1D1D1F] transition-colors cursor-pointer"
                  title="Thu nhỏ xuống góc"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-xl hover:bg-[#F3F4F1] text-[#6E6E73] hover:text-[#1D1D1F] transition-colors cursor-pointer"
                  title="Đóng khung tư vấn"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 space-y-3.5 overflow-y-auto">
            <StageProgressBar stage={currentNode.stage} />

            <VoiceCaption
              transcript={currentNode.transcript}
              progress={playbackProgress}
              isPlaying={isPlaying}
              onSkip={onSkipSpeech}
              compact={false}
            />

            {showOfferCard ? (
              <OfferCard
                offer={config.offer}
                cta={currentNode.cta}
                secondaryChoice={choices[0]}
                onSelectSecondary={onSelectChoice}
              />
            ) : (
              <QuickReplies
                choices={choices}
                onSelect={onSelectChoice}
                disabled={false}
              />
            )}
          </div>
        </section>
      </div>
    );
  }

  // 3. IDLE FLOATING BUTTON MODE
  return (
    <div
      className="fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-50 flex flex-col items-end gap-3"
      role="region"
      aria-label="Khởi động tư vấn giọng nói"
    >
      {/* Invite Bubble */}
      {widgetState === 'INVITING' && (
        <div className="w-[300px] bg-white/96 backdrop-blur-xl border border-[#1D1D1F]/15 rounded-2xl p-4 shadow-xl space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1D1D1F]">
            <Sparkles className="w-3.5 h-3.5 text-[#4A90E2]" />
            <span>{brand.inviteTitle}</span>
          </div>
          <p className="text-xs text-[#6E6E73] leading-relaxed">
            {brand.inviteBody}
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onStartVoice}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#1D1D1F] hover:bg-[#323236] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Headphones className="w-3.5 h-3.5 text-[#7BC9B2]" />
              <span>Nghe ngay</span>
            </button>
            {onDismissInvite && (
              <button
                type="button"
                onClick={onDismissInvite}
                className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#F3F4F1] hover:bg-[#E5E6E1] text-[#1D1D1F] border border-[#1D1D1F]/10 text-xs font-medium cursor-pointer"
              >
                Để sau
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={onStartVoice}
        className="group px-4 py-2.5 rounded-full bg-white hover:bg-[#FAFAF8] text-[#1D1D1F] border border-[#1D1D1F]/15 shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 cursor-pointer active:scale-95"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-[#7BC9B2] group-hover:scale-125 transition-transform" />
        <div className="text-left">
          <div className="text-xs font-bold text-[#1D1D1F] leading-tight">
            {brand.assistantName}
          </div>
          <div className="text-[10px] text-[#6E6E73] leading-tight">
            {brand.assistantRole}
          </div>
        </div>
        <div className="w-7 h-7 rounded-full bg-[#F3F4F1] group-hover:bg-[#1D1D1F] group-hover:text-white transition-colors flex items-center justify-center shrink-0">
          <Headphones className="w-3.5 h-3.5" />
        </div>
      </button>
    </div>
  );
};

// Backward-compatibility export
export const TodyWidget = VoiceSalesWidget;
