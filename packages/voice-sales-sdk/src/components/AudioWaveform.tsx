import React from 'react';

export interface AudioWaveformProps {
  levels: number[];
  isPlaying: boolean;
  isMuted: boolean;
  activeColor?: string;
  inactiveColor?: string;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  levels,
  isPlaying,
  isMuted,
  activeColor = '#4A90E2',
  inactiveColor = 'rgba(110, 110, 115, 0.35)',
}) => {
  const compactLevels = (levels && levels.length > 0 ? levels : [0.2, 0.4, 0.7, 0.5, 0.3]).slice(0, 5);

  return (
    <div
      className="inline-flex items-center justify-center gap-1 h-4 px-1 overflow-hidden shrink-0"
      aria-label={
        isPlaying && !isMuted
          ? 'Voice assistant đang phát âm thanh'
          : isMuted
          ? 'Âm thanh đã tắt'
          : 'Đang chờ'
      }
    >
      {compactLevels.map((level, index) => {
        const activeHeight =
          isPlaying && !isMuted
            ? Math.max(25, Math.min(100, Math.round(level * 100)))
            : 25;
        return (
          <span
            key={index}
            className="w-0.5 rounded-full transition-all duration-100 ease-out shrink-0"
            style={{
              height: `${activeHeight}%`,
              backgroundColor:
                isPlaying && !isMuted
                  ? activeColor
                  : inactiveColor,
            }}
          />
        );
      })}
    </div>
  );
};
