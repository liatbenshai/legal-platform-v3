'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { PersonPicker } from '@/components/person/PersonPicker'
import { createDocument, updateDocument } from '@/lib/db/documents'
import { getPersons } from '@/lib/db/persons'
import { createClient } from '@/lib/db/supabase'
import { useUser } from '@/lib/hooks/useUser'
import type { DocumentType, Person } from '@/lib/types'

const DOC_TYPE_OPTIONS: Array<{ value: DocumentType; label: string }> = [
  { value: 'poa-property', label: 'ייפוי כוח מתמשך' },
]

type Step = 1 | 2 | 3

export default function NewDocumentPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useUser()
  const clientId = params.id

  const [persons, setPersons] = useState<Person[]>([])
  const [isLoadingPersons, setIsLoadingPersons] = useState(true)

  const [step, setStep] = useState<Step>(1)
  const [docType, setDocType] = useState<DocumentType>('poa-property')
  const [principalIds, setPrincipalIds] = useState<string[]>([])
  const [attorneyIds, setAttorneyIds] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    getPersons(supabase, clientId)
      .then((p) => {
        if (cancelled) return
        setPersons(p)
        setIsLoadingPersons(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('שגיאה בטעינת אנשי התיק')
        setIsLoadingPersons(false)
      })
    return () => {
      cancelled = true
    }
  }, [clientId])

  const principal = useMemo(
    () => persons.find((p) => p.id === principalIds[0]),
    [persons, principalIds]
  )

  const attorneys = useMemo(
    () =>
      attorneyIds
        .map((id) => persons.find((p) => p.id === id))
        .filter((p): p is Person => p !== undefined),
    [persons, attorneyIds]
  )

  const canGoNext =
    (step === 1 && Boolean(docType)) ||
    (step === 2 && principalIds.length === 1) ||
    (step === 3 && attorneyIds.length >= 1)

  function handleNext() {
    if (step < 3) setStep((s) => (s + 1) as Step)
  }

  function handleBack() {
    if (step > 1) setStep((s) => (s - 1) as Step)
  }

  async function handleCreate() {
    if (!user || !principal || attorneys.length === 0) return
    setIsCreating(true)
    setError(null)
    try {
      const supabase = createClient()
      const title = `ייפוי כוח - ${principal.firstName} ${principal.lastName}`
      const newDoc = await createDocument(
        supabase,
        clientId,
        user.id,
        docType,
        title
      )
      const updated = await updateDocument(supabase, newDoc.id, {
        title: newDoc.title,
        status: newDoc.status,
        actors: [
          { role: 'ממנה', personIds: principalIds },
          { role: 'מיופה', personIds: attorneyIds },
        ],
        variables: newDoc.variables,
        sections: newDoc.sections,
      })
      router.push(`/clients/${clientId}/documents/${updated.id}`)
    } catch {
      setError('שגיאה ביצירת המסמך. נסה/י שוב.')
      setIsCreating(false)
    }
  }

  if (isLoadingPersons) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center text-slate-500">
          טוען...
        </div>
      </main>
    )
  }

  if (persons.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-800">מסמך חדש</h1>
            <Link
              href={`/clients/${clientId}`}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              ← חזרה לתיק
            </Link>
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="text-slate-700 text-lg font-medium mb-2">
            אין אנשים בתיק
          </p>
          <p className="text-slate-500 text-sm mb-6">
            כדי ליצור מסמך, צריך לפחות שני אנשים בתיק: ממנה ומיופה כוח.
          </p>
          <Link
            href={`/clients/${clientId}`}
            className="inline-flex items-center px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            חזרה לתיק להוספת אנשים
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">מסמך חדש</h1>
          <Link
            href={`/clients/${clientId}`}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← ביטול וחזרה לתיק
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div
                className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium ${
                  step === n
                    ? 'bg-blue-600 text-white'
                    : step > n
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-200 text-slate-500'
                }`}
              >
                {n}
              </div>
              {n < 3 && (
                <div
                  className={`w-14 h-0.5 ${
                    step > n ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
          >
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          {step === 1 && (
            <>
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                סוג המסמך
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                בחר/י את סוג המסמך שברצונך ליצור.
              </p>
              <label
                htmlFor="docType"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                סוג מסמך
              </label>
              <select
                id="docType"
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentType)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DOC_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                בחירת ממנה
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                בחר/י אדם אחד שיהיה הממנה במסמך.
              </p>
              <PersonPicker
                clientId={clientId}
                selectedIds={principalIds}
                onChange={setPrincipalIds}
                multiple={false}
              />
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                בחירת מיופי כוח
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                בחר/י אדם אחד או יותר שיהיו מיופי הכוח (לא כולל הממנה).
              </p>
              <PersonPicker
                clientId={clientId}
                selectedIds={attorneyIds}
                onChange={setAttorneyIds}
                multiple={true}
                excludeIds={principalIds}
              />

              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-base font-semibold text-slate-800 mb-3">
                  סקירה לפני יצירה
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <dt className="font-medium text-slate-600 min-w-[6rem]">
                      סוג:
                    </dt>
                    <dd className="text-slate-800">
                      {DOC_TYPE_OPTIONS.find((o) => o.value === docType)?.label}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-medium text-slate-600 min-w-[6rem]">
                      ממנה:
                    </dt>
                    <dd className="text-slate-800">
                      {principal
                        ? `${principal.firstName} ${principal.lastName}`
                        : '-'}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-medium text-slate-600 min-w-[6rem]">
                      מיופי כוח:
                    </dt>
                    <dd className="text-slate-800">
                      {attorneys.length === 0
                        ? '-'
                        : attorneys
                            .map((a) => `${a.firstName} ${a.lastName}`)
                            .join(', ')}
                    </dd>
                  </div>
                </dl>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1 || isCreating}
            className="px-5 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            הקודם
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:bg-blue-300 disabled:cursor-not-allowed"
            >
              הבא
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              disabled={!canGoNext || isCreating || !user}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg disabled:bg-emerald-300 disabled:cursor-not-allowed"
            >
              {isCreating ? 'יוצר...' : 'צור מסמך'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
