'use client'

import { InfoTip } from '@/components/editor/v2/InfoTip'
import type { DocumentStatus } from '@/lib/types'

interface SignatureTabProps {
  status: DocumentStatus
  onStatusChange: (status: DocumentStatus) => void
  principalName: string | null
  attorneyNames: string[]
  sectionsCount: number
  onExport: () => void
  isExporting: boolean
}

const STATUS_OPTIONS: Array<{ value: DocumentStatus; label: string }> = [
  { value: 'draft', label: 'טיוטה' },
  { value: 'review', label: 'לבדיקה' },
  { value: 'signed', label: 'חתום' },
]

export function SignatureTab({
  status,
  onStatusChange,
  principalName,
  attorneyNames,
  sectionsCount,
  onExport,
  isExporting,
}: SignatureTabProps) {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            marginBottom: 6,
          }}
        >
          סטטוס המסמך
        </div>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const isActive = status === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onStatusChange(opt.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: 13,
                  borderRadius: 4,
                  border: '0.5px solid',
                  borderColor: isActive
                    ? 'var(--color-primary)'
                    : 'var(--border-hover)',
                  backgroundColor: isActive
                    ? 'var(--color-primary)'
                    : '#fff',
                  color: isActive ? '#fff' : 'var(--text-primary)',
                  fontWeight: isActive ? 500 : 400,
                  cursor: 'pointer',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      <div
        style={{
          marginBottom: 20,
          padding: 16,
          backgroundColor: '#fff',
          borderRadius: 4,
          border: '0.5px solid var(--border-default)',
        }}
      >
        <h3
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--color-primary)',
            margin: '0 0 12px',
          }}
        >
          סקירה לפני ייצוא
        </h3>
        <div className="space-y-2" style={{ fontSize: 12 }}>
          <div className="flex">
            <span
              style={{
                width: 80,
                color: 'var(--text-secondary)',
                flexShrink: 0,
              }}
            >
              ממנה:
            </span>
            <span style={{ color: 'var(--text-primary)' }}>
              {principalName || '—'}
            </span>
          </div>
          <div className="flex">
            <span
              style={{
                width: 80,
                color: 'var(--text-secondary)',
                flexShrink: 0,
              }}
            >
              מיופי כוח:
            </span>
            <span style={{ color: 'var(--text-primary)' }}>
              {attorneyNames.length > 0 ? attorneyNames.join(', ') : '—'}
            </span>
          </div>
          <div className="flex">
            <span
              style={{
                width: 80,
                color: 'var(--text-secondary)',
                flexShrink: 0,
              }}
            >
              סעיפים:
            </span>
            <span style={{ color: 'var(--text-primary)' }}>
              {sectionsCount}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onExport}
        disabled={isExporting || sectionsCount === 0}
        className="w-full inline-flex items-center justify-center"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: '#fff',
          padding: '12px 18px',
          borderRadius: 4,
          fontSize: 14,
          fontWeight: 500,
          opacity: sectionsCount === 0 || isExporting ? 0.5 : 1,
          cursor:
            sectionsCount === 0 || isExporting ? 'not-allowed' : 'pointer',
        }}
      >
        <i
          className="ti ti-file-export"
          style={{ marginLeft: 6, fontSize: 16 }}
        />
        {isExporting ? 'מייצא...' : 'ייצוא לקובץ Word'}
      </button>

      <div style={{ marginTop: 20 }}>
        <InfoTip>
          הקובץ יוריד למחשב שלך. תוכלי להעתיק-להדביק אותו ישירות לטופס של
          האפוטרופוס הכללי, או לערוך אותו בוורד לפני שליחה.
        </InfoTip>
      </div>
    </div>
  )
}
