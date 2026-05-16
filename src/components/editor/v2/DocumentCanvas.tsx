'use client'

import { Fragment } from 'react'
import type { RenderedSection } from '@/lib/engine/renderer'

interface DocumentCanvasProps {
  documentTitle: string
  rendered: RenderedSection[]
  partiesSummary?: string
  pageInfo?: string
  saveStatus?: 'saving' | 'saved' | 'error' | 'idle'
}

function parseInlineBold(text: string): React.ReactNode[] {
  const segments = text.split(/(\*\*[^*]+\*\*)/g).filter((s) => s.length > 0)
  return segments.map((segment, i) => {
    const boldMatch = segment.match(/^\*\*([^*]+)\*\*$/)
    if (boldMatch) {
      return <strong key={i}>{boldMatch[1]}</strong>
    }
    return <Fragment key={i}>{segment}</Fragment>
  })
}

function renderContentParagraphs(content: string): React.ReactNode[] {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let idx = 0
  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '')
    if (!line.trim()) continue
    const isSubheading = /^\*\*[^*]+\*\*$/.test(line.trim())
    if (isSubheading) {
      const text = line.trim().replace(/^\*\*|\*\*$/g, '')
      elements.push(
        <h4
          key={idx}
          style={{
            fontFamily: 'var(--font-frank-ruhl), Georgia, serif',
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--color-primary)',
            margin: '14px 0 8px',
          }}
        >
          {text}
        </h4>
      )
    } else {
      elements.push(
        <p
          key={idx}
          style={{
            margin: '0 0 14px',
            textAlign: 'right',
          }}
        >
          {parseInlineBold(line)}
        </p>
      )
    }
    idx += 1
  }
  return elements
}

function getSaveText(
  status: DocumentCanvasProps['saveStatus']
): React.ReactNode {
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
  return <span style={{ color: '#DC2626' }}>שגיאת שמירה — נסי שוב</span>
}

export function DocumentCanvas({
  documentTitle,
  rendered,
  partiesSummary,
  pageInfo = 'תצוגה מקדימה',
  saveStatus,
}: DocumentCanvasProps) {
  return (
    <div
      className="relative h-full overflow-y-auto"
      style={{
        backgroundColor: '#fff',
        padding: '32px 48px 36px',
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

      <div className="text-center" style={{ marginBottom: 32 }}>
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
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          לפי חוק הכשרות המשפטית והאפוטרופסות, התשכ&quot;ב-1962
        </div>
      </div>

      <div className="doc-body" style={{ maxWidth: 720, margin: '0 auto' }}>
        {partiesSummary && (
          <div
            style={{
              marginBottom: 28,
              paddingBottom: 20,
              borderBottom: '1px solid var(--border-default)',
            }}
          >
            {partiesSummary.split('\n').map((line, i) => (
              <p key={i} style={{ margin: '0 0 8px', textAlign: 'right' }}>
                {line}
              </p>
            ))}
          </div>
        )}

        {rendered.length === 0 ? (
          <p
            className="doc-placeholder"
            style={{ margin: '0 0 16px', textAlign: 'right' }}
          >
            [בחרי סעיפים בלשונית &quot;הנחיות מקדימות&quot; כדי שיופיעו כאן]
          </p>
        ) : (
          rendered.map((section, idx) => (
            <section key={section.id} style={{ marginBottom: 24 }}>
              <h3
                style={{
                  fontFamily: 'var(--font-frank-ruhl), Georgia, serif',
                  fontSize: 17,
                  fontWeight: 500,
                  color: 'var(--color-primary)',
                  margin: '0 0 12px',
                  textAlign: 'right',
                }}
              >
                {idx + 1}. {section.title}
              </h3>
              {renderContentParagraphs(section.content)}
            </section>
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
        <div>בהתאמה לטופס משרד המשפטים</div>
      </div>
    </div>
  )
}
