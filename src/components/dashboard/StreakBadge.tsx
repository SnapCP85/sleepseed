import CometSVG from '../characters/CometSVG';

interface StreakBadgeProps {
  count: number;
  celebration?: boolean;
}

export default function StreakBadge({ count, celebration }: StreakBadgeProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 9,
      padding: '10px 16px',
      background: 'rgba(245,184,76,0.09)',
      border: '1.5px solid rgba(245,184,76,0.26)',
      borderRadius: 18, flexShrink: 0,
      ...(celebration ? {
        boxShadow: '0 0 0 3px rgba(245,184,76,.16), 0 0 24px rgba(245,184,76,.12)',
        animation: 'celebrationPop .9s .15s ease both',
      } : {}),
    }}>
      <CometSVG size={26} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <span style={{ fontFamily: "'Fraunces',serif", fontSize: 30, fontWeight: 900, color: '#F5B84C', lineHeight: 1 }}>{count}</span>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 7.5, color: 'rgba(245,184,76,.5)', letterSpacing: '.9px', textTransform: 'uppercase', lineHeight: 1 }}>NIGHT STREAK</span>
      </div>
    </div>
  );
}
