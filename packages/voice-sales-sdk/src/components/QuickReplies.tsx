import React, { useState } from 'react';
import type { VoiceChoice } from '../types.ts';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

export interface QuickRepliesProps {
  choices: VoiceChoice[];
  onSelect: (choice: VoiceChoice) => void;
  disabled?: boolean;
}

export const QuickReplies: React.FC<QuickRepliesProps> = ({
  choices,
  onSelect,
  disabled = false,
}) => {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  if (!choices || choices.length === 0) return null;

  const total = choices.length;
  const hasMoreThanTwo = total > 2;

  return (
    <div className="space-y-2" role="group" aria-label="Lựa chọn phản hồi">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {choices.map((choice, idx) => {
          const isPrimary = idx === 0;
          const isSingle = total === 1;
          const isOddLast = total % 2 !== 0 && idx === total - 1 && !isSingle;
          const isHiddenOnMobile = !mobileExpanded && idx >= 2;

          return (
            <button
              key={choice.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(choice)}
              className={`min-h-[40px] px-3 py-2 rounded-xl transition-all text-left flex items-center justify-between gap-2 group cursor-pointer active:scale-[0.99] ${
                isSingle || isOddLast ? 'sm:col-span-2' : ''
              } ${
                isHiddenOnMobile ? 'hidden sm:flex' : 'flex'
              } ${
                isPrimary
                  ? 'bg-[#1D1D1F] hover:bg-[#323236] text-white shadow-[0_4px_12px_rgba(29,29,31,0.14)]'
                  : 'bg-[#F3F4F1] hover:bg-[#E5E6E1] text-[#1D1D1F] border border-[#1D1D1F]/10'
              }`}
            >
              <span
                className={`text-xs sm:text-[13px] leading-snug line-clamp-2 ${
                  isPrimary
                    ? 'font-semibold text-white'
                    : 'font-medium text-[#1D1D1F]'
                }`}
              >
                {choice.label}
              </span>
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 ${
                  isPrimary
                    ? 'bg-white/15 text-white group-hover:translate-x-0.5'
                    : 'bg-white text-[#6E6E73] group-hover:text-[#1D1D1F]'
                }`}
              >
                <ArrowRight className="w-3 h-3" />
              </span>
            </button>
          );
        })}
      </div>

      {hasMoreThanTwo && (
        <button
          type="button"
          onClick={() => setMobileExpanded((prev) => !prev)}
          className="w-full sm:hidden py-1 px-2 text-xs font-semibold text-[#4A90E2] hover:text-[#2A70C2] flex items-center justify-center gap-1 transition-colors cursor-pointer"
        >
          <span>
            {mobileExpanded
              ? 'Thu gọn lựa chọn'
              : `+ Xem thêm ${total - 2} lựa chọn`}
          </span>
          {mobileExpanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      )}
    </div>
  );
};
