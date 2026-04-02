import { useState } from 'react';
import { hexToRgba } from './RitualShared';

// ─────────────────────────────────────────────────────────────────────────────
// RitualStoryViewer — Multi-page pre-written story viewer
// ─────────────────────────────────────────────────────────────────────────────
// Displays a sequence of text pages with scene backgrounds, pagination dots,
// and calm transitions. Used for the pre-written ritual stories on each night.
// ─────────────────────────────────────────────────────────────────────────────

export interface StoryPage {
  text: string;
  scene?: 'stars' | 'elder' | 'egg' | 'glow' | 'forest' | 'dreamlight';
}

interface Props {
  pages: StoryPage[];
  title: string;
  emoji: string;
  color?: string;
  onComplete: () => void;
}

const SCENE_GRADIENTS: Record<string, string> = {
  stars:      'radial-gradient(ellipse 100% 80% at 50% 20%, rgba(20,14,60,.4), transparent 70%)',
  elder:      'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(154,127,212,.12), transparent 60%)',
  egg:        'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(246,197,111,.1), transparent 60%)',
  glow:       'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(245,184,76,.15), transparent 60%)',
  forest:     'radial-gradient(ellipse 100% 80% at 50% 60%, rgba(20,90,60,.12), transparent 70%)',
  dreamlight: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(20,216,144,.1), transparent 60%)',
};

export default function RitualStoryViewer({ pages, title, emoji, color = '#F5B84C', onComplete }: Props) {
  const [page, setPage] = useState(0);
  const isLast = page === pages.length - 1;
  const current = pages[page];
  const scene = current.scene || 'stars';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1001,
      background: '#060912', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Nunito',system-ui,sans-serif", color: '#F4EFE8',
      padding: 24, overflow: 'hidden',
    }}>
      {/* Scene background */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: SCENE_GRADIENTS[scene] || SCENE_GRADIENTS.stars,
        transition: 'background 1s ease',
      }} />

      {/* Stars */}
      {Array.from({ length: 30 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute', borderRadius: '50%', background: '#EEE8FF',
          left: `${(i * 37 + 13) % 100}%`, top: `${(i * 23 + 7) % 60}%`,
          width: 1 + (i % 3) * 0.5, height: 1 + (i % 3) * 0.5,
          opacity: .08 + (i % 5) * .06, pointerEvents: 'none',
        }} />
      ))}

      <div style={{
        position: 'relative', zIndex: 5, maxWidth: 340, width: '100%',
        textAlign: 'center',
        animation: 'or-fadeUp .5s ease-out',
        // Use key to trigger re-animation on page change
      }} key={page}>
        {/* Title (first page only) */}
        {page === 0 && (
          <div style={{
            fontFamily: "'DM Mono',monospace", fontSize: 9,
            color: 'rgba(244,239,232,.3)', letterSpacing: '.06em',
            textTransform: 'uppercase', marginBottom: 20,
          }}>{title}</div>
        )}

        {/* Emoji scene marker */}
        <div style={{
          fontSize: 40, marginBottom: 20, lineHeight: 1,
          filter: `drop-shadow(0 0 16px ${hexToRgba(color, .3)})`,
          animation: 'or-float 4s ease-in-out infinite',
        }}>{emoji}</div>

        {/* Story text */}
        <div style={{
          fontFamily: "'Lora','Fraunces',Georgia,serif",
          fontSize: 16, fontWeight: 400, lineHeight: 1.8,
          color: 'rgba(244,239,232,.75)', maxWidth: 300, margin: '0 auto',
          animation: 'or-fadeIn .8s ease-out',
        }}>
          {current.text}
        </div>
      </div>

      {/* Pagination dots */}
      <div style={{
        position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 6, zIndex: 10,
      }}>
        {pages.map((_, i) => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: i === page ? color : i < page ? hexToRgba(color, .4) : 'rgba(255,255,255,.12)',
            transition: 'all .3s',
          }} />
        ))}
      </div>

      {/* Navigation button */}
      <button
        onClick={() => isLast ? onComplete() : setPage(p => p + 1)}
        style={{
          position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          padding: '14px 36px', border: 'none', borderRadius: 14, zIndex: 10,
          background: isLast
            ? 'linear-gradient(135deg,#a06010,#F5B84C 50%,#a06010)'
            : 'rgba(255,255,255,.06)',
          color: isLast ? '#080200' : 'rgba(244,239,232,.5)',
          fontSize: 14, fontWeight: isLast ? 700 : 500, cursor: 'pointer',
          fontFamily: "'Nunito',system-ui,sans-serif",
          boxShadow: isLast ? '0 6px 24px rgba(200,130,20,.3)' : 'none',
          transition: 'all .2s',
        }}
      >
        {isLast ? 'Continue ✦' : 'Next →'}
      </button>

      {/* Back button (not on first page) */}
      {page > 0 && (
        <button
          onClick={() => setPage(p => p - 1)}
          style={{
            position: 'absolute', top: 20, left: 20, background: 'none',
            border: 'none', color: 'rgba(244,239,232,.3)', fontSize: 18,
            cursor: 'pointer', padding: 8, zIndex: 10,
            fontFamily: "'Nunito',system-ui,sans-serif",
          }}
        >←</button>
      )}
    </div>
  );
}
