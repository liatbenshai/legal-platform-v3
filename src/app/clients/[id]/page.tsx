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
import { createDocument, getDocuments } from '@/lib/db/documents'
import { useUser } from '@/lib/hooks/useUser'
import { createClient as createSupabaseClient } from '@/lib/db/supabase'
import {
  DOC_TYPE_CONFIGS,
  SUPPORTED_DOC_TYPES,
} from '@/lib/documents/type-config'
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

const STATUS_STYLES: Record<DocumentStatus, { bg: string; color: string }> = {
  draft: { bg: '#F3F4F6', color: '#6B7280' },
  review: { bg: '#FEF3C7', color: '#92660A' },
  signed: { bg: '#DCFCE7', color: '#15803D' },
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
  const { user } = useUser()
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
  const [isCreatingDoc, setIsCreatingDoc] = useState(false)
  const [isDocTypeMenuOpen, setIsDocTypeMenuOpen] = useState(false)

  async function handleCreateDocument(type: DocumentType) {
    if (!user) return
    setIsCreatingDoc(true)
    setIsDocTypeMenuOpen(false)
    try {
      const newDoc = await createDocument(
        supabase,
        clientId,
        user.id,
        type,
        'מסמך חדש'
      )
      router.push(`/clients/${clientId}/documents/${newDoc.id}`)
    } catch {
      setError('שגיאה ביצירת המסמך')
      setIsCreatingDoc(false)
    }
  }

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
      const updated = await updateClient(
        supabase,
        client.id,
        trimmed,
        client.notes
      )
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
      <main
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <div
          className="max-w-5xl mx-auto px-6 py-16 text-center"
          style={{ color: 'var(--text-muted)', fontSize: 13 }}
        >
          טוען תיק לקוח...
        </div>
      </main>
    )
  }

  if (!client) {
    return (
      <main
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <p
            className="doc-title"
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: 'var(--text-primary)',
              margin: '0 0 12px',
            }}
          >
            תיק לא נמצא
          </p>
          <Link
            href="/clients"
            style={{
              fontSize: 13,
              color: 'var(--color-primary)',
              textDecoration: 'none',
            }}
          >
            → חזרה לרשימת הלקוחות
          </Link>
        </div>
      </main>
    )
  }

  const personToDelete = persons.find((p) => p.id === confirmDeletePersonId)

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      <header
        style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1
            className="doc-title truncate"
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: 'var(--color-primary)',
              margin: 0,
            }}
          >
            {client.displayName}
          </h1>
          <Link
            href="/clients"
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            → לרשימת הלקוחות
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <div
            role="alert"
            style={{
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

        <section
          style={{
            backgroundColor: '#fff',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            padding: 24,
          }}
        >
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
                  className="doc-title w-full"
                  style={{
                    fontSize: 22,
                    fontWeight: 500,
                    color: 'var(--color-primary)',
                    padding: '6px 10px',
                    border: '0.5px solid var(--color-primary)',
                    borderRadius: 4,
                    backgroundColor: 'var(--color-primary-light)',
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDraftName(client.displayName)
                    setIsEditingName(true)
                  }}
                  className="doc-title text-right"
                  style={{
                    fontSize: 22,
                    fontWeight: 500,
                    color: 'var(--color-primary)',
                    padding: '6px 10px',
                    margin: '-6px -10px',
                    borderRadius: 4,
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  {client.displayName}
                </button>
              )}
              <p
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  marginTop: 4,
                  paddingRight: 10,
                }}
              >
                לחיצה על השם תאפשר עריכה
              </p>
            </div>

            <button
              type="button"
              onClick={() => setConfirmDeleteClientOpen(true)}
              style={{
                fontSize: 12,
                color: '#DC2626',
                backgroundColor: 'transparent',
                border: '0.5px solid #FCA5A5',
                padding: '6px 12px',
                borderRadius: 4,
                whiteSpace: 'nowrap',
              }}
            >
              מחק לקוח
            </button>
          </div>

          <div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                marginBottom: 6,
              }}
            >
              הערות
            </div>
            {isEditingNotes ? (
              <div>
                <textarea
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  disabled={isSavingClient}
                  rows={3}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: 14,
                    border: '0.5px solid var(--color-primary)',
                    borderRadius: 4,
                    backgroundColor: 'var(--color-primary-light)',
                    resize: 'none',
                  }}
                />
                <div className="flex gap-2 mt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditingNotes(false)}
                    disabled={isSavingClient}
                    style={{
                      fontSize: 12,
                      padding: '6px 12px',
                      backgroundColor: 'transparent',
                      border: '0.5px solid var(--border-hover)',
                      borderRadius: 4,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    ביטול
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    disabled={isSavingClient}
                    style={{
                      fontSize: 12,
                      padding: '6px 12px',
                      backgroundColor: 'var(--color-primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      fontWeight: 500,
                    }}
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
                className="w-full text-right"
                style={{
                  padding: '9px 12px',
                  fontSize: 14,
                  color: client.notes
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                  backgroundColor: 'transparent',
                  border: '0.5px dashed var(--border-default)',
                  borderRadius: 4,
                  minHeight: 40,
                  fontStyle: client.notes ? 'normal' : 'italic',
                }}
              >
                {client.notes || 'אין הערות — לחצי כדי להוסיף'}
              </button>
            )}
          </div>
        </section>

        <section
          style={{
            backgroundColor: '#fff',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <div
            className="flex"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-default)',
              padding: '0 24px',
              gap: 28,
            }}
          >
            {(['persons', 'documents'] as const).map((tabId) => {
              const isActive = activeTab === tabId
              const label = tabId === 'persons' ? 'אנשים בתיק' : 'מסמכים'
              const count = tabId === 'persons' ? persons.length : documents.length
              return (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setActiveTab(tabId)}
                  className="relative"
                  style={{
                    padding: '12px 0',
                    fontSize: 13,
                    color: isActive
                      ? 'var(--color-primary)'
                      : 'var(--text-muted)',
                    fontWeight: isActive ? 500 : 400,
                    backgroundColor: 'transparent',
                    border: 'none',
                  }}
                >
                  {label} ({count})
                  {isActive && (
                    <span
                      className="absolute right-0 left-0"
                      style={{
                        bottom: -1,
                        height: 2,
                        backgroundColor: 'var(--color-accent)',
                      }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          <div style={{ padding: 24 }}>
            {activeTab === 'persons' ? (
              <div>
                <div className="flex justify-end mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPerson(undefined)
                      setPersonModalOpen(true)
                    }}
                    style={{
                      padding: '8px 14px',
                      fontSize: 13,
                      fontWeight: 500,
                      backgroundColor: 'var(--color-primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                    }}
                  >
                    + הוסף אדם חדש
                  </button>
                </div>

                {persons.length === 0 ? (
                  <p
                    className="text-center py-8"
                    style={{ color: 'var(--text-muted)', fontSize: 13 }}
                  >
                    עדיין אין אנשים בתיק. הוסיפי את הראשון.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {persons.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-3"
                        style={{
                          padding: 14,
                          border: '0.5px solid var(--border-default)',
                          borderRadius: 4,
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 500,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {p.firstName} {p.lastName}
                          </div>
                          <div
                            className="flex gap-3 mt-1"
                            style={{ fontSize: 12, color: 'var(--text-secondary)' }}
                            dir="rtl"
                          >
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
                            style={{
                              fontSize: 12,
                              padding: '6px 12px',
                              color: 'var(--text-secondary)',
                              backgroundColor: 'transparent',
                              border: '0.5px solid var(--border-hover)',
                              borderRadius: 4,
                            }}
                          >
                            עריכה
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeletePersonId(p.id)}
                            style={{
                              fontSize: 12,
                              padding: '6px 12px',
                              color: '#DC2626',
                              backgroundColor: 'transparent',
                              border: '0.5px solid #FCA5A5',
                              borderRadius: 4,
                            }}
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
                <div className="flex justify-end mb-4" style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setIsDocTypeMenuOpen((v) => !v)}
                    disabled={isCreatingDoc || !user}
                    style={{
                      padding: '8px 14px',
                      fontSize: 13,
                      fontWeight: 500,
                      backgroundColor: 'var(--color-primary)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      opacity: isCreatingDoc || !user ? 0.5 : 1,
                      cursor: isCreatingDoc || !user ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isCreatingDoc ? 'יוצר...' : '+ מסמך חדש'}
                  </button>
                  {isDocTypeMenuOpen && (
                    <>
                      <div
                        onClick={() => setIsDocTypeMenuOpen(false)}
                        style={{
                          position: 'fixed',
                          inset: 0,
                          zIndex: 10,
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          marginTop: 6,
                          backgroundColor: '#fff',
                          border: '0.5px solid var(--border-default)',
                          borderRadius: 6,
                          boxShadow: '0 4px 12px rgba(61, 40, 23, 0.08)',
                          minWidth: 220,
                          zIndex: 20,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            padding: '8px 12px',
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            borderBottom: '0.5px solid var(--border-default)',
                          }}
                        >
                          בחרי סוג מסמך
                        </div>
                        {SUPPORTED_DOC_TYPES.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => handleCreateDocument(t)}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '10px 12px',
                              textAlign: 'right',
                              fontSize: 13,
                              color: 'var(--text-primary)',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderTop: '0.5px solid var(--border-default)',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                'var(--bg-secondary)')
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                'transparent')
                            }
                          >
                            {DOC_TYPE_CONFIGS[t].label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {documents.length === 0 ? (
                  <p
                    className="text-center py-8"
                    style={{ color: 'var(--text-muted)', fontSize: 13 }}
                  >
                    עדיין אין מסמכים בתיק. צרי את הראשון.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {documents.map((d) => {
                      const statusStyle = STATUS_STYLES[d.status]
                      return (
                        <li key={d.id}>
                          <Link
                            href={`/clients/${client.id}/documents/${d.id}`}
                            className="flex items-center justify-between gap-3"
                            style={{
                              padding: 14,
                              border: '0.5px solid var(--border-default)',
                              borderRadius: 4,
                              textDecoration: 'none',
                              transition: 'border-color 120ms',
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <div
                                className="truncate"
                                style={{
                                  fontSize: 14,
                                  fontWeight: 500,
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {d.title}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: 'var(--text-secondary)',
                                  marginTop: 2,
                                }}
                              >
                                {DOC_TYPE_LABELS[d.type]}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span
                                style={{
                                  fontSize: 11,
                                  padding: '2px 8px',
                                  borderRadius: 10,
                                  backgroundColor: statusStyle.bg,
                                  color: statusStyle.color,
                                }}
                              >
                                {STATUS_LABELS[d.status]}
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: 'var(--text-muted)',
                                }}
                              >
                                {formatDate(d.updatedAt)}
                              </span>
                            </div>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {personModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ backgroundColor: 'rgba(15, 42, 91, 0.4)' }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-w-lg w-full my-8 relative"
            style={{
              backgroundColor: '#fff',
              borderRadius: 8,
              padding: 28,
            }}
          >
            <button
              type="button"
              onClick={() => setPersonModalOpen(false)}
              aria-label="סגירה"
              className="absolute top-3 left-3"
              style={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: 4,
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              ×
            </button>
            <h2
              className="doc-title text-center"
              style={{
                fontSize: 20,
                fontWeight: 500,
                color: 'var(--color-primary)',
                margin: '0 0 20px',
              }}
            >
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
