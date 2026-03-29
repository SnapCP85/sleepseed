interface SecondaryCTAProps {
  label: string;
  onClick: () => void;
}

export default function SecondaryCTA({ label, onClick }: SecondaryCTAProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '15px 20px', borderRadius: 18,
        border: '1px solid rgba(244,239,232,.16)',
        background: 'rgba(244,239,232,.06)',
        color: 'rgba(234,242,255,.68)', fontSize: 14, fontWeight: 600,
        fontFamily: "'Fraunces',serif", letterSpacing: '-.05px',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}
