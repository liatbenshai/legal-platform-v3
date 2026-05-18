'use client'

import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { dictionary } from '@/lib/engine/dictionary'
import { ACTOR_LABELS } from '@/lib/documents/type-config'
import type { ActorRole } from '@/lib/types'

interface PlaceholderInserterProps {
  value: string
  onChange: (value: string) => void
  /** Actor roles to show in the picker. Defaults to all known roles. */
  actorRoles?: ActorRole[]
  rows?: number
  placeholder?: string
  textareaStyle?: React.CSSProperties
}

export interface PlaceholderInserterHandle {
  focus: () => void
}

const IDENTITY_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'שם', label: 'שם מלא' },
  { key: 'שם_פרטי', label: 'שם פרטי' },
  { key: 'שם_משפחה', label: 'שם משפחה' },
  { key: 'תז', label: 'תעודת זהות' },
  { key: 'כתובת', label: 'כתובת' },
  { key: 'עיר', label: 'עיר' },
  { key: 'תאריך_לידה', label: 'תאריך לידה' },
  { key: 'טלפון', label: 'טלפון' },
  { key: 'אימייל', label: 'אימייל' },
]

const DEFAULT_ACTOR_ROLES: ActorRole[] = [
  'ממנה',
  'מיופה',
  'מצווה',
  'יורש',
  'מנהל_עיזבון',
  'בעל',
  'אישה',
  'לקוח',
  'עורך_דין',
]

function humanizeWord(word: string): string {
  return word.replace(/_/g, ' ')
}

export const PlaceholderInserter = forwardRef<
  PlaceholderInserterHandle,
  PlaceholderInserterProps
>(function PlaceholderInserter(
  { value, onChange, actorRoles, rows = 8, placeholder, textareaStyle },
  ref
) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickedActor, setPickedActor] = useState<ActorRole | null>(null)
  const [search, setSearch] = useState('')
  const [variablePromptOpen, setVariablePromptOpen] = useState(false)
  const [variableName, setVariableName] = useState('')

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }))

  const dictionaryWords = useMemo(
    () => Object.keys(dictionary).sort((a, b) => a.localeCompare(b, 'he')),
    []
  )

  const filteredWords = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return dictionaryWords
    return dictionaryWords.filter(
      (w) =>
        w.toLowerCase().includes(term) ||
        dictionary[w].male.includes(term) ||
        dictionary[w].female.includes(term) ||
        dictionary[w].plural.includes(term)
    )
  }, [dictionaryWords, search])

  const roles = actorRoles ?? DEFAULT_ACTOR_ROLES

  function insertAtCursor(text: string) {
    const el = textareaRef.current
    if (!el) {
      onChange(value + text)
      return
    }
    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? value.length
    const next = value.slice(0, start) + text + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      if (!textareaRef.current) return
      const pos = start + text.length
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(pos, pos)
    })
  }

  function wrapSelection(prefix: string, suffix: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart ?? 0
    const end = el.selectionEnd ?? 0
    if (start === end) {
      insertAtCursor(`${prefix}${suffix}`)
      return
    }
    const selected = value.slice(start, end)
    const next =
      value.slice(0, start) + prefix + selected + suffix + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      if (!textareaRef.current) return
      const pos = end + prefix.length + suffix.length
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(pos, pos)
    })
  }

  function handleInsertActorWord(actor: ActorRole, word: string) {
    insertAtCursor(`{{${actor}.${word}}}`)
    setPickerOpen(false)
    setPickedActor(null)
    setSearch('')
  }

  function handleInsertVariable() {
    const name = variableName.trim().replace(/\s+/g, '_')
    if (!name) return
    insertAtCursor(`{{${name}}}`)
    setVariableName('')
    setVariablePromptOpen(false)
  }

  const btnStyle: React.CSSProperties = {
    padding: '5px 10px',
    fontSize: 11,
    color: 'var(--text-secondary)',
    backgroundColor: '#fff',
    border: '0.5px solid var(--border-hover)',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 500,
  }

  return (
    <div>
      <div
        className="flex flex-wrap gap-1.5"
        style={{
          marginBottom: 6,
          padding: '6px 8px',
          backgroundColor: 'var(--bg-secondary)',
          border: '0.5px solid var(--border-default)',
          borderRadius: 4,
        }}
      >
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          style={btnStyle}
          title="הכנסת תפקיד + פועל/תואר (יוטה אוטומטית למגדר)"
        >
          <i className="ti ti-user-plus" style={{ marginLeft: 4 }} />
          תפקיד + ניסוח
        </button>
        <button
          type="button"
          onClick={() => setVariablePromptOpen(true)}
          style={btnStyle}
          title="הוספת שדה חופשי למילוי ידני"
        >
          <i className="ti ti-variable" style={{ marginLeft: 4 }} />
          שדה למילוי
        </button>
        <button
          type="button"
          onClick={() => wrapSelection('**', '**')}
          style={btnStyle}
          title="הדגשה (בחרי טקסט ולחצי)"
        >
          <strong style={{ fontFamily: 'serif' }}>B</strong>
        </button>
        <button
          type="button"
          onClick={() => insertAtCursor('\n\n')}
          style={btnStyle}
          title="פסקה חדשה"
        >
          ¶ פסקה
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        style={{
          width: '100%',
          fontSize: 12,
          padding: '10px 12px',
          border: '0.5px solid var(--border-hover)',
          borderRadius: 4,
          fontFamily: 'inherit',
          lineHeight: 1.6,
          resize: 'vertical',
          backgroundColor: '#fff',
          color: 'var(--text-primary)',
          ...textareaStyle,
        }}
      />

      {pickerOpen && (
        <PickerModal
          onClose={() => {
            setPickerOpen(false)
            setPickedActor(null)
            setSearch('')
          }}
        >
          {!pickedActor ? (
            <>
              <ModalTitle>בחרי תפקיד</ModalTitle>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  marginBottom: 14,
                }}
              >
                בשלב הראשון בוחרים למי הניסוח שייך (הממנה? מיופה הכוח?
                הלקוח?). בשלב השני בוחרים את המילה. הניסוח יוטה אוטומטית
                למגדר של אותו אדם.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setPickedActor(role)}
                    style={{
                      padding: '10px 12px',
                      fontSize: 13,
                      textAlign: 'right',
                      backgroundColor: '#fff',
                      border: '0.5px solid var(--border-hover)',
                      borderRadius: 4,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 500 }}>
                      {ACTOR_LABELS[role].male}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--text-muted)',
                        marginTop: 2,
                      }}
                    >
                      {role}
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <ModalTitle>
                  בחרי ניסוח עבור: {ACTOR_LABELS[pickedActor].male}
                </ModalTitle>
                <button
                  type="button"
                  onClick={() => {
                    setPickedActor(null)
                    setSearch('')
                  }}
                  style={{
                    fontSize: 11,
                    color: 'var(--color-primary)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  → חזרה
                </button>
              </div>

              <div style={{ marginBottom: 10 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    marginBottom: 6,
                  }}
                >
                  פרטי זיהוי
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {IDENTITY_FIELDS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => handleInsertActorWord(pickedActor, f.key)}
                      style={{
                        padding: '4px 10px',
                        fontSize: 11,
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        border: 'none',
                        borderRadius: 3,
                        cursor: 'pointer',
                      }}
                      title={`{{${pickedActor}.${f.key}}}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}
              >
                מילים מהמילון (פועל / תואר / כינוי) — {filteredWords.length}
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש: יבחר, רשאי, מסמיך…"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: 12,
                  border: '0.5px solid var(--border-hover)',
                  borderRadius: 4,
                  marginBottom: 8,
                }}
                autoFocus
              />
              <div
                style={{
                  maxHeight: 280,
                  overflowY: 'auto',
                  border: '0.5px solid var(--border-default)',
                  borderRadius: 4,
                }}
              >
                {filteredWords.length === 0 ? (
                  <div
                    className="text-center py-6"
                    style={{ fontSize: 12, color: 'var(--text-muted)' }}
                  >
                    לא נמצאו מילים. אפשר להוסיף מילים חדשות במילון.
                  </div>
                ) : (
                  filteredWords.map((word, idx) => {
                    const entry = dictionary[word]
                    return (
                      <button
                        key={word}
                        type="button"
                        onClick={() => handleInsertActorWord(pickedActor, word)}
                        className="block w-full text-right"
                        style={{
                          padding: '8px 12px',
                          fontSize: 12,
                          backgroundColor: '#fff',
                          border: 'none',
                          borderTop:
                            idx === 0
                              ? 'none'
                              : '0.5px solid var(--border-default)',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            'var(--bg-secondary)')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = '#fff')
                        }
                      >
                        <div
                          style={{
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {humanizeWord(word)}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: 'var(--text-muted)',
                            marginTop: 2,
                          }}
                        >
                          {entry.male} · {entry.female} · {entry.plural}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </>
          )}
        </PickerModal>
      )}

      {variablePromptOpen && (
        <PickerModal
          onClose={() => {
            setVariablePromptOpen(false)
            setVariableName('')
          }}
        >
          <ModalTitle>הוספת שדה למילוי</ModalTitle>
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              marginBottom: 14,
            }}
          >
            הקלידי את שם השדה (למשל: "סכום חוזה", "תאריך תחילה"). מקפים
            יתחלפו בקווים תחתונים. אחרי שמוסיפים את הסעיף למסמך, יופיע שדה
            למילוי הערך.
          </p>
          <input
            type="text"
            value={variableName}
            onChange={(e) => setVariableName(e.target.value)}
            placeholder="שם השדה"
            style={{
              width: '100%',
              padding: '9px 12px',
              fontSize: 13,
              border: '0.5px solid var(--border-hover)',
              borderRadius: 4,
              marginBottom: 12,
            }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleInsertVariable()
            }}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setVariablePromptOpen(false)
                setVariableName('')
              }}
              style={{
                padding: '7px 14px',
                fontSize: 12,
                backgroundColor: '#fff',
                border: '0.5px solid var(--border-hover)',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              ביטול
            </button>
            <button
              type="button"
              onClick={handleInsertVariable}
              disabled={!variableName.trim()}
              style={{
                padding: '7px 16px',
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: !variableName.trim() ? 'not-allowed' : 'pointer',
                opacity: !variableName.trim() ? 0.5 : 1,
              }}
            >
              הוספה
            </button>
          </div>
        </PickerModal>
      )}
    </div>
  )
})

function PickerModal({
  onClose,
  children,
}: {
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(79, 54, 37, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          borderRadius: 8,
          padding: 22,
          minWidth: 420,
          maxWidth: 560,
          width: '100%',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 12px 32px rgba(79, 54, 37, 0.18)',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function ModalTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="doc-title"
      style={{
        fontSize: 17,
        fontWeight: 500,
        color: 'var(--color-primary)',
        margin: 0,
      }}
    >
      {children}
    </h3>
  )
}
