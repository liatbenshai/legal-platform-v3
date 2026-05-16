'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  createUserDictionaryEntry,
  deleteUserDictionaryEntry,
  getUserDictionaryEntries,
  type UserDictionaryEntry,
} from '@/lib/db/dictionary'
import { createClient } from '@/lib/db/supabase'
import { dictionary as staticDictionary } from '@/lib/engine/dictionary'
import { useUser } from '@/lib/hooks/useUser'

interface MergedEntry {
  word: string
  male: string
  female: string
  plural: string
  plural_female?: string
  isSystem: boolean
  dbId?: string
  overridesSystem?: boolean
}

export default function DictionaryPage() {
  const { user, loading: userLoading } = useUser()

  const [userEntries, setUserEntries] = useState<UserDictionaryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showSystem, setShowSystem] = useState(true)
  const [showUser, setShowUser] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<MergedEntry | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [draftWord, setDraftWord] = useState('')
  const [draftMale, setDraftMale] = useState('')
  const [draftFemale, setDraftFemale] = useState('')
  const [draftPlural, setDraftPlural] = useState('')
  const [draftPluralFemale, setDraftPluralFemale] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const loadEntries = useCallback(async () => {
    if (!user) {
      setUserEntries([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const entries = await getUserDictionaryEntries(supabase, user.id)
      setUserEntries(entries)
    } catch {
      setError('שגיאה בטעינת המילון. ייתכן שעדיין לא הרצת את ה-SQL שיצר את הטבלה.')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (userLoading) return
    void loadEntries()
  }, [userLoading, loadEntries])

  const merged = useMemo<MergedEntry[]>(() => {
    const list: MergedEntry[] = []

    for (const [w, infl] of Object.entries(staticDictionary)) {
      list.push({
        word: w,
        male: infl.male,
        female: infl.female,
        plural: infl.plural,
        plural_female: infl.plural_female,
        isSystem: true,
        overridesSystem: false,
      })
    }
    for (const entry of userEntries) {
      list.push({
        word: entry.word,
        male: entry.male,
        female: entry.female,
        plural: entry.plural,
        plural_female: entry.plural_female,
        isSystem: false,
        dbId: entry.id,
        overridesSystem: entry.word in staticDictionary,
      })
    }

    return list.sort((a, b) => a.word.localeCompare(b.word, 'he'))
  }, [userEntries])

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return merged.filter((e) => {
      if (e.isSystem && !showSystem) return false
      if (!e.isSystem && !showUser) return false
      if (!term) return true
      return (
        e.word.toLowerCase().includes(term) ||
        e.male.toLowerCase().includes(term) ||
        e.female.toLowerCase().includes(term) ||
        e.plural.toLowerCase().includes(term)
      )
    })
  }, [merged, searchTerm, showSystem, showUser])

  function resetForm() {
    setDraftWord('')
    setDraftMale('')
    setDraftFemale('')
    setDraftPlural('')
    setDraftPluralFemale('')
    setFormError(null)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    const word = draftWord.trim()
    const male = draftMale.trim()
    const female = draftFemale.trim()
    const plural = draftPlural.trim()
    const pluralFemale = draftPluralFemale.trim()

    if (!word) {
      setFormError('יש להזין מילת מפתח')
      return
    }
    if (!male || !female || !plural) {
      setFormError('יש להזין את שלוש הצורות: זכר, נקבה, רבים')
      return
    }
    if (!user) {
      setFormError('שגיאת אימות')
      return
    }
    if (userEntries.some((u) => u.word === word)) {
      setFormError(`כבר קיים ערך אישי עבור "${word}". מחקי אותו ויצרי מחדש כדי לעדכן.`)
      return
    }

    setIsSaving(true)
    try {
      const supabase = createClient()
      await createUserDictionaryEntry(supabase, user.id, {
        word,
        male,
        female,
        plural,
        plural_female: pluralFemale || undefined,
      })
      resetForm()
      setFormOpen(false)
      await loadEntries()
    } catch {
      setFormError('שגיאה בשמירה. ייתכן שהטבלה לא קיימת — הריצי את ה-SQL.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!entryToDelete?.dbId) return
    setIsDeleting(true)
    try {
      const supabase = createClient()
      await deleteUserDictionaryEntry(supabase, entryToDelete.dbId)
      setEntryToDelete(null)
      await loadEntries()
    } catch {
      setError('שגיאה במחיקה')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-slate-800">מילון הטיות</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/library"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              ← לספריית הסעיפים
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש מילה (זכר/נקבה/רבים)"
              className="flex-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <div className="flex gap-3 text-sm">
              <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showSystem}
                  onChange={(e) => setShowSystem(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>מערכת</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showUser}
                  onChange={(e) => setShowUser(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>שלי</span>
              </label>
            </div>
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              disabled={!user}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              + הטייה חדשה
            </button>
          </div>
        </div>

        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
          <p>
            <strong>איך זה עובד:</strong> ערכי "מערכת" מקובעים בקוד וזמינים לכל
            המשתמשים. ערכים "שלי" נשמרים במסד הנתונים שלך וזמינים רק לך. אם תוסיפי
            ערך אישי עם אותו מפתח של ערך מערכת — הערך האישי שלך גובר.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-slate-500">טוען...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            לא נמצאו ערכים
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                <tr>
                  <th className="text-right p-3 font-semibold">מפתח</th>
                  <th className="text-right p-3 font-semibold">זכר</th>
                  <th className="text-right p-3 font-semibold">נקבה</th>
                  <th className="text-right p-3 font-semibold">רבים</th>
                  <th className="text-right p-3 font-semibold">רבות (אופציונלי)</th>
                  <th className="text-right p-3 font-semibold w-24">מקור</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, idx) => (
                  <tr
                    key={`${e.isSystem ? 'sys' : 'usr'}-${e.word}-${idx}`}
                    className={`border-b border-slate-100 ${
                      e.isSystem ? '' : 'bg-emerald-50/30'
                    }`}
                  >
                    <td className="p-3 font-mono text-slate-800">{e.word}</td>
                    <td className="p-3 text-slate-700">{e.male}</td>
                    <td className="p-3 text-slate-700">{e.female}</td>
                    <td className="p-3 text-slate-700">{e.plural}</td>
                    <td className="p-3 text-slate-500">
                      {e.plural_female ?? '—'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          e.isSystem
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {e.isSystem ? 'מערכת' : e.overridesSystem ? 'שלי (גובר)' : 'שלי'}
                      </span>
                    </td>
                    <td className="p-3">
                      {!e.isSystem && (
                        <button
                          type="button"
                          onClick={() => setEntryToDelete(e)}
                          aria-label="מחק"
                          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded text-lg leading-none"
                        >
                          ×
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative my-8">
            <button
              type="button"
              onClick={() => {
                setFormOpen(false)
                resetForm()
              }}
              aria-label="סגירה"
              disabled={isSaving}
              className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full text-2xl leading-none disabled:opacity-50"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">
              הטייה חדשה
            </h2>
            <p className="text-sm text-slate-500 text-center mb-6">
              לדוגמה: מפתח "מבקש", זכר "מבקש", נקבה "מבקשת", רבים "מבקשים".
              <br />ניתן להשתמש כ-<code dir="ltr" className="font-mono bg-slate-100 px-1 rounded">{'{{ממנה.מבקש}}'}</code> בסעיפים.
            </p>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label
                  htmlFor="dict-word"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  מפתח (כפי שיופיע ב-placeholder) <span className="text-red-600">*</span>
                </label>
                <input
                  id="dict-word"
                  type="text"
                  value={draftWord}
                  onChange={(e) => setDraftWord(e.target.value)}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="dict-male"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    זכר <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="dict-male"
                    type="text"
                    value={draftMale}
                    onChange={(e) => setDraftMale(e.target.value)}
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="dict-female"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    נקבה <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="dict-female"
                    type="text"
                    value={draftFemale}
                    onChange={(e) => setDraftFemale(e.target.value)}
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="dict-plural"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    רבים <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="dict-plural"
                    type="text"
                    value={draftPlural}
                    onChange={(e) => setDraftPlural(e.target.value)}
                    disabled={isSaving}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="dict-plural-female"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    רבות (אופציונלי)
                  </label>
                  <input
                    id="dict-plural-female"
                    type="text"
                    value={draftPluralFemale}
                    onChange={(e) => setDraftPluralFemale(e.target.value)}
                    disabled={isSaving}
                    placeholder="ריק = שווה לרבים"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {formError && (
                <div
                  role="alert"
                  className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
                >
                  {formError}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormOpen(false)
                    resetForm()
                  }}
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
                  {isSaving ? 'שומר...' : 'שמור'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(entryToDelete)}
        title="מחיקת הטייה"
        message={
          entryToDelete
            ? `האם את/ה בטוח/ה שברצונך למחוק את ההטייה של "${entryToDelete.word}"? לא ניתן לשחזר.`
            : ''
        }
        confirmLabel="מחק"
        destructive
        isProcessing={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setEntryToDelete(null)}
      />
    </main>
  )
}
