function shortLabel(label = '') {
  return label.replace(/^forno\s+/i, '');
}

export default function FornoToggle({ options, active, onChange, fullWidth = false }) {
  return (
    <div style={{
      display: 'flex',
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-full, 999px)',
      padding: 3,
      gap: 2,
      width: fullWidth ? '100%' : 'auto',
      flexShrink: 0,
    }}>
      {options.map(opt => (
        <button
          key={opt.key}
          onClick={() => onChange?.(opt.key)}
          style={{
            flex: fullWidth ? 1 : undefined,
            padding: '4px 10px',
            borderRadius: 'var(--r-full, 999px)',
            fontSize: 11,
            fontWeight: 700,
            fontFamily: 'var(--font)',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
            background: opt.key === active ? 'var(--accent)' : 'none',
            color: opt.key === active ? 'oklch(10% 0.014 38)' : 'var(--text-dim)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: fullWidth ? 'none' : 120,
          }}
        >
          {shortLabel(opt.label)}
        </button>
      ))}
    </div>
  );
}
