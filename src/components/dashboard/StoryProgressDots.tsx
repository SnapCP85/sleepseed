import React, { useRef } from 'react';

interface StoryProgressDotsProps {
  filled: number;
  tonight: number;
  totalDots?: number;
  isComplete?: boolean;
  onDotClick?: (index: number) => void;
}

export default function StoryProgressDots({
  filled, tonight, totalDots = 7, isComplete, onDotClick,
}: StoryProgressDotsProps) {
  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8.5, color: 'rgba(234,242,255,.24)', letterSpacing: '.9px', textTransform: 'uppercase' }}>BOOK PROGRESS</span>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8.5, color: 'rgba(234,242,255,.22)' }}>{filled} of {totalDots}</span>
      </div>

      {/* Dots row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginLeft: -6 }}>
        {Array.from({ length: totalDots }, (_, i) => {
          const isDone = i < filled;
          const isCurrent = !isComplete && i === tonight && i >= filled;
          const isFuture = !isDone && !isCurrent;

          let innerStyle: React.CSSProperties;
          if (isDone) {
            innerStyle = { width: 14, height: 14, borderRadius: '50%', background: '#14d890', opacity: .75, transition: 'transform .12s' };
          } else if (isCurrent) {
            innerStyle = { width: 14, height: 14, borderRadius: '50%', background: '#F5B84C', animation: 'dotPulse 2s ease-out infinite' };
          } else {
            innerStyle = { width: 14, height: 14, borderRadius: '50%', background: 'rgba(234,242,255,.08)', border: '.5px solid rgba(234,242,255,.18)' };
          }

          return (
            <DotTarget key={i} isDone={isDone} onClick={() => isDone && onDotClick?.(i)}>
              <div style={innerStyle} />
            </DotTarget>
          );
        })}
      </div>

      {/* Guidance line */}
      {!isComplete && filled < totalDots && (
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#F5B84C', flexShrink: 0 }} />
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'rgba(245,184,76,.65)' }}>
            Night {filled + 1} is next &middot; {totalDots - filled} to go
          </span>
        </div>
      )}
    </div>
  );
}

function DotTarget({ isDone, onClick, children }: { isDone: boolean; onClick: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isDone ? 'pointer' : 'default' }}
      onClick={onClick}
      onPointerDown={() => { if (isDone && ref.current?.firstElementChild) (ref.current.firstElementChild as HTMLElement).style.transform = 'scale(.8)'; }}
      onPointerUp={() => { if (isDone && ref.current?.firstElementChild) (ref.current.firstElementChild as HTMLElement).style.transform = ''; }}
      onPointerLeave={() => { if (isDone && ref.current?.firstElementChild) (ref.current.firstElementChild as HTMLElement).style.transform = ''; }}
    >
      {children}
    </div>
  );
}
