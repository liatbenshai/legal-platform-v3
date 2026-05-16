'use client'

import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { PersonForm } from '@/components/person/PersonForm'
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
  const [showAddForm, setShowAddForm] = useState(false)
  const groupName = useId()

  const loadPersons = useCallback(async () => {
    const supabase = createClient()
    try {
      const p = await getPersons(supabase, clientId)
      setPersons(p)
      setError(null)
    } catch {
      setError('שגיאה בטעינת אנשי התיק')
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    setIsLoading(true)
    void loadPersons()
  }, [loadPersons])

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

  async function handlePersonCreated(newPerson: Person) {
    await loadPersons()
    if (multiple) {
      onChange([...selectedIds, newPerson.id])
    } else {
      onChange([newPerson.id])
    }
  }

  const addButton = (
    <button
      type="button"
      onClick={() => setShowAddForm(true)}
      className="w-full mt-3 px-4 py-2 border border-dashed border-slate-300 text-slate-600 hover:text-blue-700 hover:border-blue-400 hover:bg-blue-50 rounded-lg text-sm transition-colors"
    >
      + הוסף אדם חדש
    </button>
  )

  function renderBody() {
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
          {persons.length === 0
            ? 'אין אנשים בתיק עדיין.'
            : 'אין אנשים זמינים לבחירה.'}
        </p>
      )
    }

    return (
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
    )
  }

  return (
    <div>
      {label && (
        <span className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </span>
      )}
      {renderBody()}
      {addButton}

      {showAddForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative my-8">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              aria-label="סגירה"
              className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full text-2xl leading-none"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
              הוספת אדם חדש
            </h2>
            <PersonForm
              clientId={clientId}
              onSuccess={(person) => {
                setShowAddForm(false)
                void handlePersonCreated(person)
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
