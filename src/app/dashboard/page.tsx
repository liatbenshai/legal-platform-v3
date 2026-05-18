'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logoutAction } from '@/lib/auth/actions'
import { getClients } from '@/lib/db/clients'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  createDocument,
  deleteDocument,
  getAllUserDocuments,
  type DocumentWithClient,
} from '@/lib/db/documents'
import { createClient as createSupabaseClient } from '@/lib/db/supabase'
import {
  DOC_TYPE_CONFIGS,
  SUPPORTED_DOC_TYPES,
} from '@/lib/documents/type-config'
import { useUser } from '@/lib/hooks/useUser'
import type { Client, DocumentStatus, DocumentType } from '@/lib/types'

const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'טיוטה',
  review: 'לבדיקה',
  signed: 'חתום',
}

const STATUS_STYLES: Record<DocumentStatus, { bg: string; color: string }> = {
  draft: { bg: '#F3F4F6', color: '#6B5544' },
  review: { bg: '#FEF3C7', color: '#92660A' },
  signed: { bg: '#DCFCE7', color: '#15803D' },
}

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

type TypeFilter = 'all' | DocumentType
type StatusFilter = 'all' | DocumentStatus

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser()
  const router = useRouter()
  const [supabase] = useState(() => createSupabaseClient())
  const [documents, setDocuments] = useState<DocumentWithClient[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isNewDocOpen, setIsNewDocOpen] = useState(false)
  const [newDocType, setNewDocType] = useState<DocumentType | null>(null)
  const [newDocClientId, setNewDocClientId] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  const [docToDelete, setDocToDelete] =
    useState<DocumentWithClient | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError(null)
    try {
      const [docs, cls] = await Promise.all([
        getAllUserDocuments(supabase, user.id),
        getClients(supabase, user.id),
      ])
      setDocuments(docs)
      setClients(cls)
    } catch {
      setError('שגיאה בטעינת המסמכים')
    } finally {
      setIsLoading(false)
    }
  }, [supabase, user])

  useEffect(() => {
    if (userLoading) return
    if (!user) {
      setIsLoading(false)
      return
    }
    void load()
  }, [user, userLoading, load])

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (typeFilter !== 'all' && d.type !== typeFilter) return false
      if (statusFilter !== 'all' && d.status !== statusFilter) return false
      return true
    })
  }, [documents, typeFilter, statusFilter])

  async function handleDeleteDocument() {
    if (!docToDelete) return
    setIsDeleting(true)
    try {
      await deleteDocument(supabase, docToDelete.id)
      setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id))
      setDocToDelete(null)
    } catch {
      setError('שגיאה במחיקת המסמך')
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleCreateDocument() {
    if (!user || !newDocType || !newDocClientId) return
    setIsCreating(true)
    try {
      const doc = await createDocument(
        supabase,
        newDocClientId,
        user.id,
        newDocType,
        'מסמך חדש'
      )
      router.push(`/clients/${newDocClientId}/documents/${doc.id}`)
    } catch {
      setError('שגיאה ביצירת המסמך')
      setIsCreating(false)
    }
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
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1
            className="doc-title"
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: 'var(--color-primary)',
              margin: 0,
            }}
          >
            משרד עורך דין · מערכת מסמכים
          </h1>
          <div className="flex items-center gap-4">
            <span
              style={{ fontSize: 12, color: 'var(--text-secondary)' }}
              dir="ltr"
            >
              {user?.email}
            </span>
            <Link
              href="/settings"
              style={{
                fontSize: 13,
                padding: '6px 10px',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                border: '0.5px solid var(--border-hover)',
                borderRadius: 4,
              }}
            >
              הגדרות
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                style={{
                  padding: '6px 14px',
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  border: '0.5px solid var(--border-hover)',
                  borderRadius: 4,
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                }}
              >
                התנתקות
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2
                className="doc-title"
                style={{
                  fontSize: 22,
                  fontWeight: 500,
                  color: 'var(--color-primary)',
                  margin: '0 0 6px',
                }}
              >
                המסמכים שלך
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  margin: 0,
                }}
              >
                {documents.length} מסמכים סך הכל · {filtered.length} מוצגים
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/clients"
                style={{
                  padding: '9px 14px',
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  border: '0.5px solid var(--border-hover)',
                  borderRadius: 4,
                  textDecoration: 'none',
                  backgroundColor: '#fff',
                }}
              >
                <i className="ti ti-folder" style={{ marginLeft: 4 }} />
                תיקי לקוחות
              </Link>
              <Link
                href="/library"
                style={{
                  padding: '9px 14px',
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  border: '0.5px solid var(--border-hover)',
                  borderRadius: 4,
                  textDecoration: 'none',
                  backgroundColor: '#fff',
                }}
              >
                <i className="ti ti-book" style={{ marginLeft: 4 }} />
                ספרייה
              </Link>
              <button
                type="button"
                onClick={() => setIsNewDocOpen(true)}
                disabled={clients.length === 0}
                title={
                  clients.length === 0 ? 'יש ליצור לקוח לפני יצירת מסמך' : ''
                }
                style={{
                  padding: '9px 18px',
                  fontSize: 13,
                  fontWeight: 500,
                  backgroundColor: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: clients.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: clients.length === 0 ? 0.5 : 1,
                }}
              >
                + מסמך חדש
              </button>
            </div>
          </div>

          <div className="flex gap-2 items-center" style={{ fontSize: 12 }}>
            <span style={{ color: 'var(--text-muted)' }}>סינון:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              style={{
                padding: '5px 8px',
                fontSize: 12,
                border: '0.5px solid var(--border-hover)',
                borderRadius: 4,
                backgroundColor: '#fff',
              }}
            >
              <option value="all">כל הסוגים</option>
              {SUPPORTED_DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {DOC_TYPE_CONFIGS[t].label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as StatusFilter)
              }
              style={{
                padding: '5px 8px',
                fontSize: 12,
                border: '0.5px solid var(--border-hover)',
                borderRadius: 4,
                backgroundColor: '#fff',
              }}
            >
              <option value="all">כל הסטטוסים</option>
              <option value="draft">טיוטה</option>
              <option value="review">לבדיקה</option>
              <option value="signed">חתום</option>
            </select>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              marginBottom: 16,
              padding: '10px 14px',
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
        ) : documents.length === 0 ? (
          <div
            className="text-center py-16"
            style={{
              backgroundColor: '#fff',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
            }}
          >
            <p
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: 'var(--text-primary)',
                margin: '0 0 8px',
              }}
            >
              אין עדיין מסמכים
            </p>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                margin: '0 0 20px',
              }}
            >
              {clients.length === 0
                ? 'צרי קודם לקוח, ואז ניתן ליצור עבורו מסמך.'
                : 'לחצי על "+ מסמך חדש" כדי להתחיל.'}
            </p>
            {clients.length === 0 && (
              <Link
                href="/clients"
                style={{
                  display: 'inline-block',
                  padding: '9px 18px',
                  fontSize: 13,
                  fontWeight: 500,
                  backgroundColor: 'var(--color-primary)',
                  color: '#fff',
                  borderRadius: 4,
                  textDecoration: 'none',
                }}
              >
                לעמוד הלקוחות
              </Link>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-12"
            style={{ color: 'var(--text-muted)', fontSize: 13 }}
          >
            אין מסמכים שתואמים לסינון
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((d) => {
              const statusStyle = STATUS_STYLES[d.status]
              const typeLabel = DOC_TYPE_CONFIGS[d.type]?.label ?? d.type
              return (
                <div key={d.id} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setDocToDelete(d)
                    }}
                    aria-label={`מחק את ${d.title}`}
                    title="מחק מסמך"
                    style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
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
                      cursor: 'pointer',
                      zIndex: 2,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#DC2626'
                      e.currentTarget.style.backgroundColor = '#FEE2E2'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-muted)'
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    ×
                  </button>
                  <Link
                  href={`/clients/${d.clientId}/documents/${d.id}`}
                  style={{
                    display: 'block',
                    backgroundColor: '#fff',
                    border: '1px solid var(--border-default)',
                    borderRadius: 8,
                    padding: 18,
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'border-color 120ms, transform 120ms',
                  }}
                  className="hover:border-stone-400 hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-2 mb-3" style={{ paddingLeft: 22 }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      {typeLabel}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        padding: '2px 7px',
                        borderRadius: 3,
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                        flexShrink: 0,
                        fontWeight: 500,
                      }}
                    >
                      {STATUS_LABELS[d.status]}
                    </span>
                  </div>
                  <h3
                    className="doc-title"
                    style={{
                      fontSize: 16,
                      fontWeight: 500,
                      color: 'var(--color-primary)',
                      margin: '0 0 14px',
                      lineHeight: 1.35,
                      minHeight: 42,
                    }}
                  >
                    {d.title}
                  </h3>
                  <div
                    className="flex items-center justify-between"
                    style={{
                      paddingTop: 12,
                      borderTop: '0.5px solid var(--border-default)',
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span className="truncate">
                      <i
                        className="ti ti-user"
                        style={{ marginLeft: 4, fontSize: 12 }}
                      />
                      {d.clientName}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    >
                      עודכן {formatDate(d.updatedAt)}
                    </span>
                  </div>
                </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

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
        isProcessing={isDeleting}
        onConfirm={handleDeleteDocument}
        onCancel={() => setDocToDelete(null)}
      />

      {isNewDocOpen && (
        <div
          onClick={() => setIsNewDocOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(61, 40, 23, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: 8,
              padding: 24,
              minWidth: 380,
              maxWidth: 480,
              boxShadow: '0 12px 32px rgba(61, 40, 23, 0.15)',
            }}
          >
            <h3
              className="doc-title"
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: 'var(--color-primary)',
                margin: '0 0 16px',
              }}
            >
              מסמך חדש
            </h3>

            <div style={{ marginBottom: 14 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}
              >
                סוג מסמך
              </label>
              <select
                value={newDocType ?? ''}
                onChange={(e) =>
                  setNewDocType((e.target.value || null) as DocumentType | null)
                }
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: 13,
                  border: '0.5px solid var(--border-hover)',
                  borderRadius: 4,
                  backgroundColor: '#fff',
                }}
              >
                <option value="">בחרי סוג…</option>
                {SUPPORTED_DOC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {DOC_TYPE_CONFIGS[t].label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: 6,
                }}
              >
                לקוח
              </label>
              <select
                value={newDocClientId}
                onChange={(e) => setNewDocClientId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: 13,
                  border: '0.5px solid var(--border-hover)',
                  borderRadius: 4,
                  backgroundColor: '#fff',
                }}
              >
                <option value="">בחרי לקוח…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsNewDocOpen(false)}
                style={{
                  padding: '8px 14px',
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  border: '0.5px solid var(--border-hover)',
                  borderRadius: 4,
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                }}
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleCreateDocument}
                disabled={!newDocType || !newDocClientId || isCreating}
                style={{
                  padding: '8px 18px',
                  fontSize: 13,
                  fontWeight: 500,
                  backgroundColor: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor:
                    !newDocType || !newDocClientId || isCreating
                      ? 'not-allowed'
                      : 'pointer',
                  opacity:
                    !newDocType || !newDocClientId || isCreating ? 0.5 : 1,
                }}
              >
                {isCreating ? 'יוצר...' : 'יצירה'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
