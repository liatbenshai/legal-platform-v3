'use client'

import { useState } from 'react'
import type { Gender } from '@/lib/types'

interface InlineGenderFieldProps {
  label: string
  value: Gender
  onSave: (next: Gender) => Promise<void>
}

const GENDER_LABELS: Record<Gender, string> = {
  female: 'נקבה',
  male: 'זכר',
}

export function InlineGenderField({
  label,
  value,
  onSave,
}: InlineGenderFieldProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Gender
    if (next === value) return
    setSaving(true)
    setError(null)
    try {
      await onSave(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        padding: '8px 10px',
        borderRadius: 4,
        position: 'relative',
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 10,
          color: 'var(--text-muted)',
        }}
      >
        {label}
      </p>
      <select
        value={value}
        onChange={handleChange}
        disabled={saving}
        style={{
          marginTop: 3,
          fontSize: 13,
          padding: '2px 4px',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-primary)',
          fontFamily: 'inherit',
          cursor: saving ? 'wait' : 'pointer',
          appearance: 'auto',
          width: '100%',
        }}
      >
        <option value="female">{GENDER_LABELS.female}</option>
        <option value="male">{GENDER_LABELS.male}</option>
      </select>
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
