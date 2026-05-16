interface InfoTipProps {
  children: React.ReactNode
}

export function InfoTip({ children }: InfoTipProps) {
  return (
    <div
      className="flex items-start gap-1.5"
      style={{
        backgroundColor: 'var(--color-accent-bg)',
        borderRight: '3px solid var(--color-accent)',
        borderRadius: 4,
        padding: '10px 12px',
        marginBottom: 20,
      }}
    >
      <i
        className="ti ti-bulb"
        style={{
          fontSize: 12,
          color: '#92660A',
          marginTop: 3,
          flexShrink: 0,
        }}
      />
      <div
        style={{
          fontSize: 11,
          color: '#92660A',
          lineHeight: 1.5,
        }}
      >
        {children}
      </div>
    </div>
  )
}
