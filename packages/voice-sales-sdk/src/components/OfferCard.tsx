import React from 'react';
import type { VoiceChoice, VoiceNodeCTA, VoiceProductOffer } from '../types.ts';
import { ArrowRight, ExternalLink, Sparkles, ShieldCheck } from 'lucide-react';

export interface OfferCardProps {
  offer?: VoiceProductOffer;
  cta?: VoiceNodeCTA;
  secondaryChoice?: VoiceChoice;
  onSelectSecondary?: (choice: VoiceChoice) => void;
  onCtaClick?: () => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  cta,
  secondaryChoice,
  onSelectSecondary,
  onCtaClick,
}) => {
  const targetUrl = cta?.primaryUrl || offer?.primaryCtaUrl || '#';
  const primaryLabel = cta?.primaryLabel || offer?.primaryCtaLabel || 'Nhận ưu đãi ngay';
  const headline = cta?.badge || offer?.headline || offer?.productName || 'Ưu đãi dành cho bạn';
  const summary = offer?.summary;

  return (
    <div className="rounded-xl bg-[#FAFAF8] border border-[#4A90E2]/25 p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#4A90E2]">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>{headline}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-[#6E6E73]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#7BC9B2] shrink-0" />
          <span>Bảo mật 100%</span>
        </div>
      </div>

      {summary && (
        <p className="text-xs text-[#6E6E73] leading-relaxed hidden sm:block">
          {summary}
        </p>
      )}

      {/* Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <a
          href={targetUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onCtaClick}
          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#1D1D1F] hover:bg-[#323236] text-white text-xs sm:text-[13px] font-semibold flex items-center justify-between gap-2 transition-all shadow-[0_4px_12px_rgba(29,29,31,0.14)]"
        >
          <span>{primaryLabel}</span>
          <ExternalLink className="w-3.5 h-3.5 text-[#7BC9B2] shrink-0" />
        </a>

        {secondaryChoice && onSelectSecondary && (
          <button
            type="button"
            onClick={() => onSelectSecondary(secondaryChoice)}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#F3F4F1] hover:bg-[#E5E6E1] text-[#1D1D1F] border border-[#1D1D1F]/10 text-xs sm:text-[13px] font-medium flex items-center justify-between gap-2 transition-all cursor-pointer"
          >
            <span className="line-clamp-1 text-left">{secondaryChoice.label}</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#6E6E73] shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
};
