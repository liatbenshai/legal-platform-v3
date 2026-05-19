'use client'

import { useRef, useState } from 'react'

export type InlineEditType = 'text' | 'email' | 'tel' | 'date'

interface InlineEditFieldProps {
  label: string
  /** הערך המוצג. ניתן להעביר מחרוזת ריקה כדי להציג placeholder. */
  value: string
  /** טקסט להצגה כשהשדה ריק */
  emptyPlaceholder?: string
  /** טקסט בתוך ה-input בעת עריכה (אם רוצים) */
  inputPlaceholder?: string
  type?: InlineEditType
  /** כיוון תצוגה — חשוב למספרים ולמייל (ltr) */
  dir?: 'rtl' | 'ltr'
  /** מתבצע כשהמשתמש שומר. צריך להחזיר Promise.
   *  אם זורק שגיאה — הרכיב יישאר במצב עריכה ויציג הודעה. */
  onSave: (next: string) => Promise<void>
}

/**
 * שדה עם תצוגה רגילה + מעבר למצב עריכה ב-click.
 * שמירה ב: blur, Enter, או לחיצה על V.
 * ביטול ב: Escape, או לחיצה על X.
 */
export function InlineEditField({
  label,
  value,
  emptyPlaceholder = 'לחצי להוספה',
  inputPlaceholder,
  type = 'text',
  dir = 'rtl',
  onSave,
}: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cancelRef = useRef(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  function startEdit() {
    setDraft(value ?? '')
    setError(null)
    cancelRef.current = false
    setEditing(true)
  }

  async function commit() {
    if (cancelRef.current) {
      cancelRef.current = false
      setEditing(false)
      return
    }
    const trimmed = draft.trim()
    const original = (value ?? '').trim()
    if (trimmed === original) {
      setEditing(false)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(trimmed)
      setEditing(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'שגיאה בשמירה'
      )
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    cancelRef.current = true
    setDraft(value ?? '')
    setEditing(false)
  }

  // תצוגת ערך (פורמט תאריכים יפה יותר)
  function displayValue(): string {
    if (!value) return ''
    if (type === 'date') {
      // הערך מגיע כ-YYYY-MM-DD; הצגה כ-DD/MM/YYYY
      const parts = value.split('-')
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
    }
    return value
  }

  if (editing) {
    return (
      <div
        style={{
          padding: '8px 10px',
          borderRadius: 4,
          background: 'var(--color-accent-bg)',
          border: '1px solid var(--color-accent)',
        }}
      >
        <p
          style={{
            margin: '0 0 4px',
            fontSize: 10,
            color: 'var(--status-review-fg)',
            fontWeight: 500,
          }}
        >
          {label} · עריכה
        </p>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <input
            ref={inputRef}
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              // delay כדי לאפשר ל-onMouseDown של כפתור הביטול לקבוע cancelRef
              setTimeout(commit, 0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                inputRef.current?.blur()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                cancel()
              }
            }}
            autoFocus
            disabled={saving}
            dir={dir}
            placeholder={inputPlaceholder}
            style={{
              flex: 1,
              padding: '4px 6px',
              fontSize: 12,
              border: '0.5px solid var(--border-hover)',
              borderRadius: 3,
              background: '#fff',
              textAlign: dir === 'ltr' ? 'right' : 'right',
              fontFamily: 'inherit',
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            disabled={saving}
            aria-label="שמור"
            style={{
              background: 'var(--status-success)',
              color: '#fff',
              border: 'none',
              width: 22,
              height: 22,
              borderRadius: 3,
              fontSize: 11,
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: saving ? 0.5 : 1,
            }}
          >
            <i className="ti ti-check" style={{ fontSize: 13 }} aria-hidden="true" />
          </button>
          <button
            type="button"
            onMouseDown={() => {
              cancelRef.current = true
            }}
            onClick={cancel}
            aria-label="ביטול"
            style={{
              background: '#fff',
              color: 'var(--text-muted)',
              border: '0.5px solid var(--border-hover)',
              width: 22,
              height: 22,
              borderRadius: 3,
              fontSize: 11,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <i className="ti ti-x" style={{ fontSize: 13 }} aria-hidden="true" />
          </button>
        </div>
        {error && (
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 11,
              color: '#DC2626',
            }}
          >
            {error}
          </p>
        )}
      </div>
    )
  }

  const isEmpty = !value
  return (
    <button
      type="button"
      onClick={startEdit}
      style={{
        all: 'unset',
        display: 'block',
        width: '100%',
        padding: '8px 10px',
        borderRadius: 4,
        cursor: 'pointer',
        boxSizing: 'border-box',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-secondary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: 10,
              color: 'var(--text-muted)',
            }}
          >
            {label}
          </p>
          <p
            style={{
              margin: '3px 0 0',
              fontSize: 13,
              color: isEmpty
                ? 'var(--text-muted)'
                : 'var(--text-primary)',
              fontStyle: isEmpty ? 'italic' : 'normal',
              direction: dir,
              textAlign: 'right',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {isEmpty ? emptyPlaceholder : displayValue()}
          </p>
        </div>
        <i
          className="ti ti-pencil"
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            opacity: 0.6,
            flexShrink: 0,
          }}
          aria-hidden="true"
        />
      </div>
    </button>
  )
}
