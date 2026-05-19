'use client'

import { useState } from 'react'
import {
  formatIsraeliDate,
  parseIsraeliDate,
} from '@/lib/utils/israeli-date'

interface IsraeliDateFieldProps {
  label?: string
  value: Date | undefined
  onChange: (next: Date | undefined) => void
  disabled?: boolean
  /** סגנון תצוגה: 'compact' (כמו בעורך) או 'regular' (כמו בטופס יצירה) */
  variant?: 'compact' | 'regular'
}

/**
 * שדה תאריך עם קלט טקסטואלי בפורמט יום/חודש/שנה.
 * אין יותר לוח שנה של הדפדפן — אפשר פשוט להקליד.
 * אימות מתבצע ב-blur. שגיאה מוצגת בעדינות מתחת לשדה.
 */
export function IsraeliDateField({
  label,
  value,
  onChange,
  disabled,
  variant = 'compact',
}: IsraeliDateFieldProps) {
  // טיוטה מקומית כדי לאפשר הקלדה חלקית מבלי לאבד טקסט
  const [draft, setDraft] = useState<string>(
    value ? formatIsraeliDate(value) : ''
  )
  const [hasError, setHasError] = useState(false)

  // סנכרון כאשר הערך החיצוני משתנה (מילוי אוטומטי, טעינה מחדש)
  const [lastSyncedValue, setLastSyncedValue] = useState<Date | undefined>(value)
  if (value?.getTime() !== lastSyncedValue?.getTime()) {
    setLastSyncedValue(value)
    setDraft(value ? formatIsraeliDate(value) : '')
    setHasError(false)
  }

  function commit() {
    const trimmed = draft.trim()
    if (!trimmed) {
      onChange(undefined)
      setHasError(false)
      return
    }
    const parsed = parseIsraeliDate(trimmed)
    if (parsed) {
      onChange(parsed)
      setDraft(formatIsraeliDate(parsed)) // נירמול תצוגה
      setHasError(false)
    } else {
      setHasError(true)
    }
  }

  const isCompact = variant === 'compact'
  const labelSize = isCompact ? 9 : 12
  const labelWeight = isCompact ? 400 : 500
  const labelColor = isCompact ? 'var(--text-muted)' : 'var(--text-secondary)'
  const inputPadding = isCompact ? '4px 6px' : '9px 12px'
  const inputFontSize = isCompact ? 11 : 13

  return (
    <div>
      {label && (
        <p
          style={{
            margin: 0,
            marginBottom: isCompact ? 0 : 5,
            fontSize: labelSize,
            fontWeight: labelWeight,
            color: labelColor,
            display: 'block',
          }}
        >
          {label}
        </p>
      )}
      <input
        type="text"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          if (hasError) setHasError(false)
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            commit()
          }
        }}
        disabled={disabled}
        placeholder="dd/mm/yyyy"
        inputMode="numeric"
        dir="ltr"
        style={{
          width: '100%',
          padding: inputPadding,
          fontSize: inputFontSize,
          border: `0.5px solid ${
            hasError ? '#DC2626' : 'var(--border-hover)'
          }`,
          borderRadius: isCompact ? 3 : 4,
          background: disabled ? 'var(--bg-tertiary)' : '#fff',
          color: 'var(--text-primary)',
          fontFamily: 'inherit',
          textAlign: 'right',
          boxSizing: 'border-box',
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
      {hasError && (
        <p
          style={{
            margin: '2px 0 0',
            fontSize: isCompact ? 9 : 11,
            color: '#DC2626',
          }}
        >
          תאריך לא תקין
        </p>
      )}
    </div>
  )
}
