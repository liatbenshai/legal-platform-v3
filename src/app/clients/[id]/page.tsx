'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { InlineEditField } from '@/components/clients/InlineEditField'
import { InlineGenderField } from '@/components/clients/InlineGenderField'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  deleteClient,
  getClient,
  updateClient,
} from '@/lib/db/clients'
import {
  createPerson,
  deletePerson,
  getPersons,
  updatePerson,
  type PersonInput,
} from '@/lib/db/persons'
import {
  createDocument,
  deleteDocument,
  getDocuments,
} from '@/lib/db/documents'
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
  Gender,
  Person,
  PersonRole,
} from '@/lib/types'

// ============================================================
// קבועים
// ============================================================
const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'טיוטה',
  review: 'לבדיקה',
  signed: 'חתום',
}

const STATUS_STYLES: Record<DocumentStatus, { bg: string; color: string }> = {
  draft: {
    bg: 'var(--status-draft-bg)',
    color: 'var(--status-draft-fg)',
  },
  review: {
    bg: 'var(--status-review-bg)',
    color: 'var(--status-review-fg)',
  },
  signed: {
    bg: 'var(--status-signed-bg)',
    color: 'var(--status-signed-fg)',
  },
}

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function dateToInputValue(d: Date | undefined): string {
  if (!d) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function personToInput(p: Person): PersonInput {
  return {
    role: p.role,
    firstName: p.firstName,
    lastName: p.lastName,
    idNumber: p.idNumber,
    gender: p.gender,
    birthDate: p.birthDate,
    address: p.address,
    city: p.city,
    phone: p.phone,
    email: p.email,
  }
}

// ============================================================
// הדף הראשי
// ============================================================
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

  // עריכה
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [draftTitle, setDraftTitle] = useState('')
  const [isSavingClient, setIsSavingClient] = useState(false)

  // מודלים
  const [isAddingPartner, setIsAddingPartner] = useState(false)
  const [partnerToRemove, setPartnerToRemove] =
    useState<Person | null>(null)
  const [isEditingDocTypes, setIsEditingDocTypes] = useState(false)
  const [isNewDocOpen, setIsNewDocOpen] = useState(false)
  const [newDocType, setNewDocType] = useState<DocumentType | null>(null)
  const [docToDelete, setDocToDelete] = useState<Document | null>(null)
  const [isDeletingDoc, setIsDeletingDoc] = useState(false)
  const [isCreatingDoc, setIsCreatingDoc] = useState(false)
  const [confirmDeleteClient, setConfirmDeleteClient] = useState(false)
  const [isDeletingClient, setIsDeletingClient] = useState(false)

  // ===== טעינה ראשונית =====
  useEffect(() => {
    let cancelled = false

    Promise.all([
      getClient(supabase, clientId),
      getPersons(supabase, clientId),
      getDocuments(supabase, clientId),
    ])
      .then(([c, p, d]) => {
        if (cancelled) return
        if (!c) {
          setError('הלקוח לא נמצא')
        } else {
          setClient(c)
          setPersons(p)
          setDocuments(d)
        }
        setIsLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('שגיאה בטעינת תיק הלקוח')
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [supabase, clientId])

  // ===== Derived =====
  const primary = useMemo(
    () => persons.find((p) => p.role === 'primary') ?? null,
    [persons]
  )
  const partner = useMemo(
    () => persons.find((p) => p.role === 'partner') ?? null,
    [persons]
  )
  const additionalContacts = useMemo(
    () => persons.filter((p) => p.role === 'contact'),
    [persons]
  )

  // ===== עדכון שדה של אדם =====
  function makeFieldSaver(person: Person) {
    return async function <K extends keyof Omit<Person, 'id' | 'clientId'>>(
      field: K,
      rawValue: Person[K]
    ): Promise<void> {
      const updatedPerson = { ...person, [field]: rawValue }
      const saved = await updatePerson(
        supabase,
        person.id,
        personToInput(updatedPerson)
      )
      setPersons((prev) =>
        prev.map((p) => (p.id === saved.id ? saved : p))
      )
    }
  }

  // ===== כותרת התיק =====
  async function handleSaveTitle() {
    if (!client) return
    const trimmed = draftTitle.trim()
    if (!trimmed) {
      setIsEditingTitle(false)
      return
    }
    if (trimmed === client.displayName) {
      setIsEditingTitle(false)
      return
    }
    setIsSavingClient(true)
    try {
      const updated = await updateClient(supabase, client.id, {
        displayName: trimmed,
        notes: client.notes,
        plannedDocTypes: client.plannedDocTypes,
      })
      setClient(updated)
      setIsEditingTitle(false)
    } catch {
      setError('שגיאה בשמירת שם התיק')
    } finally {
      setIsSavingClient(false)
    }
  }

  async function handleSaveNotes(next: string) {
    if (!client) return
    const updated = await updateClient(supabase, client.id, {
      displayName: client.displayName,
      notes: next || undefined,
      plannedDocTypes: client.plannedDocTypes,
    })
    setClient(updated)
  }

  async function handleSavePlannedDocTypes(next: DocumentType[]) {
    if (!client) return
    const updated = await updateClient(supabase, client.id, {
      displayName: client.displayName,
      notes: client.notes,
      plannedDocTypes: next,
    })
    setClient(updated)
    setIsEditingDocTypes(false)
  }

  // ===== בן/בת זוג =====
  async function handleAddPartner(data: {
    firstName: string
    lastName: string
    idNumber: string
    gender: Gender
  }) {
    try {
      const newPartner = await createPerson(supabase, clientId, {
        role: 'partner',
        firstName: data.firstName,
        lastName: data.lastName,
        idNumber: data.idNumber,
        gender: data.gender,
        address: '',
        city: '',
      })
      setPersons((prev) => [...prev, newPartner])
      setIsAddingPartner(false)
    } catch {
      setError('שגיאה בהוספת בן/בת זוג')
      throw new Error('add partner failed')
    }
  }

  async function handleRemovePartner() {
    if (!partnerToRemove) return
    try {
      await deletePerson(supabase, partnerToRemove.id)
      setPersons((prev) => prev.filter((p) => p.id !== partnerToRemove.id))
      setPartnerToRemove(null)
    } catch {
      setError('שגיאה בהסרת בן/בת זוג')
    }
  }

  // ===== מסמכים =====
  async function handleCreateDocument() {
    if (!user || !newDocType) return
    setIsCreatingDoc(true)
    try {
      const doc = await createDocument(
        supabase,
        clientId,
        user.id,
        newDocType,
        'מסמך חדש'
      )
      router.push(`/clients/${clientId}/documents/${doc.id}`)
    } catch {
      setError('שגיאה ביצירת המסמך')
      setIsCreatingDoc(false)
    }
  }

  async function handleDeleteDocument() {
    if (!docToDelete) return
    setIsDeletingDoc(true)
    try {
      await deleteDocument(supabase, docToDelete.id)
      setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id))
      setDocToDelete(null)
    } catch {
      setError('שגיאה במחיקת המסמך')
    } finally {
      setIsDeletingDoc(false)
    }
  }

  // ===== מחיקת לקוח =====
  async function handleDeleteClient() {
    if (!client) return
    setIsDeletingClient(true)
    try {
      await deleteClient(supabase, client.id)
      router.push('/clients')
    } catch {
      setError('שגיאה במחיקת התיק')
      setIsDeletingClient(false)
      setConfirmDeleteClient(false)
    }
  }

  // ===== Render =====
  if (isLoading) {
    return (
      <main
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <TopNav />
        <div
          style={{
            padding: 60,
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          טוען...
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
        <TopNav />
        <div
          style={{
            padding: 60,
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          {error ?? 'הלקוח לא נמצא'}
        </div>
      </main>
    )
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      <TopNav />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link
          href="/clients"
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            textDecoration: 'none',
          }}
        >
          ‹ חזרה לתיקי לקוחות
        </Link>

        {/* כותרת התיק */}
        <div
          style={{
            margin: '10px 0 22px',
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {isEditingTitle ? (
            <div style={{ display: 'flex', gap: 6, flex: 1 }}>
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle()
                  if (e.key === 'Escape') setIsEditingTitle(false)
                }}
                autoFocus
                disabled={isSavingClient}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  fontSize: 20,
                  fontWeight: 500,
                  border: '0.5px solid var(--border-hover)',
                  borderRadius: 4,
                  color: 'var(--text-primary)',
                  fontFamily: 'inherit',
                }}
              />
              <button
                type="button"
                onClick={handleSaveTitle}
                disabled={isSavingClient}
                style={primaryButtonStyle}
              >
                שמור
              </button>
              <button
                type="button"
                onClick={() => setIsEditingTitle(false)}
                style={secondaryButtonStyle}
              >
                ביטול
              </button>
            </div>
          ) : (
            <h1
              onClick={() => {
                setDraftTitle(client.displayName)
                setIsEditingTitle(true)
              }}
              title="לחצי לעריכה"
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 500,
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              {client.displayName}
            </h1>
          )}
          <span
            style={{ fontSize: 11, color: 'var(--text-muted)' }}
          >
            נוצר {formatDate(client.createdAt)}
          </span>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 14,
              padding: '10px 14px',
              backgroundColor: '#FEE2E2',
              border: '0.5px solid #FCA5A5',
              borderRadius: 6,
              color: '#991B1B',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {/* פרטי הלקוח (האדם הראשי) */}
        {primary ? (
          <PersonCard
            title="פרטי הלקוח"
            badge="ראשי"
            person={primary}
            onSaveField={makeFieldSaver(primary)}
          />
        ) : (
          <Section title="פרטי הלקוח">
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: 'var(--text-muted)',
              }}
            >
              אין פרטי לקוח ראשי. ייתכן שמדובר בתיק ישן —{' '}
              <button
                type="button"
                style={{
                  background: 'transparent',
                  color: 'var(--color-primary)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  textDecoration: 'underline',
                }}
                onClick={() => router.push(`/clients/new`)}
              >
                ניתן ליצור תיק חדש
              </button>
            </p>
          </Section>
        )}

        {/* בן/בת זוג */}
        {partner ? (
          <PersonCard
            title="בן/בת זוג"
            badge="זוג"
            person={partner}
            onSaveField={makeFieldSaver(partner)}
            onRemove={() => setPartnerToRemove(partner)}
          />
        ) : (
          <EmptyStateSection
            icon="ti-heart"
            title="אין בן/בת זוג בתיק"
            buttonLabel="הוסף בן/בת זוג"
            onAction={() => setIsAddingPartner(true)}
          />
        )}

        {/* סוגי מסמכים מתוכננים */}
        <Section
          title="סוגי מסמכים מתוכננים"
          icon="ti-bookmark"
          rightAction={
            <button
              type="button"
              onClick={() => setIsEditingDocTypes(true)}
              style={sectionEditButtonStyle}
            >
              <i
                className="ti ti-pencil"
                style={{
                  fontSize: 12,
                  marginLeft: 3,
                  verticalAlign: -1,
                }}
                aria-hidden="true"
              />
              עריכה
            </button>
          }
        >
          {client.plannedDocTypes.length === 0 ? (
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}
            >
              לא נבחרו סוגי מסמכים. לחצי על &quot;עריכה&quot; כדי להוסיף.
            </p>
          ) : (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              {client.plannedDocTypes.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 12,
                    padding: '3px 10px',
                    backgroundColor: 'var(--color-accent-bg)',
                    color: 'var(--status-review-fg)',
                    border:
                      '0.5px solid var(--color-accent)',
                    borderRadius: 12,
                    fontWeight: 500,
                  }}
                >
                  {DOC_TYPE_CONFIGS[t]?.label ?? t}
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* מסמכים בתיק */}
        <Section
          title="מסמכים בתיק"
          icon="ti-file-text"
          countBadge={documents.length}
          rightAction={
            <button
              type="button"
              onClick={() => {
                setNewDocType(null)
                setIsNewDocOpen(true)
              }}
              style={{
                ...primaryButtonStyle,
                fontSize: 12,
                padding: '6px 14px',
              }}
            >
              <i
                className="ti ti-plus"
                style={{
                  fontSize: 12,
                  marginLeft: 3,
                  verticalAlign: -1,
                }}
                aria-hidden="true"
              />
              מסמך חדש
            </button>
          }
        >
          {documents.length === 0 ? (
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}
            >
              עוד אין מסמכים בתיק.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 6 }}>
              {documents.map((d) => {
                const statusStyle = STATUS_STYLES[d.status]
                return (
                  <div
                    key={d.id}
                    style={{
                      padding: '10px 12px',
                      border: '0.5px solid var(--border-default)',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <Link
                      href={`/clients/${clientId}/documents/${d.id}`}
                      style={{
                        flex: 1,
                        textDecoration: 'none',
                        color: 'inherit',
                        minWidth: 0,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          color: 'var(--text-primary)',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {d.title}
                      </p>
                      <p
                        style={{
                          margin: '2px 0 0',
                          fontSize: 11,
                          color: 'var(--text-muted)',
                        }}
                      >
                        {DOC_TYPE_CONFIGS[d.type]?.label ?? d.type}{' '}
                        · עודכן {formatDate(d.updatedAt)}
                      </p>
                    </Link>
                    <span
                      style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                        borderRadius: 9,
                        fontWeight: 500,
                      }}
                    >
                      {STATUS_LABELS[d.status]}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDocToDelete(d)}
                      aria-label="מחיקת מסמך"
                      title="מחיקת מסמך"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 4,
                        borderRadius: 3,
                      }}
                    >
                      <i
                        className="ti ti-trash"
                        style={{ fontSize: 14 }}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </Section>

        {/* אנשי קשר נוספים */}
        <Section
          title="אנשי קשר נוספים"
          icon="ti-users"
          countBadge={
            additionalContacts.length > 0
              ? additionalContacts.length
              : undefined
          }
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}
          >
            ניהול אנשי קשר נוספים יתווסף בגרסה הבאה. כיום, שחקני
            מסמכים (יורשים, מיופי כוח, עדים) ממולאים ישירות בתוך
            המסמך.
          </p>
        </Section>

        {/* הערות */}
        <Section title="הערות" icon="ti-note">
          <InlineEditField
            label="הערות פנימיות"
            value={client.notes ?? ''}
            emptyPlaceholder="לחצי להוספת הערות..."
            onSave={handleSaveNotes}
          />
        </Section>

        {/* מחיקת תיק */}
        <div
          style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: '0.5px solid var(--border-default)',
            textAlign: 'end',
          }}
        >
          <button
            type="button"
            onClick={() => setConfirmDeleteClient(true)}
            style={dangerButtonStyle}
          >
            <i
              className="ti ti-trash"
              style={{
                fontSize: 12,
                marginLeft: 3,
                verticalAlign: -1,
              }}
              aria-hidden="true"
            />
            מחיקת תיק
          </button>
        </div>
      </div>

      {/* ===== Modals ===== */}
      {isAddingPartner && (
        <PartnerModal
          onSave={handleAddPartner}
          onCancel={() => setIsAddingPartner(false)}
        />
      )}

      {isEditingDocTypes && client && (
        <DocTypesModal
          current={client.plannedDocTypes}
          onSave={handleSavePlannedDocTypes}
          onCancel={() => setIsEditingDocTypes(false)}
        />
      )}

      {isNewDocOpen && (
        <NewDocModal
          docType={newDocType}
          onChangeType={setNewDocType}
          onCreate={handleCreateDocument}
          onCancel={() => setIsNewDocOpen(false)}
          isCreating={isCreatingDoc}
        />
      )}

      <ConfirmDialog
        open={Boolean(partnerToRemove)}
        title="הסרת בן/בת זוג"
        message={
          partnerToRemove
            ? `להסיר את ${partnerToRemove.firstName} ${partnerToRemove.lastName} מהתיק? הפרטים יימחקו לצמיתות.`
            : ''
        }
        confirmLabel="הסר"
        destructive
        onConfirm={handleRemovePartner}
        onCancel={() => setPartnerToRemove(null)}
      />

      <ConfirmDialog
        open={Boolean(docToDelete)}
        title="מחיקת מסמך"
        message={
          docToDelete
            ? `למחוק את "${docToDelete.title}"? פעולה זו לא ניתנת לשחזור.`
            : ''
        }
        confirmLabel="מחק"
        destructive
        isProcessing={isDeletingDoc}
        onConfirm={handleDeleteDocument}
        onCancel={() => setDocToDelete(null)}
      />

      <ConfirmDialog
        open={confirmDeleteClient}
        title="מחיקת תיק"
        message={`למחוק את התיק "${client.displayName}" וכל המסמכים שבו? פעולה זו לא ניתנת לשחזור.`}
        confirmLabel="מחק תיק"
        destructive
        isProcessing={isDeletingClient}
        onConfirm={handleDeleteClient}
        onCancel={() => setConfirmDeleteClient(false)}
      />
    </main>
  )
}

// ============================================================
// תת-רכיבים
// ============================================================

function Section({
  title,
  icon,
  countBadge,
  rightAction,
  children,
}: {
  title: string
  icon?: string
  countBadge?: number
  rightAction?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section
      style={{
        backgroundColor: '#fff',
        border: '0.5px solid var(--border-default)',
        borderRadius: 8,
        padding: '16px 18px',
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          gap: 8,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 500,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {icon && (
            <i
              className={`ti ${icon}`}
              style={{
                fontSize: 16,
                color: 'var(--color-accent)',
              }}
              aria-hidden="true"
            />
          )}
          {title}
          {typeof countBadge === 'number' && (
            <span
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                fontSize: 11,
                padding: '1px 7px',
                borderRadius: 9,
                fontWeight: 500,
              }}
            >
              {countBadge}
            </span>
          )}
        </h2>
        {rightAction}
      </div>
      {children}
    </section>
  )
}

function EmptyStateSection({
  icon,
  title,
  buttonLabel,
  onAction,
}: {
  icon: string
  title: string
  buttonLabel: string
  onAction: () => void
}) {
  return (
    <section
      style={{
        background: '#fff',
        border: '0.5px dashed var(--border-hover)',
        borderRadius: 8,
        padding: 18,
        marginBottom: 12,
        textAlign: 'center',
      }}
    >
      <i
        className={`ti ${icon}`}
        style={{ fontSize: 22, color: 'var(--text-muted)' }}
        aria-hidden="true"
      />
      <p
        style={{
          margin: '6px 0 10px',
          fontSize: 13,
          color: 'var(--text-secondary)',
        }}
      >
        {title}
      </p>
      <button
        type="button"
        onClick={onAction}
        style={{
          ...secondaryButtonStyle,
          fontSize: 12,
        }}
      >
        <i
          className="ti ti-plus"
          style={{
            fontSize: 12,
            marginLeft: 3,
            verticalAlign: -1,
          }}
          aria-hidden="true"
        />
        {buttonLabel}
      </button>
    </section>
  )
}

function PersonCard({
  title,
  badge,
  person,
  onSaveField,
  onRemove,
}: {
  title: string
  badge: string
  person: Person
  onSaveField: <K extends keyof Omit<Person, 'id' | 'clientId'>>(
    field: K,
    value: Person[K]
  ) => Promise<void>
  onRemove?: () => void
}) {
  const PERSON_ICON: Record<PersonRole, string> = {
    primary: 'ti-user',
    partner: 'ti-heart',
    contact: 'ti-user',
  }

  return (
    <section
      style={{
        background: '#fff',
        border: '0.5px solid var(--border-default)',
        borderRadius: 8,
        padding: '16px 18px',
        marginBottom: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
          gap: 8,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 500,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <i
            className={`ti ${PERSON_ICON[person.role]}`}
            style={{
              fontSize: 16,
              color: 'var(--color-accent)',
            }}
            aria-hidden="true"
          />
          {title}
          <span
            style={{
              fontSize: 10,
              color: 'var(--text-secondary)',
              background: 'var(--bg-tertiary)',
              padding: '2px 8px',
              borderRadius: 9,
              fontWeight: 500,
            }}
          >
            {badge}
          </span>
        </h2>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="הסר"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 12,
              padding: '4px 8px',
              fontFamily: 'inherit',
            }}
          >
            <i
              className="ti ti-x"
              style={{
                fontSize: 13,
                marginLeft: 3,
                verticalAlign: -1,
              }}
              aria-hidden="true"
            />
            הסר
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 4,
        }}
      >
        <InlineEditField
          label="שם פרטי"
          value={person.firstName}
          onSave={(v) => onSaveField('firstName', v)}
        />
        <InlineEditField
          label="שם משפחה"
          value={person.lastName}
          onSave={(v) => onSaveField('lastName', v)}
        />
        <InlineEditField
          label="תעודת זהות"
          value={person.idNumber}
          dir="ltr"
          onSave={(v) => onSaveField('idNumber', v)}
        />
        <InlineGenderField
          label="מגדר"
          value={person.gender}
          onSave={(v) => onSaveField('gender', v)}
        />
        <InlineEditField
          label="תאריך לידה"
          type="date"
          value={dateToInputValue(person.birthDate)}
          onSave={async (v) =>
            onSaveField('birthDate', v ? new Date(v) : undefined)
          }
        />
        <InlineEditField
          label="טלפון"
          type="tel"
          value={person.phone ?? ''}
          dir="ltr"
          onSave={(v) => onSaveField('phone', v || undefined)}
        />
        <InlineEditField
          label="דואר אלקטרוני"
          type="email"
          value={person.email ?? ''}
          dir="ltr"
          onSave={(v) => onSaveField('email', v || undefined)}
        />
        <InlineEditField
          label="עיר"
          value={person.city}
          onSave={(v) => onSaveField('city', v)}
        />
        <div style={{ gridColumn: '1 / -1' }}>
          <InlineEditField
            label="כתובת"
            value={person.address}
            onSave={(v) => onSaveField('address', v)}
          />
        </div>
      </div>
    </section>
  )
}

// ============================================================
// מודאלים
// ============================================================

function PartnerModal({
  onSave,
  onCancel,
}: {
  onSave: (d: {
    firstName: string
    lastName: string
    idNumber: string
    gender: Gender
  }) => Promise<void>
  onCancel: () => void
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [gender, setGender] = useState<Gender>('female')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim() || !idNumber.trim()) {
      setError('יש למלא שם פרטי, שם משפחה ותעודת זהות')
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      await onSave({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        idNumber: idNumber.trim(),
        gender,
      })
    } catch {
      setError('שגיאה בשמירה')
      setIsSaving(false)
    }
  }

  return (
    <ModalShell title="הוספת בן/בת זוג" onClose={onCancel}>
      <form onSubmit={handleSubmit}>
        <p
          style={{
            margin: '0 0 14px',
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          לאחר השמירה תוכלי להוסיף שאר הפרטים בעריכה inline בכרטיס.
        </p>

        {error && (
          <div
            style={{
              marginBottom: 12,
              padding: '8px 12px',
              backgroundColor: '#FEE2E2',
              border: '0.5px solid #FCA5A5',
              borderRadius: 4,
              color: '#991B1B',
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gap: 12 }}>
          <FormField label="שם פרטי" required>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoFocus
              style={inputStyle}
            />
          </FormField>
          <FormField label="שם משפחה" required>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={inputStyle}
            />
          </FormField>
          <FormField label="תעודת זהות" required>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              inputMode="numeric"
              dir="ltr"
              style={{ ...inputStyle, textAlign: 'right' }}
            />
          </FormField>
          <FormField label="מגדר">
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              style={inputStyle}
            >
              <option value="female">נקבה</option>
              <option value="male">זכר</option>
            </select>
          </FormField>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
            marginTop: 18,
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            style={secondaryButtonStyle}
          >
            ביטול
          </button>
          <button
            type="submit"
            disabled={isSaving}
            style={primaryButtonStyle}
          >
            {isSaving ? 'שומר...' : 'שמור'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

function DocTypesModal({
  current,
  onSave,
  onCancel,
}: {
  current: DocumentType[]
  onSave: (next: DocumentType[]) => Promise<void>
  onCancel: () => void
}) {
  const [selected, setSelected] = useState<DocumentType[]>(current)
  const [isSaving, setIsSaving] = useState(false)

  function toggle(t: DocumentType) {
    setSelected((curr) =>
      curr.includes(t) ? curr.filter((x) => x !== t) : [...curr, t]
    )
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      await onSave(selected)
    } catch {
      setIsSaving(false)
    }
  }

  return (
    <ModalShell
      title="סוגי מסמכים מתוכננים"
      onClose={onCancel}
    >
      <p
        style={{
          margin: '0 0 14px',
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        מה הלקוח רוצה להכין? לתזכורת ויזואלית בלבד.
      </p>
      <div style={{ display: 'grid', gap: 6, marginBottom: 18 }}>
        {SUPPORTED_DOC_TYPES.map((t) => {
          const checked = selected.includes(t)
          return (
            <label
              key={t}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                background: checked
                  ? 'var(--color-accent-bg)'
                  : '#fff',
                border: checked
                  ? '0.5px solid var(--color-accent)'
                  : '0.5px solid var(--border-default)',
                borderRadius: 6,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(t)}
                style={{ width: 15, height: 15, cursor: 'pointer' }}
              />
              <span>{DOC_TYPE_CONFIGS[t].label}</span>
            </label>
          )
        })}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'flex-end',
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          style={secondaryButtonStyle}
        >
          ביטול
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          style={primaryButtonStyle}
        >
          {isSaving ? 'שומר...' : 'שמור'}
        </button>
      </div>
    </ModalShell>
  )
}

function NewDocModal({
  docType,
  onChangeType,
  onCreate,
  onCancel,
  isCreating,
}: {
  docType: DocumentType | null
  onChangeType: (t: DocumentType | null) => void
  onCreate: () => void
  onCancel: () => void
  isCreating: boolean
}) {
  return (
    <ModalShell title="מסמך חדש" onClose={onCancel}>
      <FormField label="סוג מסמך">
        <select
          value={docType ?? ''}
          onChange={(e) =>
            onChangeType(
              (e.target.value || null) as DocumentType | null
            )
          }
          style={inputStyle}
        >
          <option value="">בחרי סוג...</option>
          {SUPPORTED_DOC_TYPES.map((t) => (
            <option key={t} value={t}>
              {DOC_TYPE_CONFIGS[t].label}
            </option>
          ))}
        </select>
      </FormField>
      <div
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'flex-end',
          marginTop: 18,
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={isCreating}
          style={secondaryButtonStyle}
        >
          ביטול
        </button>
        <button
          type="button"
          onClick={onCreate}
          disabled={!docType || isCreating}
          style={{
            ...primaryButtonStyle,
            opacity: !docType || isCreating ? 0.6 : 1,
            cursor: !docType || isCreating ? 'not-allowed' : 'pointer',
          }}
        >
          {isCreating ? 'יוצר...' : 'צור מסמך'}
        </button>
      </div>
    </ModalShell>
  )
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          borderRadius: 8,
          padding: 22,
          width: '100%',
          maxWidth: 460,
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.18)',
        }}
      >
        <h3
          style={{
            margin: '0 0 14px',
            fontSize: 17,
            fontWeight: 500,
            color: 'var(--text-primary)',
          }}
        >
          {title}
        </h3>
        {children}
      </div>
    </div>
  )
}

function FormField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--text-secondary)',
          marginBottom: 5,
        }}
      >
        {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

// ============================================================
// סגנונות משותפים
// ============================================================
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  fontSize: 13,
  border: '0.5px solid var(--border-hover)',
  borderRadius: 4,
  backgroundColor: '#fff',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
}

const primaryButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 500,
  backgroundColor: 'var(--color-primary)',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: '8px 14px',
  fontSize: 13,
  color: 'var(--text-primary)',
  backgroundColor: '#fff',
  border: '0.5px solid var(--border-hover)',
  borderRadius: 6,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const sectionEditButtonStyle: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--text-secondary)',
  border: 'none',
  fontSize: 12,
  cursor: 'pointer',
  padding: '4px 8px',
  fontFamily: 'inherit',
}

const dangerButtonStyle: React.CSSProperties = {
  background: 'transparent',
  color: '#DC2626',
  border: '0.5px solid #FCA5A5',
  padding: '6px 14px',
  borderRadius: 6,
  fontSize: 12,
  cursor: 'pointer',
  fontFamily: 'inherit',
}
