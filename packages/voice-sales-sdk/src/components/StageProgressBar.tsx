import React from 'react';
import type { VoiceStage } from '../types.ts';

export interface StageProgressBarProps {
  stage: VoiceStage;
}

interface StepDef {
  key: string;
  label: string;
  stages: VoiceStage[];
}

const STEPS: StepDef[] = [
  { key: 'step1', label: 'Khám phá', stages: ['greeting'] },
  { key: 'step2', label: 'Nhu cầu', stages: ['qualify', 'pain'] },
  { key: 'step3', label: 'Trải nghiệm', stages: ['value', 'demo'] },
  { key: 'step4', label: 'Ưu đãi', stages: ['objection', 'offer', 'closing'] },
];

export const StageProgressBar: React.FC<StageProgressBarProps> = ({ stage }) => {
  const currentStepIndex = STEPS.findIndex((s) => s.stages.includes(stage));
  const activeIndex = currentStepIndex >= 0 ? currentStepIndex : 0;

  return (
    <div
      className="flex items-center gap-2 w-full py-1 px-2 rounded-xl bg-[#F3F4F1]/70 border border-[#1D1D1F]/[0.05]"
      aria-label={`Tiến trình tư vấn: Bước ${activeIndex + 1} trên 4: ${STEPS[activeIndex].label}`}
    >
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-xs font-semibold text-[#1D1D1F] tabular-nums">
          Bước {activeIndex + 1}/4
        </span>
        <span className="text-xs text-[#6E6E73] font-medium truncate max-w-[90px]">
          · {STEPS[activeIndex].label}
        </span>
      </div>

      <div className="flex items-center gap-1 flex-1 ml-auto">
        {STEPS.map((step, idx) => {
          const isDone = idx < activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <div
              key={step.key}
              title={step.label}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                isDone
                  ? 'bg-[#1D1D1F]'
                  : isCurrent
                  ? 'bg-[#4A90E2] ring-1 ring-[#4A90E2]/30'
                  : 'bg-[#1D1D1F]/10'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
