interface PrimaryCTAProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function PrimaryCTA({ label, onClick, disabled }: PrimaryCTAProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: 'relative', width: '100%', padding: '16px 20px',
        borderRadius: 18, border: 'none', background: '#F5B84C',
        color: '#172200', fontSize: 15, fontWeight: 700,
        fontFamily: "'Fraunces',serif", letterSpacing: '-.1px',
        boxShadow: '0 8px 24px rgba(245,184,76,.26), 0 3px 10px rgba(0,0,0,.22)',
        overflow: 'hidden', cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? .5 : 1,
      }}
    >
      {/* Shimmer overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(108deg,transparent 30%,rgba(255,255,255,.18) 50%,transparent 70%)',
        animation: 'shimmer 5.5s infinite', pointerEvents: 'none',
      }} />
      <span style={{ position: 'relative', zIndex: 1 }}>{label}</span>
    </button>
  );
}
