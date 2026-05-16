interface FormPanelProps {
  stepTitle: string
  stepDescription: string
  children: React.ReactNode
}

export function FormPanel({
  stepTitle,
  stepDescription,
  children,
}: FormPanelProps) {
  return (
    <aside
      className="overflow-y-auto"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '26px 24px',
        borderLeft: '1px solid var(--border-default)',
      }}
    >
      <h2
        className="doc-title"
        style={{
          fontSize: 16,
          color: 'var(--color-primary)',
          fontWeight: 500,
          margin: '0 0 4px',
        }}
      >
        {stepTitle}
      </h2>
      <p
        style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          margin: '0 0 22px',
        }}
      >
        {stepDescription}
      </p>
      {children}
    </aside>
  )
}
