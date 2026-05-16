'use client'

import { useEffect, useState } from 'react'
import { createClient as createClientRecord } from '@/lib/db/clients'
import { createClient as createSupabaseClient } from '@/lib/db/supabase'

interface NewClientModalProps {
  open: boolean
  userId: string | null
  onClose: () => void
  onSaved: () => void
}

export function NewClientModal({
  open,
  userId,
  onClose,
  onSaved,
}: NewClientModalProps) {
  const [displayName, setDisplayName] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setDisplayName('')
      setNotes('')
      setError(null)
    }
  }, [open])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = displayName.trim()
    if (!trimmedName) {
      setError('יש להזין שם תיק')
      return
    }
    if (!userId) {
      setError('שגיאת אימות — נסה/י להתחבר מחדש')
      return
    }

    setError(null)
    setIsSaving(true)
    try {
      const supabase = createSupabaseClient()
      await createClientRecord(
        supabase,
        userId,
        trimmedName,
        notes.trim() || undefined
      )
      onSaved()
      onClose()
    } catch {
      setError('שגיאה בשמירת הלקוח. נסה/י שוב.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-client-title"
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="סגירה"
          disabled={isSaving}
          className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full text-2xl leading-none disabled:opacity-50"
        >
          ×
        </button>

        <h2
          id="new-client-title"
          className="text-2xl font-bold text-slate-800 mb-2 text-center"
        >
          לקוח חדש
        </h2>
        <p className="text-slate-500 text-center text-sm mb-6">
          יצירת תיק לקוח חדש
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="display-name"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              שם התיק <span className="text-red-600">*</span>
            </label>
            <input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="לדוגמה: משפחת כהן"
              autoFocus
              disabled={isSaving}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              הערות (אופציונלי)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="הערות פנימיות על התיק"
              disabled={isSaving}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-slate-50"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
            >
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
            >
              {isSaving ? 'שומר...' : 'צור לקוח'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
