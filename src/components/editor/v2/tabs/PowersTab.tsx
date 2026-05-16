'use client'

import { InfoTip } from '@/components/editor/v2/InfoTip'
import type { DocumentType } from '@/lib/types'

interface PowersTabProps {
  selectedDomains: DocumentType[]
  onToggle: (domain: DocumentType) => void
}

const DOMAIN_OPTIONS: Array<{ value: DocumentType; label: string; hint: string }> = [
  {
    value: 'poa-property',
    label: 'רכושי',
    hint: 'ניהול נכסים, חשבונות בנק, רכב, צוואה',
  },
  {
    value: 'poa-personal',
    label: 'אישי',
    hint: 'מגורים, מטפלים, חיי יומיום',
  },
  {
    value: 'poa-medical',
    label: 'רפואי',
    hint: 'החלטות רפואיות, טיפול, תרומת איברים',
  },
]

export function PowersTab({ selectedDomains, onToggle }: PowersTabProps) {
  return (
    <div>
      <div className="space-y-2.5">
        {DOMAIN_OPTIONS.map((opt) => {
          const isSelected = selectedDomains.includes(opt.value)
          return (
            <label
              key={opt.value}
              className="flex items-start gap-3 cursor-pointer"
              style={{
                padding: '10px 12px',
                border: '0.5px solid',
                borderColor: isSelected
                  ? 'var(--color-primary)'
                  : 'var(--border-hover)',
                borderRadius: 4,
                backgroundColor: isSelected
                  ? 'var(--color-primary-light)'
                  : '#fff',
              }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(opt.value)}
                style={{ marginTop: 2, width: 14, height: 14 }}
              />
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                  }}
                >
                  {opt.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    marginTop: 2,
                  }}
                >
                  {opt.hint}
                </div>
              </div>
            </label>
          )
        })}
      </div>
      <div style={{ marginTop: 20 }}>
        <InfoTip>
          התחומים שתבחרי קובעים אילו סעיפים יוצגו בספריית הסעיפים בלשונית הבאה.
        </InfoTip>
      </div>
    </div>
  )
}
