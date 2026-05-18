'use client'

import { useState } from 'react'
import { PlaceholderInserter } from '@/components/editor/PlaceholderInserter'
import { createUserTemplate, type TemplateInput } from '@/lib/db/templates'
import { createClient } from '@/lib/db/supabase'
import type { ActorRole, DocumentType } from '@/lib/types'

interface SectionEditorProps {
  open: boolean
  userId: string | null
  onClose: () => void
  onSaved: () => void
}

const CATEGORY_OPTIONS: Array<{ value: DocumentType; label: string }> = [
  { value: 'poa-property', label: 'רכושי' },
  { value: 'poa-personal', label: 'אישי' },
  { value: 'poa-medical', label: 'רפואי' },
]

const ACTOR_OPTIONS: Array<{ value: ActorRole; label: string }> = [
  { value: 'ממנה', label: 'ממנה' },
  { value: 'מיופה', label: 'מיופה כוח' },
]

const PLACEHOLDER_EXAMPLES: Array<{ code: string; meaning: string }> = [
  { code: '{{ממנה.שם}}', meaning: 'שם מלא של הממנה' },
  { code: '{{ממנה.תז}}', meaning: 'תעודת זהות של הממנה' },
  { code: '{{ממנה.כתובת}}', meaning: 'כתובת הממנה' },
  { code: '{{ממנה.מצהיר}}', meaning: 'מצהיר / מצהירה / מצהירים' },
  { code: '{{ממנה.מבקש}}', meaning: 'מבקש / מבקשת / מבקשים' },
  { code: '{{ממנה.מעדיף}}', meaning: 'מעדיף / מעדיפה / מעדיפים' },
  { code: '{{מיופה.שם}}', meaning: 'שם מיופה הכוח' },
  { code: '{{מיופה.מיופה_כוח}}', meaning: 'מיופה הכוח / מיופת / מיופי' },
  { code: '{{מיופה.רשאי}}', meaning: 'רשאי / רשאית / רשאים' },
  { code: '{{מיופה.יפעל}}', meaning: 'יפעל / תפעל / יפעלו' },
  { code: '{{מיופה.תפקידו}}', meaning: 'תפקידו / תפקידה / תפקידם' },
  { code: '{{מיופה.אינו}}', meaning: 'אינו / אינה / אינם' },
]

export function SectionEditor({
  open,
  userId,
  onClose,
  onSaved,
}: SectionEditorProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<DocumentType>('poa-property')
  const [requiredActors, setRequiredActors] = useState<ActorRole[]>([
    'ממנה',
    'מיופה',
  ])
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  if (!open) return null

  function toggleActor(role: ActorRole) {
    setRequiredActors((curr) =>
      curr.includes(role) ? curr.filter((r) => r !== role) : [...curr, role]
    )
  }

  function insertPlaceholder(code: string) {
    setContent((curr) => (curr ? `${curr} ${code}` : code))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('יש להזין כותרת לסעיף')
      return
    }
    if (!content.trim()) {
      setError('יש להזין תוכן לסעיף')
      return
    }
    if (!userId) {
      setError('שגיאת אימות — נסה/י להתחבר מחדש')
      return
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    const input: TemplateInput = {
      category,
      documentTypes: [category],
      title: trimmedTitle,
      description: description.trim(),
      variants: [
        {
          id: 'default',
          label: 'סטנדרטי',
          content,
        },
      ],
      requiredActors,
      legalBasis: '',
      isRequired: false,
      conflictsWith: [],
      tags,
    }

    setIsSaving(true)
    try {
      const supabase = createClient()
      await createUserTemplate(supabase, userId, input)
      onSaved()
      onClose()
      // reset for next time
      setTitle('')
      setDescription('')
      setCategory('poa-property')
      setRequiredActors(['ממנה', 'מיופה'])
      setContent('')
      setTagsInput('')
    } catch {
      setError('שגיאה בשמירה. נסה/י שוב.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="section-editor-title"
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6 relative my-8">
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
          id="section-editor-title"
          className="text-2xl font-bold text-slate-800 mb-6 text-center"
        >
          סעיף חדש
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="section-title"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  כותרת <span className="text-red-600">*</span>
                </label>
                <input
                  id="section-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="section-description"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  תיאור קצר
                </label>
                <input
                  id="section-description"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="במה הסעיף עוסק"
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-slate-700 mb-2">
                  קטגוריה <span className="text-red-600">*</span>
                </span>
                <div className="flex gap-4">
                  {CATEGORY_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="category"
                        checked={category === opt.value}
                        onChange={() => setCategory(opt.value)}
                        disabled={isSaving}
                        className="w-4 h-4"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-sm font-medium text-slate-700 mb-2">
                  שחקנים בסעיף
                </span>
                <div className="flex gap-4">
                  {ACTOR_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={requiredActors.includes(opt.value)}
                        onChange={() => toggleActor(opt.value)}
                        disabled={isSaving}
                        className="w-4 h-4"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="section-content"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  תוכן הסעיף <span className="text-red-600">*</span>
                </label>
                <PlaceholderInserter
                  value={content}
                  onChange={setContent}
                  rows={12}
                  placeholder="כתבי כאן את תוכן הסעיף. השתמשי בכלים שלמעלה כדי להכניס שדות שיוטו אוטומטית למגדר."
                />
              </div>

              <div>
                <label
                  htmlFor="section-tags"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  תגיות (מופרדות בפסיק)
                </label>
                <input
                  id="section-tags"
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="לדוגמה: נדלן, מכירה, נכס"
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <aside className="bg-slate-50 border border-slate-200 rounded-lg p-4 h-fit lg:sticky lg:top-4">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">
                לוח Placeholders
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                לחיצה תוסיף את ה-placeholder לסוף התוכן.
              </p>
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {PLACEHOLDER_EXAMPLES.map((p) => (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => insertPlaceholder(p.code)}
                    disabled={isSaving}
                    className="w-full text-right p-2 bg-white border border-slate-200 rounded hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    <div className="font-mono text-xs text-blue-700" dir="ltr">
                      {p.code}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {p.meaning}
                    </div>
                  </button>
                ))}
              </div>
            </aside>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
            >
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-6 mt-6 border-t border-slate-200">
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
              {isSaving ? 'שומר...' : 'צור סעיף'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
