'use client'

import { useMemo, useState } from 'react'
import { InfoTip } from '@/components/editor/v2/InfoTip'
import {
  CATEGORY_LABELS,
  type LibrarySection,
} from '@/lib/sections/library'
import type { DocumentSection, DocumentType } from '@/lib/types'

interface DirectivesTabProps {
  availableSections: LibrarySection[]
  selectedSections: DocumentSection[]
  onAdd: (template: LibrarySection) => void
  onRemove: (sectionId: string) => void
  onMoveUp: (sectionId: string) => void
  onMoveDown: (sectionId: string) => void
  allowedDomains: DocumentType[]
}

export function DirectivesTab({
  availableSections,
  selectedSections,
  onAdd,
  onRemove,
  onMoveUp,
  onMoveDown,
}: DirectivesTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const selectedTemplateIds = useMemo(
    () =>
      selectedSections
        .map((s) => s.templateId)
        .filter((id): id is string => Boolean(id)),
    [selectedSections]
  )

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return availableSections
    return availableSections.filter((s) =>
      [s.title, s.description, ...s.tags, ...s.variants.map((v) => v.content)]
        .join(' ')
        .toLowerCase()
        .includes(term)
    )
  }, [availableSections, searchTerm])

  const sorted = [...selectedSections].sort((a, b) => a.order - b.order)

  const conflictsBySectionId = useMemo(() => {
    const templateById = new Map<string, LibrarySection>()
    for (const t of availableSections) templateById.set(t.sectionId, t)
    const selectedTplIds = new Set(
      selectedSections.map((s) => s.templateId).filter(Boolean) as string[]
    )
    const result = new Map<string, string[]>()
    for (const sec of selectedSections) {
      if (!sec.templateId) continue
      const tpl = templateById.get(sec.templateId)
      if (!tpl) continue
      const conflicts: string[] = []
      for (const conflictId of tpl.conflictsWith) {
        if (conflictId === sec.templateId) continue
        if (selectedTplIds.has(conflictId)) {
          const conflictTpl = templateById.get(conflictId)
          if (conflictTpl) conflicts.push(conflictTpl.title)
        }
      }
      if (conflicts.length > 0) result.set(sec.id, conflicts)
    }
    return result
  }, [availableSections, selectedSections])

  const hasAnyConflict = conflictsBySectionId.size > 0

  return (
    <div>
      {hasAnyConflict && (
        <div
          style={{
            marginBottom: 12,
            padding: '8px 10px',
            backgroundColor: '#FEE2E2',
            border: '0.5px solid #FCA5A5',
            borderRight: '3px solid #DC2626',
            borderRadius: 4,
            fontSize: 12,
            color: '#991B1B',
            lineHeight: 1.5,
          }}
        >
          <strong>⚠ זוהו סעיפים סותרים.</strong> חלק מהסעיפים שבחרת מכילים
          הוראות הפוכות. כדאי להסיר אחד מהם לפני ייצוא המסמך.
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            marginBottom: 6,
          }}
        >
          סעיפים נבחרים ({sorted.length})
        </div>
        {sorted.length === 0 ? (
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              padding: '12px',
              border: '1px dashed var(--border-default)',
              borderRadius: 4,
              textAlign: 'center',
            }}
          >
            בחרי סעיפים מהרשימה למטה
          </div>
        ) : (
          <ul className="space-y-1.5">
            {sorted.map((s, idx) => {
              const conflictsForThis = conflictsBySectionId.get(s.id) ?? []
              const hasConflict = conflictsForThis.length > 0
              return (
              <li
                key={s.id}
                style={{
                  padding: '8px 10px',
                  backgroundColor: hasConflict ? '#FFFBEB' : '#fff',
                  border: '0.5px solid',
                  borderColor: hasConflict ? '#FCA5A5' : 'var(--border-default)',
                  borderRadius: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: hasConflict ? 4 : 0,
                }}
              >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    className="flex items-center justify-center rounded-full"
                    style={{
                      width: 18,
                      height: 18,
                      fontSize: 11,
                      backgroundColor: 'var(--color-primary)',
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className="truncate flex items-center gap-1"
                    style={{ fontSize: 13, color: 'var(--text-primary)' }}
                  >
                    {hasConflict && (
                      <span
                        title="סעיף סותר"
                        style={{ color: '#DC2626', flexShrink: 0 }}
                      >
                        ⚠
                      </span>
                    )}
                    {s.title}
                  </span>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onMoveUp(s.id)}
                    disabled={idx === 0}
                    aria-label="הזז למעלה"
                    style={{
                      fontSize: 11,
                      padding: '2px 6px',
                      border: '0.5px solid var(--border-hover)',
                      borderRadius: 3,
                      opacity: idx === 0 ? 0.3 : 1,
                      cursor: idx === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveDown(s.id)}
                    disabled={idx === sorted.length - 1}
                    aria-label="הזז למטה"
                    style={{
                      fontSize: 11,
                      padding: '2px 6px',
                      border: '0.5px solid var(--border-hover)',
                      borderRadius: 3,
                      opacity: idx === sorted.length - 1 ? 0.3 : 1,
                      cursor:
                        idx === sorted.length - 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(s.id)}
                    aria-label="הסר"
                    style={{
                      fontSize: 12,
                      padding: '2px 6px',
                      border: '0.5px solid #FCA5A5',
                      borderRadius: 3,
                      color: '#DC2626',
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
              {hasConflict && (
                <div
                  style={{
                    fontSize: 11,
                    color: '#991B1B',
                    paddingRight: 26,
                    lineHeight: 1.4,
                  }}
                >
                  סותר: {conflictsForThis.join(' · ')}
                </div>
              )}
              </li>
              )
            })}
          </ul>
        )}
      </div>

      <div
        style={{
          paddingTop: 16,
          borderTop: '1px solid var(--border-default)',
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            marginBottom: 6,
          }}
        >
          ספריית סעיפים זמינים
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="חיפוש סעיף..."
          style={{
            width: '100%',
            padding: '8px 10px',
            border: '0.5px solid var(--border-hover)',
            borderRadius: 4,
            fontSize: 13,
            marginBottom: 10,
          }}
        />
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <p
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: 12,
              }}
            >
              לא נמצאו סעיפים
            </p>
          ) : (
            filtered.map((s) => {
              const isAdded = selectedTemplateIds.includes(s.sectionId)
              return (
                <div
                  key={s.sectionId}
                  className="flex items-center justify-between gap-2"
                  style={{
                    padding: '8px 10px',
                    backgroundColor: '#fff',
                    border: '0.5px solid var(--border-default)',
                    borderRadius: 4,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {s.title}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--text-muted)',
                      }}
                    >
                      {CATEGORY_LABELS[s.category]}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAdd(s)}
                    disabled={isAdded}
                    aria-label={isAdded ? 'כבר נוסף' : 'הוסף'}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: isAdded
                        ? '#E5E7EB'
                        : 'var(--color-primary)',
                      color: isAdded ? '#9CA3AF' : '#fff',
                      fontSize: 14,
                      lineHeight: 1,
                      cursor: isAdded ? 'not-allowed' : 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {isAdded ? '✓' : '+'}
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <InfoTip>
          כל סעיף שתוסיפי יופיע מיד בתצוגה המקדימה משמאל עם ההטיות הנכונות.
        </InfoTip>
      </div>
    </div>
  )
}
