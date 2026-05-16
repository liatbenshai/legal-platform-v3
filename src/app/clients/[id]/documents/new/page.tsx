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

const DOMAIN_OPTIONS: Array<{ value: DocumentType; label: string }> = [
  { value: 'poa-property', label: 'רכושי' },
  { value: 'poa-personal', label: 'אישי' },
  { value: 'poa-medical', label: 'רפואי' },
]

type Step = 1 | 2 | 3

function deriveAttorneyTitle(persons: Person[]): string {
  if (persons.length === 0) return '—'
  if (persons.length > 1) return 'מיופי הכוח'
  return persons[0].gender === 'female' ? 'מיופת הכוח' : 'מיופה הכוח'
}

export default function NewDocumentPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useUser()
  const clientId = params.id

  const [persons, setPersons] = useState<Person[]>([])
  const [isLoadingPersons, setIsLoadingPersons] = useState(true)

  const [step, setStep] = useState<Step>(1)
  const [principalIds, setPrincipalIds] = useState<string[]>([])
  const [attorneyIds, setAttorneyIds] = useState<string[]>([])
  const [selectedDomains, setSelectedDomains] = useState<DocumentType[]>([
    'poa-property',
  ])
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

  const attorneyTitle = useMemo(
    () => deriveAttorneyTitle(attorneys),
    [attorneys]
  )

  const canGoNext =
    (step === 1 && principalIds.length === 1) ||
    (step === 2 && attorneyIds.length >= 1) ||
    (step === 3 && selectedDomains.length >= 1)

  function handleNext() {
    if (step < 3) setStep((s) => (s + 1) as Step)
  }

  function handleBack() {
    if (step > 1) setStep((s) => (s - 1) as Step)
  }

  function toggleDomain(domain: DocumentType) {
    setSelectedDomains((curr) =>
      curr.includes(domain)
        ? curr.filter((d) => d !== domain)
        : [...curr, domain]
    )
  }

  async function handleCreate() {
    if (
      !user ||
      !principal ||
      attorneys.length === 0 ||
      selectedDomains.length === 0
    ) {
      return
    }
    setIsCreating(true)
    setError(null)
    try {
      const supabase = createClient()
      const title = `ייפוי כוח - ${principal.firstName} ${principal.lastName}`
      const primaryType = selectedDomains[0]
      const newDoc = await createDocument(
        supabase,
        clientId,
        user.id,
        primaryType,
        title
      )
      const updated = await updateDocument(supabase, newDoc.id, {
        title: newDoc.title,
        status: newDoc.status,
        actors: [
          { role: 'ממנה', personIds: principalIds },
          { role: 'מיופה', personIds: attorneyIds },
        ],
        variables: {
          ...newDoc.variables,
          domains: selectedDomains.join(','),
        },
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
          <h1 className="text-xl font-bold text-slate-800">
            ייפוי כוח מתמשך - מסמך חדש
          </h1>
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
                onPersonCreated={(p) =>
                  setPersons((curr) => [...curr, p])
                }
              />
            </>
          )}

          {step === 2 && (
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
                onPersonCreated={(p) =>
                  setPersons((curr) => [...curr, p])
                }
              />

              {attorneys.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                  <strong className="text-blue-900">תפקיד במסמך:</strong>{' '}
                  <span className="text-blue-800">{attorneyTitle}</span>
                  <span className="text-blue-600 text-xs mr-2">
                    ({attorneys.length === 1 ? 'יחיד/ה' : `${attorneys.length} אנשים`})
                  </span>
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                תחומי האחריות
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                בחר/י אילו תחומים הייפוי כוח יכלול. ניתן לבחור יותר מאחד.
              </p>

              <div className="space-y-2">
                {DOMAIN_OPTIONS.map((opt) => {
                  const isSelected = selectedDomains.includes(opt.value)
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleDomain(opt.value)}
                        className="w-4 h-4 flex-shrink-0"
                      />
                      <span className="font-medium text-slate-800">
                        {opt.label}
                      </span>
                    </label>
                  )
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-base font-semibold text-slate-800 mb-3">
                  סקירה לפני יצירה
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <dt className="font-medium text-slate-600 min-w-[7rem]">
                      ממנה:
                    </dt>
                    <dd className="text-slate-800">
                      {principal
                        ? `${principal.firstName} ${principal.lastName} (${principal.gender === 'female' ? 'נקבה' : 'זכר'})`
                        : '-'}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-medium text-slate-600 min-w-[7rem]">
                      {attorneyTitle}:
                    </dt>
                    <dd className="text-slate-800">
                      {attorneys.length === 0
                        ? '-'
                        : attorneys
                            .map((a) => `${a.firstName} ${a.lastName}`)
                            .join(', ')}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-medium text-slate-600 min-w-[7rem]">
                      תחומים:
                    </dt>
                    <dd className="text-slate-800">
                      {selectedDomains.length === 0
                        ? '-'
                        : selectedDomains
                            .map(
                              (d) =>
                                DOMAIN_OPTIONS.find((o) => o.value === d)?.label
                            )
                            .filter(Boolean)
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
