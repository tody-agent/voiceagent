import React, { useMemo } from 'react';
import { SkipForward } from 'lucide-react';

export interface VoiceCaptionProps {
  transcript: string;
  progress: number;
  isPlaying: boolean;
  onSkip?: () => void;
  compact?: boolean;
  adaptiveDesktop?: boolean;
}

function splitIntoRollingChunks(text: string, maxWordsPerChunk = 15): string[] {
  const clean = text.trim();
  if (!clean) return [''];

  const sentences = clean
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];

  for (const sentence of sentences) {
    const words = sentence.split(/\s+/);
    if (words.length <= maxWordsPerChunk) {
      chunks.push(sentence);
      continue;
    }

    const clauses = sentence
      .split(/(?<=[,–—:])\s+/)
      .map((c) => c.trim())
      .filter(Boolean);

    let current = '';
    for (const clause of clauses) {
      const candidate = current ? `${current} ${clause}` : clause;
      const candidateWords = candidate.split(/\s+/).length;
      if (candidateWords <= maxWordsPerChunk) {
        current = candidate;
      } else {
        if (current) chunks.push(current);
        const clauseWords = clause.split(/\s+/);
        if (clauseWords.length <= maxWordsPerChunk) {
          current = clause;
        } else {
          for (let i = 0; i < clauseWords.length; i += maxWordsPerChunk) {
            chunks.push(clauseWords.slice(i, i + maxWordsPerChunk).join(' '));
          }
          current = '';
        }
      }
    }
    if (current) chunks.push(current);
  }

  return chunks.length > 0 ? chunks : [clean];
}

export const VoiceCaption: React.FC<VoiceCaptionProps> = ({
  transcript,
  progress,
  isPlaying,
  onSkip,
  compact = false,
  adaptiveDesktop = true,
}) => {
  const chunks = useMemo(
    () => splitIntoRollingChunks(transcript, compact ? 13 : 16),
    [transcript, compact]
  );

  const activeChunkData = useMemo(() => {
    const wordCounts = chunks.map((c) => Math.max(1, c.split(/\s+/).length));
    const totalWords = wordCounts.reduce((a, b) => a + b, 0);

    if (!isPlaying || progress >= 0.98) {
      const lastIdx = chunks.length - 1;
      return {
        chunkIndex: lastIdx,
        totalChunks: chunks.length,
        text: chunks[lastIdx] || transcript,
        localProgress: 1,
      };
    }

    const targetWordPos = Math.max(0, Math.min(0.999, progress)) * totalWords;
    let accumulated = 0;
    for (let i = 0; i < chunks.length; i++) {
      const count = wordCounts[i];
      if (targetWordPos <= accumulated + count || i === chunks.length - 1) {
        const localProgress = Math.max(
          0,
          Math.min(1, (targetWordPos - accumulated) / count)
        );
        return {
          chunkIndex: i,
          totalChunks: chunks.length,
          text: chunks[i],
          localProgress,
        };
      }
      accumulated += count;
    }

    return {
      chunkIndex: 0,
      totalChunks: chunks.length,
      text: chunks[0],
      localProgress: 0,
    };
  }, [chunks, isPlaying, progress, transcript]);

  const mobileWords = activeChunkData.text.split(/\s+/).filter(Boolean);
  const mobileHighlightedCount = isPlaying
    ? Math.max(
        2,
        Math.ceil(
          mobileWords.length *
            Math.min(1, activeChunkData.localProgress * 1.15 + 0.15)
        )
      )
    : mobileWords.length;

  const allWords = useMemo(
    () => transcript.split(/\s+/).filter(Boolean),
    [transcript]
  );
  const desktopHighlightedCount = isPlaying
    ? Math.max(
        2,
        Math.ceil(allWords.length * Math.min(1, progress * 1.1 + 0.1))
      )
    : allWords.length;

  return (
    <div
      className={`rounded-2xl bg-[#F3F4F1]/90 border border-[#1D1D1F]/[0.06] ${
        compact ? 'px-3 py-2' : 'px-3 py-2 sm:px-4 sm:py-3'
      } overflow-hidden transition-all`}
      aria-live="polite"
      title={transcript}
    >
      {/* MOBILE VIEW: 2-line rolling subtitles */}
      <div
        className={`${
          adaptiveDesktop && !compact ? 'sm:hidden' : 'block'
        } relative overflow-hidden min-h-[2.6em] max-h-[2.75em] flex items-center`}
      >
        <p
          key={`${transcript}-${activeChunkData.chunkIndex}`}
          className={`animate-caption-flow ${
            compact ? 'text-xs' : 'text-[13px]'
          } leading-[1.35] text-[#1D1D1F] font-medium line-clamp-2 w-full`}
        >
          {mobileWords.map((word, idx) => {
            const isHighlighted = idx < mobileHighlightedCount;
            return (
              <span
                key={`${activeChunkData.chunkIndex}-${idx}`}
                className={`transition-opacity duration-150 ${
                  isHighlighted
                    ? 'opacity-100 text-[#1D1D1F]'
                    : 'opacity-45 text-[#6E6E73]'
                }`}
              >
                {word}{' '}
              </span>
            );
          })}
        </p>
      </div>

      {/* DESKTOP VIEW: Full transcript with synchronized speech highlighting */}
      {adaptiveDesktop && !compact && (
        <div className="hidden sm:block max-h-36 overflow-y-auto">
          <p className="text-[13px] md:text-sm leading-relaxed text-[#1D1D1F] font-medium">
            {allWords.map((word, idx) => {
              const isHighlighted = idx < desktopHighlightedCount;
              return (
                <span
                  key={`desktop-${idx}`}
                  className={`transition-all duration-150 ${
                    isHighlighted
                      ? 'text-[#1D1D1F] font-semibold'
                      : 'text-[#6E6E73]/70 font-normal'
                  }`}
                >
                  {word}{' '}
                </span>
              );
            })}
          </p>
        </div>
      )}

      {/* Slim progress indicator + Skip button */}
      <div className="mt-2 flex items-center justify-between gap-2 pt-1 border-t border-[#1D1D1F]/[0.05]">
        <div className="flex-1 h-1.5 rounded-full bg-[#1D1D1F]/10 overflow-hidden">
          <div
            className="h-full bg-[#4A90E2] transition-all duration-150"
            style={{
              width: `${Math.round(
                (isPlaying ? Math.max(0.06, progress) : 1) * 100
              )}%`,
            }}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 text-xs text-[#6E6E73]">
          {activeChunkData.totalChunks > 1 && (
            <span
              className={`font-mono-tabular ${
                adaptiveDesktop && !compact ? 'sm:hidden' : 'inline'
              }`}
            >
              {activeChunkData.chunkIndex + 1}/{activeChunkData.totalChunks}
            </span>
          )}
          {isPlaying && onSkip && (
            <button
              type="button"
              onClick={onSkip}
              className="text-[#4A90E2] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Bỏ qua</span>
              <SkipForward className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
