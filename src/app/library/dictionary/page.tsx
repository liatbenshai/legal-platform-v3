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

  const inputStyle: React.CSSProperties = {
    padding: '9px 12px',
    fontSize: 13,
    backgroundColor: '#fff',
    border: '0.5px solid var(--border-hover)',
    borderRadius: 4,
    color: 'var(--text-primary)',
  }

  return (
    <main
      style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}
    >
      <header
        style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <h1
            className="doc-title"
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: 'var(--color-primary)',
              margin: 0,
            }}
          >
            מילון הטיות
          </h1>
          <Link
            href="/library"
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
            }}
          >
            → לספריית הסעיפים
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש מילה (זכר/נקבה/רבים)"
              className="flex-1 w-full"
              style={inputStyle}
            />
            <div className="flex gap-3" style={{ fontSize: 13 }}>
              <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showSystem}
                  onChange={(e) => setShowSystem(e.target.checked)}
                  style={{ width: 14, height: 14 }}
                />
                <span>מערכת</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showUser}
                  onChange={(e) => setShowUser(e.target.checked)}
                  style={{ width: 14, height: 14 }}
                />
                <span>שלי</span>
              </label>
            </div>
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              disabled={!user}
              style={{
                padding: '9px 18px',
                fontSize: 13,
                fontWeight: 500,
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                whiteSpace: 'nowrap',
                cursor: !user ? 'not-allowed' : 'pointer',
                opacity: !user ? 0.5 : 1,
              }}
            >
              + הטייה חדשה
            </button>
          </div>
        </div>

        <div
          style={{
            marginBottom: 16,
            padding: '10px 12px',
            backgroundColor: 'var(--color-accent-bg)',
            borderRight: '3px solid var(--color-accent)',
            borderRadius: 4,
            fontSize: 12,
            lineHeight: 1.5,
            color: '#92660A',
          }}
        >
          <i
            className="ti ti-bulb"
            style={{ marginLeft: 6, fontSize: 12 }}
          />
          <strong>איך זה עובד:</strong> ערכי &quot;מערכת&quot; מקובעים בקוד
          וזמינים לכל המשתמשים. ערכים &quot;שלי&quot; נשמרים במסד הנתונים שלך
          וזמינים רק לך. אם תוסיפי ערך אישי עם אותו מפתח של ערך מערכת — הערך
          האישי שלך גובר.
        </div>

        {error && (
          <div
            role="alert"
            style={{
              marginBottom: 16,
              padding: '12px 16px',
              backgroundColor: '#FEE2E2',
              border: '0.5px solid #FCA5A5',
              color: '#991B1B',
              borderRadius: 4,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <div
            className="text-center py-12"
            style={{ color: 'var(--text-muted)', fontSize: 13 }}
          >
            טוען...
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-12"
            style={{ color: 'var(--text-muted)', fontSize: 13 }}
          >
            לא נמצאו ערכים
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#fff',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <table className="w-full" style={{ fontSize: 13 }}>
              <thead
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderBottom: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                }}
              >
                <tr>
                  <th
                    className="text-right"
                    style={{ padding: '10px 14px', fontSize: 12, fontWeight: 500 }}
                  >
                    מפתח
                  </th>
                  <th
                    className="text-right"
                    style={{ padding: '10px 14px', fontSize: 12, fontWeight: 500 }}
                  >
                    זכר
                  </th>
                  <th
                    className="text-right"
                    style={{ padding: '10px 14px', fontSize: 12, fontWeight: 500 }}
                  >
                    נקבה
                  </th>
                  <th
                    className="text-right"
                    style={{ padding: '10px 14px', fontSize: 12, fontWeight: 500 }}
                  >
                    רבים
                  </th>
                  <th
                    className="text-right"
                    style={{ padding: '10px 14px', fontSize: 12, fontWeight: 500 }}
                  >
                    רבות (אופציונלי)
                  </th>
                  <th
                    className="text-right"
                    style={{
                      padding: '10px 14px',
                      fontSize: 12,
                      fontWeight: 500,
                      width: 90,
                    }}
                  >
                    מקור
                  </th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, idx) => (
                  <tr
                    key={`${e.isSystem ? 'sys' : 'usr'}-${e.word}-${idx}`}
                    style={{
                      borderTop: idx === 0 ? 'none' : '0.5px solid var(--border-default)',
                      backgroundColor: e.isSystem ? '#fff' : '#FFFBEB',
                    }}
                  >
                    <td
                      style={{
                        padding: '10px 14px',
                        fontFamily: 'ui-monospace, monospace',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {e.word}
                    </td>
                    <td
                      style={{ padding: '10px 14px', color: 'var(--text-primary)' }}
                    >
                      {e.male}
                    </td>
                    <td
                      style={{ padding: '10px 14px', color: 'var(--text-primary)' }}
                    >
                      {e.female}
                    </td>
                    <td
                      style={{ padding: '10px 14px', color: 'var(--text-primary)' }}
                    >
                      {e.plural}
                    </td>
                    <td
                      style={{ padding: '10px 14px', color: 'var(--text-muted)' }}
                    >
                      {e.plural_female ?? '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 3,
                          backgroundColor: e.isSystem
                            ? '#F3F4F6'
                            : '#FEF3C7',
                          color: e.isSystem ? '#6B7280' : '#92660A',
                        }}
                      >
                        {e.isSystem
                          ? 'מערכת'
                          : e.overridesSystem
                            ? 'שלי (גובר)'
                            : 'שלי'}
                      </span>
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      {!e.isSystem && (
                        <button
                          type="button"
                          onClick={() => setEntryToDelete(e)}
                          aria-label="מחק"
                          style={{
                            width: 24,
                            height: 24,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: 4,
                            fontSize: 16,
                            lineHeight: 1,
                          }}
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
