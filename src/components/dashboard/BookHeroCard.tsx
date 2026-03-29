interface BookHeroCardProps {
  title: string;
  readNumber: number;
  totalReads?: number;
  isComplete: boolean;
  creatureEmoji?: string;
  creatureColor?: string;
  companionName?: string;
  whisperLine?: string;
}

export default function BookHeroCard({
  title, readNumber, totalReads = 7, isComplete,
  creatureEmoji, companionName, whisperLine,
}: BookHeroCardProps) {
  const rgb = isComplete ? '20,216,144' : '245,184,76';
  const statusLabel = isComplete
    ? `READ ${readNumber} COMPLETE \u2713`
    : `READ ${readNumber} OF ${totalReads}`;

  return (
    <div style={{
      background: 'rgba(12,24,70,.92)', border: '1px solid rgba(255,255,255,.07)',
      borderRadius: 22, padding: '16px 16px 14px', overflow: 'hidden',
    }}>
      {/* Label */}
      <div style={{
        fontFamily: "'DM Mono',monospace", fontSize: 8.5,
        color: 'rgba(234,242,255,.25)', letterSpacing: '1.1px',
        textTransform: 'uppercase', marginBottom: 12,
      }}>CURRENTLY READING</div>

      {/* Body row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Fraunces',serif", fontSize: 21, fontWeight: 900,
            color: '#F4EFE8', lineHeight: 1.15, letterSpacing: '-.4px',
          }}>{title}</div>
          <div style={{
            marginTop: 9, display: 'inline-flex', padding: '4px 10px',
            background: `rgba(${rgb},.1)`, border: `.5px solid rgba(${rgb},.28)`,
            borderRadius: 20,
          }}>
            <span style={{
              fontFamily: "'DM Mono',monospace", fontSize: 8, fontWeight: 600,
              color: `rgba(${rgb},1)`,
            }}>{statusLabel}</span>
          </div>
        </div>
        {creatureEmoji && (
          <div style={{ fontSize: 62, lineHeight: 1, flexShrink: 0, marginBottom: -4 }}>
            {creatureEmoji}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: .5, background: 'rgba(255,255,255,.05)', margin: '12px 0' }} />

      {/* Whisper row */}
      {(companionName || whisperLine) && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          {companionName && (
            <span style={{
              fontFamily: "'DM Mono',monospace", fontSize: 8,
              color: 'rgba(234,242,255,.28)', flexShrink: 0,
              textTransform: 'uppercase', letterSpacing: '.6px',
            }}>{companionName}</span>
          )}
          {whisperLine && (
            <span style={{
              fontFamily: "'Nunito',sans-serif", fontSize: 12,
              fontStyle: 'italic', color: 'rgba(234,242,255,.46)', lineHeight: 1.6,
            }}>"{whisperLine}"</span>
          )}
        </div>
      )}
    </div>
  );
}
