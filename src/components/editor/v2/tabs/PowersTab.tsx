'use client'

import { InfoTip } from '@/components/editor/v2/InfoTip'
import {
  DOMAIN_LABEL,
  JOINTNESS_OPTIONS,
  type AuthorityConfig,
  type DomainScope,
  type Jointness,
} from '@/lib/documents/authority'
import type { DocumentType, EmbeddedPerson } from '@/lib/types'

interface PowersTabProps {
  /** התחומים המכוסים במסמך (poa-property, poa-personal, poa-medical) */
  selectedDomains: DocumentType[]
  onToggleDomain: (domain: DocumentType) => void

  /** מיופי הכוח שכבר הוזנו בלשונית הקודמת */
  attorneys: EmbeddedPerson[]

  /** תצורת חלוקת הסמכויות בין מיופי הכוח */
  authority: AuthorityConfig
  onAuthorityChange: (config: AuthorityConfig) => void
}

const DOMAIN_OPTIONS: Array<{
  value: DocumentType
  hint: string
}> = [
  {
    value: 'poa-property',
    hint: 'ניהול נכסים, חשבונות בנק, רכב, צוואה',
  },
  {
    value: 'poa-personal',
    hint: 'מגורים, מטפלים, חיי יומיום',
  },
  {
    value: 'poa-medical',
    hint: 'החלטות רפואיות, טיפול, תרומת איברים',
  },
]

export function PowersTab({
  selectedDomains,
  onToggleDomain,
  attorneys,
  authority,
  onAuthorityChange,
}: PowersTabProps) {
  function getScopeFor(domain: DocumentType): DomainScope {
    return (
      authority.scopes.find((s) => s.domain === domain) ?? {
        domain,
        attorneyIndices: [],
      }
    )
  }

  function updateScope(domain: DocumentType, next: Partial<DomainScope>) {
    const existing = getScopeFor(domain)
    const updated: DomainScope = { ...existing, ...next }
    const others = authority.scopes.filter((s) => s.domain !== domain)
    onAuthorityChange({ scopes: [...others, updated] })
  }

  function toggleAttorney(domain: DocumentType, index: number) {
    const scope = getScopeFor(domain)
    const isSelected = scope.attorneyIndices.includes(index)
    const next = isSelected
      ? scope.attorneyIndices.filter((i) => i !== index)
      : [...scope.attorneyIndices, index].sort((a, b) => a - b)
    updateScope(domain, { attorneyIndices: next })
  }

  function setJointness(domain: DocumentType, jointness: Jointness) {
    updateScope(domain, { jointness })
  }

  return (
    <div>
      {attorneys.length === 0 && (
        <div
          style={{
            padding: 10,
            marginBottom: 12,
            backgroundColor: 'var(--color-accent-bg)',
            border: '0.5px solid var(--color-accent)',
            borderRadius: 4,
            fontSize: 12,
            color: 'var(--status-review-fg)',
          }}
        >
          טרם הוזנו מיופי כוח. כדי להקצות סמכויות, מלאי קודם את לשונית
          &quot;מיופי הכוח&quot;.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {DOMAIN_OPTIONS.map((opt) => {
          const isSelected = selectedDomains.includes(opt.value)
          const scope = getScopeFor(opt.value)
          const label = DOMAIN_LABEL[opt.value] ?? opt.value
          const multipleAssigned = scope.attorneyIndices.length > 1

          return (
            <div
              key={opt.value}
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
              {/* === שורת התחום עצמו === */}
              <label
                className="flex items-start gap-3 cursor-pointer"
                style={{ marginBottom: isSelected ? 10 : 0 }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleDomain(opt.value)}
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
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      marginTop: 2,
                    }}
                  >
                    {opt.hint}
                  </div>
                </div>
              </label>

              {/* === הקצאת מיופי כוח לתחום הזה === */}
              {isSelected && attorneys.length > 0 && (
                <div
                  style={{
                    marginRight: 26,
                    paddingTop: 8,
                    borderTop: '0.5px dashed var(--border-default)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      marginBottom: 6,
                    }}
                  >
                    מי אחראי על תחום זה?
                  </div>
                  {attorneys.map((att, idx) => {
                    const isAssigned = scope.attorneyIndices.includes(idx)
                    const nameDisplay =
                      `${att.firstName} ${att.lastName}`.trim() ||
                      `מיופה כוח #${idx + 1}`
                    return (
                      <label
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 0',
                          cursor: 'pointer',
                          fontSize: 12,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => toggleAttorney(opt.value, idx)}
                          style={{ width: 13, height: 13 }}
                        />
                        <span style={{ color: 'var(--text-primary)' }}>
                          {nameDisplay}
                          {att.idNumber && (
                            <span
                              style={{
                                color: 'var(--text-muted)',
                                marginRight: 4,
                                fontSize: 11,
                              }}
                            >
                              · ת.ז. {att.idNumber}
                            </span>
                          )}
                        </span>
                      </label>
                    )
                  })}

                  {/* === אופן פעולה (רק אם הוקצו 2 ומעלה) === */}
                  {multipleAssigned && (
                    <div
                      style={{
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: '0.5px dashed var(--border-default)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-secondary)',
                          marginBottom: 4,
                        }}
                      >
                        אופן פעולה:
                      </div>
                      <select
                        value={scope.jointness ?? ''}
                        onChange={(e) =>
                          setJointness(opt.value, e.target.value as Jointness)
                        }
                        style={{
                          width: '100%',
                          padding: '5px 8px',
                          fontSize: 12,
                          border: '0.5px solid var(--border-hover)',
                          borderRadius: 3,
                          background: '#fff',
                          color: 'var(--text-primary)',
                          fontFamily: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="" disabled>
                          בחרי אופן פעולה...
                        </option>
                        {JOINTNESS_OPTIONS.map((j) => (
                          <option key={j.value} value={j.value}>
                            {j.label}
                          </option>
                        ))}
                      </select>
                      {!scope.jointness && (
                        <p
                          style={{
                            margin: '4px 0 0',
                            fontSize: 10,
                            color: '#DC2626',
                          }}
                        >
                          חובה לבחור אופן פעולה כשיש יותר ממיופה כוח אחד.
                        </p>
                      )}
                    </div>
                  )}

                  {scope.attorneyIndices.length === 0 && (
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 10,
                        color: '#DC2626',
                      }}
                    >
                      לא הוקצה מיופה כוח לתחום זה.
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 16 }}>
        <InfoTip>
          התחומים שתבחרי קובעים אילו סעיפים יוצגו בספריית הסעיפים. חלוקת
          הסמכויות שתסמני תופיע כסעיף נפרד בגוף המסמך.
        </InfoTip>
      </div>
    </div>
  )
}
