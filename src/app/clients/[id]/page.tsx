'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { PersonForm } from '@/components/person/PersonForm'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  deleteClient,
  getClient,
  updateClient,
} from '@/lib/db/clients'
import { deletePerson, getPersons } from '@/lib/db/persons'
import { getDocuments } from '@/lib/db/documents'
import { createClient as createSupabaseClient } from '@/lib/db/supabase'
import type {
  Client,
  Document,
  DocumentStatus,
  DocumentType,
  Person,
} from '@/lib/types'

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  'poa-property': 'ייפוי כוח רכושי',
  'poa-personal': 'ייפוי כוח אישי',
  'poa-medical': 'ייפוי כוח רפואי',
  'will-individual': 'צוואת יחיד',
  'will-mutual': 'צוואה הדדית',
  prenup: 'הסכם ממון',
  divorce: 'הסכם גירושין',
  partition: 'פירוק שיתוף',
  'fee-agreement': 'הסכם שכר טרחה',
}

const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'טיוטה',
  review: 'לבדיקה',
  signed: 'חתום',
}

const STATUS_STYLES: Record<DocumentStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  review: 'bg-amber-100 text-amber-800',
  signed: 'bg-emerald-100 text-emerald-800',
}

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const clientId = params.id

  const [supabase] = useState(() => createSupabaseClient())

  const [client, setClient] = useState<Client | null>(null)
  const [persons, setPersons] = useState<Person[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<'persons' | 'documents'>('persons')

  const [isEditingName, setIsEditingName] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [draftNotes, setDraftNotes] = useState('')
  const [isSavingClient, setIsSavingClient] = useState(false)

  const [personModalOpen, setPersonModalOpen] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | undefined>(
    undefined
  )

  const [confirmDeleteClientOpen, setConfirmDeleteClientOpen] = useState(false)
  const [isDeletingClient, setIsDeletingClient] = useState(false)
  const [confirmDeletePersonId, setConfirmDeletePersonId] = useState<
    string | null
  >(null)
  const [isDeletingPerson, setIsDeletingPerson] = useState(false)

  const loadAll = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [c, p, d] = await Promise.all([
        getClient(supabase, clientId),
        getPersons(supabase, clientId),
        getDocuments(supabase, clientId),
      ])
      setClient(c)
      setPersons(p)
      setDocuments(d)
    } catch {
      setError('שגיאה בטעינת תיק הלקוח')
    } finally {
      setIsLoading(false)
    }
  }, [supabase, clientId])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const reloadPersons = useCallback(async () => {
    try {
      const p = await getPersons(supabase, clientId)
      setPersons(p)
    } catch {
      setError('שגיאה בטעינת אנשי התיק')
    }
  }, [supabase, clientId])

  async function handleSaveName() {
    if (!client) return
    const trimmed = draftName.trim()
    if (!trimmed) {
      setIsEditingName(false)
      return
    }
    if (trimmed === client.displayName) {
      setIsEditingName(false)
      return
    }
    setIsSavingClient(true)
    try {
      const updated = await updateClient(supabase, client.id, trimmed, client.notes)
      setClient(updated)
      setIsEditingName(false)
    } catch {
      setError('שגיאה בשמירת השם')
    } finally {
      setIsSavingClient(false)
    }
  }

  async function handleSaveNotes() {
    if (!client) return
    const trimmed = draftNotes.trim()
    const newNotes = trimmed || undefined
    if (newNotes === (client.notes ?? undefined)) {
      setIsEditingNotes(false)
      return
    }
    setIsSavingClient(true)
    try {
      const updated = await updateClient(
        supabase,
        client.id,
        client.displayName,
        newNotes
      )
      setClient(updated)
      setIsEditingNotes(false)
    } catch {
      setError('שגיאה בשמירת ההערות')
    } finally {
      setIsSavingClient(false)
    }
  }

  async function handleDeleteClient() {
    if (!client) return
    setIsDeletingClient(true)
    try {
      await deleteClient(supabase, client.id)
      router.push('/clients')
    } catch {
      setError('שגיאה במחיקת הלקוח')
      setIsDeletingClient(false)
      setConfirmDeleteClientOpen(false)
    }
  }

  async function handleDeletePerson() {
    if (!confirmDeletePersonId) return
    setIsDeletingPerson(true)
    try {
      await deletePerson(supabase, confirmDeletePersonId)
      setConfirmDeletePersonId(null)
      await reloadPersons()
    } catch {
      setError('שגיאה במחיקת האדם')
    } finally {
      setIsDeletingPerson(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center text-slate-500">
          טוען תיק לקוח...
        </div>
      </main>
    )
  }

  if (!client) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <p className="text-slate-700 text-lg font-medium">תיק לא נמצא</p>
          <Link
            href="/clients"
            className="text-blue-600 hover:text-blue-700 text-sm mt-3 inline-block"
          >
            ← חזרה לרשימת הלקוחות
          </Link>
        </div>
      </main>
    )
  }

  const personToDelete = persons.find((p) => p.id === confirmDeletePersonId)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800 truncate">
            {client.displayName}
          </h1>
          <Link
            href="/clients"
            className="text-sm text-slate-600 hover:text-slate-900 whitespace-nowrap"
          >
            ← חזרה לרשימת הלקוחות
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <div
            role="alert"
            className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
          >
            {error}
          </div>
        )}

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName()
                    if (e.key === 'Escape') setIsEditingName(false)
                  }}
                  disabled={isSavingClient}
                  autoFocus
                  className="text-2xl font-bold text-slate-800 w-full px-2 py-1 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDraftName(client.displayName)
                    setIsEditingName(true)
                  }}
                  className="text-2xl font-bold text-slate-800 hover:text-blue-700 hover:bg-slate-50 rounded-lg px-2 py-1 -mx-2 transition-colors text-right"
                >
                  {client.displayName}
                </button>
              )}
              <p className="text-xs text-slate-400 mt-1 px-2">
                לחיצה על השם תאפשר עריכה
              </p>
            </div>

            <button
              type="button"
              onClick={() => setConfirmDeleteClientOpen(true)}
              className="text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              מחק לקוח
            </button>
          </div>

          <div>
            <h2 className="text-sm font-medium text-slate-700 mb-1">הערות</h2>
            {isEditingNotes ? (
              <div>
                <textarea
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  disabled={isSavingClient}
                  rows={3}
                  autoFocus
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex gap-2 mt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditingNotes(false)}
                    disabled={isSavingClient}
                    className="px-3 py-1 text-sm border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                  >
                    ביטול
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    disabled={isSavingClient}
                    className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg"
                  >
                    שמור
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setDraftNotes(client.notes ?? '')
                  setIsEditingNotes(true)
                }}
                className="w-full text-right px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors min-h-[2.5rem]"
              >
                {client.notes || (
                  <span className="text-slate-400">
                    אין הערות — לחץ/י כדי להוסיף
                  </span>
                )}
              </button>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('persons')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'persons'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              אנשים בתיק ({persons.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('documents')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'documents'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              מסמכים ({documents.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'persons' ? (
              <div>
                <div className="flex justify-end mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPerson(undefined)
                      setPersonModalOpen(true)
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
                  >
                    + הוסף אדם חדש
                  </button>
                </div>

                {persons.length === 0 ? (
                  <p className="text-center py-8 text-slate-500">
                    עדיין אין אנשים בתיק. הוסף/י את הראשון.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {persons.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-800">
                            {p.firstName} {p.lastName}
                          </div>
                          <div className="text-sm text-slate-500 flex gap-3" dir="rtl">
                            <span>ת.ז. {p.idNumber}</span>
                            <span>·</span>
                            <span>{p.gender === 'male' ? 'זכר' : 'נקבה'}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPerson(p)
                              setPersonModalOpen(true)
                            }}
                            className="px-3 py-1.5 text-sm text-slate-700 border border-slate-300 hover:bg-slate-100 rounded-lg"
                          >
                            עריכה
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeletePersonId(p.id)}
                            className="px-3 py-1.5 text-sm text-red-600 border border-red-200 hover:bg-red-50 rounded-lg"
                          >
                            מחיקה
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div>
                <div className="flex justify-end mb-4">
                  <Link
                    href={`/clients/${client.id}/documents/new`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
                  >
                    + מסמך חדש
                  </Link>
                </div>

                {documents.length === 0 ? (
                  <p className="text-center py-8 text-slate-500">
                    עדיין אין מסמכים בתיק. צור/י את הראשון.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {documents.map((d) => (
                      <li key={d.id}>
                        <Link
                          href={`/clients/${client.id}/documents/${d.id}`}
                          className="flex items-center justify-between gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-800 truncate">
                              {d.title}
                            </div>
                            <div className="text-sm text-slate-500">
                              {DOC_TYPE_LABELS[d.type]}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[d.status]}`}
                            >
                              {STATUS_LABELS[d.status]}
                            </span>
                            <span className="text-xs text-slate-500">
                              {formatDate(d.updatedAt)}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {personModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative my-8">
            <button
              type="button"
              onClick={() => setPersonModalOpen(false)}
              aria-label="סגירה"
              className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full text-2xl leading-none"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
              {editingPerson ? 'עריכת אדם' : 'הוספת אדם חדש'}
            </h2>
            <PersonForm
              clientId={client.id}
              initialData={editingPerson}
              onSuccess={() => {
                setPersonModalOpen(false)
                void reloadPersons()
              }}
              onCancel={() => setPersonModalOpen(false)}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteClientOpen}
        title="מחיקת לקוח"
        message={`האם את/ה בטוח/ה שברצונך למחוק את "${client.displayName}"? פעולה זו תמחק גם את כל האנשים והמסמכים בתיק ולא ניתן לשחזר אותה.`}
        confirmLabel="מחק"
        destructive
        isProcessing={isDeletingClient}
        onConfirm={handleDeleteClient}
        onCancel={() => setConfirmDeleteClientOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(confirmDeletePersonId)}
        title="מחיקת אדם"
        message={
          personToDelete
            ? `האם את/ה בטוח/ה שברצונך למחוק את ${personToDelete.firstName} ${personToDelete.lastName}? לא ניתן לשחזר.`
            : ''
        }
        confirmLabel="מחק"
        destructive
        isProcessing={isDeletingPerson}
        onConfirm={handleDeletePerson}
        onCancel={() => setConfirmDeletePersonId(null)}
      />
    </main>
  )
}
