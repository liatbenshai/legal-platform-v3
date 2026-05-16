'use client'

import type { RenderedSection } from '@/lib/engine/renderer'

interface DocumentCanvasProps {
  documentTitle: string
  rendered: RenderedSection[]
  partiesSummary?: string
  pageInfo?: string
  saveStatus?: 'saving' | 'saved' | 'error' | 'idle'
  wordsCount?: number
}

function getSaveText(status: DocumentCanvasProps['saveStatus']): React.ReactNode {
  if (!status || status === 'idle') {
    return (
      <>
        <i
          className="ti ti-check"
          style={{
            fontSize: 12,
            color: 'var(--text-success)',
            marginLeft: 4,
          }}
        />
        טרם נשמר
      </>
    )
  }
  if (status === 'saving') return <>שומר...</>
  if (status === 'saved') {
    return (
      <>
        <i
          className="ti ti-check"
          style={{
            fontSize: 12,
            color: 'var(--text-success)',
            marginLeft: 4,
          }}
        />
        נשמר אוטומטית
      </>
    )
  }
  return (
    <span style={{ color: '#DC2626' }}>שגיאת שמירה — נסי שוב</span>
  )
}

export function DocumentCanvas({
  documentTitle,
  rendered,
  partiesSummary,
  pageInfo = 'תצוגה מקדימה',
  saveStatus,
  wordsCount,
}: DocumentCanvasProps) {
  return (
    <div
      className="relative h-full overflow-y-auto"
      style={{
        backgroundColor: '#fff',
        padding: '32px 36px 36px',
      }}
    >
      <div
        className="absolute"
        style={{
          top: 14,
          left: 18,
          fontSize: 11,
          color: 'var(--text-muted)',
          letterSpacing: '0.5px',
        }}
      >
        {pageInfo}
      </div>

      <div className="text-center" style={{ marginBottom: 28 }}>
        <h1
          className="doc-title"
          style={{
            fontSize: 26,
            color: 'var(--color-primary)',
            fontWeight: 500,
            letterSpacing: '1px',
            margin: 0,
          }}
        >
          {documentTitle}
        </h1>
        <div
          style={{
            width: 60,
            height: 2,
            backgroundColor: 'var(--color-accent)',
            margin: '12px auto',
          }}
        />
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}
        >
          לפי חוק הכשרות המשפטית והאפוטרופסות, התשכ&quot;ב-1962
        </div>
      </div>

      <div className="doc-body" style={{ maxWidth: 580, margin: '0 auto' }}>
        {partiesSummary && (
          <p style={{ margin: '0 0 24px', whiteSpace: 'pre-wrap' }}>
            {partiesSummary}
          </p>
        )}

        {rendered.length === 0 ? (
          <p className="doc-placeholder" style={{ margin: '0 0 16px' }}>
            [בחרי סעיפים בלשונית &quot;הנחיות מקדימות&quot; כדי שיופיעו כאן]
          </p>
        ) : (
          rendered.map((section, idx) => (
            <div key={section.id} style={{ marginBottom: 18 }}>
              <h3
                style={{
                  fontFamily: 'var(--font-frank-ruhl), Georgia, serif',
                  fontSize: 16,
                  fontWeight: 500,
                  color: 'var(--color-primary)',
                  margin: '0 0 8px',
                }}
              >
                {idx + 1}. {section.title}
              </h3>
              <div style={{ whiteSpace: 'pre-wrap' }}>{section.content}</div>
            </div>
          ))
        )}
      </div>

      <div
        className="flex justify-between items-center"
        style={{
          marginTop: 32,
          paddingTop: 16,
          borderTop: '1px solid var(--border-default)',
          fontSize: 11,
          color: 'var(--text-secondary)',
        }}
      >
        <div className="flex items-center">{getSaveText(saveStatus)}</div>
        <div>
          {typeof wordsCount === 'number' && `${wordsCount} מילים · `}
          בהתאמה לטופס משרד המשפטים
        </div>
      </div>
    </div>
  )
}
