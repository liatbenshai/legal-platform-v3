'use client'

interface DocumentHeaderProps {
  documentType: string
  documentName: string
  clientName: string
  openedAt: Date | null
  onExport: () => void
  isExporting: boolean
  canExport: boolean
}

function formatDate(d: Date | null): string {
  if (!d) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function DocumentHeader({
  documentType,
  documentName,
  clientName,
  openedAt,
  onExport,
  isExporting,
  canExport,
}: DocumentHeaderProps) {
  return (
    <div
      className="flex items-end justify-between border-b"
      style={{
        backgroundColor: '#fff',
        padding: '22px 32px 18px',
        borderColor: 'var(--border-default)',
      }}
    >
      <div className="flex-1 min-w-0">
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            letterSpacing: '0.5px',
            marginBottom: 6,
          }}
        >
          סוג המסמך
        </div>
        <h1
          className="doc-title"
          style={{
            fontSize: 22,
            color: 'var(--color-primary)',
            fontWeight: 500,
            margin: 0,
          }}
        >
          {documentType}
        </h1>
        <div
          style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            marginTop: 6,
          }}
        >
          לקוח: {clientName}
          {openedAt && ` · נפתח ${formatDate(openedAt)}`}
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={onExport}
          disabled={isExporting || !canExport}
          className="inline-flex items-center"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: '#fff',
            padding: '8px 16px',
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 500,
            opacity: !canExport || isExporting ? 0.5 : 1,
            cursor: !canExport || isExporting ? 'not-allowed' : 'pointer',
          }}
        >
          <i className="ti ti-file-export" style={{ marginLeft: 4, fontSize: 14 }} />
          {isExporting ? 'מייצא...' : 'ייצוא לוורד'}
        </button>
      </div>
    </div>
  )
}
