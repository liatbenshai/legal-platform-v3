'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { getPersons } from '@/lib/db/persons'
import { createClient } from '@/lib/db/supabase'
import type { Person } from '@/lib/types'

interface PersonPickerProps {
  clientId: string
  selectedIds: string[]
  onChange: (ids: string[]) => void
  multiple?: boolean
  excludeIds?: string[]
  label?: string
}

export function PersonPicker({
  clientId,
  selectedIds,
  onChange,
  multiple = false,
  excludeIds = [],
  label,
}: PersonPickerProps) {
  const [persons, setPersons] = useState<Person[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const groupName = useId()

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)
    const supabase = createClient()
    getPersons(supabase, clientId)
      .then((p) => {
        if (cancelled) return
        setPersons(p)
        setIsLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('שגיאה בטעינת אנשי התיק')
        setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [clientId])

  const visible = useMemo(
    () => persons.filter((p) => !excludeIds.includes(p.id)),
    [persons, excludeIds]
  )

  function handleToggle(id: string) {
    if (multiple) {
      const next = selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
      onChange(next)
    } else {
      onChange([id])
    }
  }

  if (isLoading) {
    return (
      <p className="text-slate-500 text-sm py-4 text-center">
        טוען אנשים...
      </p>
    )
  }

  if (error) {
    return (
      <p
        role="alert"
        className="text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg text-sm"
      >
        {error}
      </p>
    )
  }

  if (visible.length === 0) {
    return (
      <p className="text-slate-500 text-sm py-4 text-center">
        אין אנשים זמינים לבחירה.
      </p>
    )
  }

  return (
    <div>
      {label && (
        <span className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </span>
      )}
      <ul className="space-y-2">
        {visible.map((person) => {
          const isSelected = selectedIds.includes(person.id)
          return (
            <li key={person.id}>
              <label
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  type={multiple ? 'checkbox' : 'radio'}
                  name={groupName}
                  checked={isSelected}
                  onChange={() => handleToggle(person.id)}
                  className="w-4 h-4 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800 truncate">
                    {person.firstName} {person.lastName}
                  </div>
                  <div
                    className="text-sm text-slate-500 truncate"
                    dir="rtl"
                  >
                    ת.ז. {person.idNumber} ·{' '}
                    {person.gender === 'male' ? 'זכר' : 'נקבה'}
                  </div>
                </div>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
