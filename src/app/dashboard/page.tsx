'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getClients } from '@/lib/db/clients'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TopNav } from '@/components/layout/TopNav'
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

// ארבעה קיצורי דרך ליצירה מהירה — תואמים את SUPPORTED_DOC_TYPES
const QUICK_CREATE_TYPES: Array<{
  type: DocumentType
  shortLabel: string
  icon: string
}> = [
  { type: 'poa-property', shortLabel: 'ייפוי כוח', icon: 'ti-key' },
  { type: 'will-individual', shortLabel: 'צוואת יחיד', icon: 'ti-feather' },
  { type: 'will-mutual', shortLabel: 'צוואה הדדית', icon: 'ti-users' },
  { type: 'fee-agreement', shortLabel: 'שכר טרחה', icon: 'ti-receipt' },
]

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function formatTodayHebrew(): string {
  const today = new Date()
  const weekdays = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
  const months = [
    'בינואר',
    'בפברואר',
    'במרץ',
    'באפריל',
    'במאי',
    'ביוני',
    'ביולי',
    'באוגוסט',
    'בספטמבר',
    'באוקטובר',
    'בנובמבר',
    'בדצמבר',
  ]
  return `יום ${weekdays[today.getDay()]} ${today.getDate()} ${
    months[today.getMonth()]
  }`
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'לילה טוב'
  if (h < 12) return 'בוקר טוב'
  if (h < 18) return 'צהריים טובים'
  if (h < 21) return 'ערב טוב'
  return 'לילה טוב'
}

function relativeTime(d: Date): string {
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'הרגע'
  if (diffMin < 60) return `לפני ${diffMin} דק׳`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `לפני ${diffHr} שע׳`
  const diffDays = Math.floor(diffHr / 24)
  if (diffDays === 1) return 'אתמול'
  if (diffDays < 7) return `לפני ${diffDays} ימים`
  if (diffDays < 30) return `לפני ${Math.floor(diffDays / 7)} שב׳`
  return formatDate(d)
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

  // "עכשיו" נקבע פעם אחת בעת טעינת המסך כדי למנוע חישובים לא דטרמיניסטיים בתוך useMemo
  const [now] = useState(() => new Date())

  useEffect(() => {
    if (userLoading) return
    if (!user) {
      Promise.resolve().then(() => setIsLoading(false))
      return
    }

    let cancelled = false
    Promise.all([
      getAllUserDocuments(supabase, user.id),
      getClients(supabase, user.id),
    ])
      .then(([docs, cls]) => {
        if (cancelled) return
        setDocuments(docs)
        setClients(cls)
        setError(null)
        setIsLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('שגיאה בטעינת המסמכים')
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, userLoading, supabase])

  // ===== חישוב סטטיסטיקות =====
  const stats = useMemo(() => {
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const activeDocs = documents.filter((d) => d.status !== 'signed').length
    const reviewDocs = documents.filter((d) => d.status === 'review').length
    const signedThisMonth = documents.filter(
      (d) => d.status === 'signed' && d.updatedAt >= startOfMonth
    ).length
    const newClientsThisWeek = clients.filter(
      (c) => c.createdAt >= oneWeekAgo
    ).length

    return {
      active: activeDocs,
      review: reviewDocs,
      clients: clients.length,
      newClientsThisWeek,
      signedThisMonth,
    }
  }, [documents, clients, now])

  const recentDocuments = useMemo(
    () => documents.slice(0, 4),
    [documents]
  )

  const recentClients = useMemo(() => {
    const docCountByClient = new Map<string, number>()
    documents.forEach((d) => {
      docCountByClient.set(
        d.clientId,
        (docCountByClient.get(d.clientId) ?? 0) + 1
      )
    })
    return [...clients]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 4)
      .map((c) => ({
        ...c,
        documentCount: docCountByClient.get(c.id) ?? 0,
      }))
  }, [clients, documents])

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (typeFilter !== 'all' && d.type !== typeFilter) return false
      if (statusFilter !== 'all' && d.status !== statusFilter) return false
      return true
    })
  }, [documents, typeFilter, statusFilter])

  // ===== Handlers =====
  function openQuickCreate(type: DocumentType) {
    setNewDocType(type)
    setNewDocClientId('')
    setIsNewDocOpen(true)
  }

  function openGenericCreate() {
    setNewDocType(null)
    setNewDocClientId('')
    setIsNewDocOpen(true)
  }

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
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      <TopNav clientsCount={clients.length} />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* ===== כותרת + פעולות ===== */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 22,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1
              style={{
                margin: '0 0 4px',
                fontSize: 24,
                fontWeight: 500,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}
            >
              {greeting()}
              {user?.email ? `, ${user.email.split('@')[0]}` : ''}
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: 'var(--text-secondary)',
              }}
            >
              {formatTodayHebrew()}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Link
              href="/clients"
              style={{
                backgroundColor: '#fff',
                color: 'var(--text-primary)',
                border: '0.5px solid var(--border-hover)',
                padding: '9px 14px',
                borderRadius: 6,
                fontSize: 13,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <i className="ti ti-user-plus" style={{ fontSize: 14 }} aria-hidden="true" />
              לקוח חדש
            </Link>
            <button
              type="button"
              onClick={openGenericCreate}
              disabled={clients.length === 0}
              title={
                clients.length === 0
                  ? 'יש ליצור לקוח לפני יצירת מסמך'
                  : ''
              }
              style={{
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                padding: '9px 16px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                cursor: clients.length === 0 ? 'not-allowed' : 'pointer',
                opacity: clients.length === 0 ? 0.5 : 1,
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <i className="ti ti-plus" style={{ fontSize: 14 }} aria-hidden="true" />
              מסמך חדש
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 18,
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

        {/* ===== כרטיסי מספרים ===== */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 10,
            marginBottom: 22,
          }}
        >
          <StatCard label="מסמכים פעילים" value={stats.active} />
          <StatCard
            label="ממתינים לבדיקה"
            value={stats.review}
            tone="warning"
          />
          <StatCard
            label="לקוחות"
            value={stats.clients}
            sub={
              stats.newClientsThisWeek > 0
                ? `+${stats.newClientsThisWeek} השבוע`
                : undefined
            }
            subTone="success"
          />
          <StatCard
            label="נחתמו החודש"
            value={stats.signedThisMonth}
            tone="success"
          />
        </div>

        {/* ===== יצירה מהירה לפי סוג ===== */}
        <p
          style={{
            margin: '0 0 10px',
            fontSize: 12,
            color: 'var(--text-secondary)',
            fontWeight: 500,
          }}
        >
          יצירה מהירה לפי סוג
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 8,
            marginBottom: 22,
          }}
        >
          {QUICK_CREATE_TYPES.map((qc) => (
            <button
              key={qc.type}
              type="button"
              onClick={() => openQuickCreate(qc.type)}
              disabled={clients.length === 0}
              title={
                clients.length === 0
                  ? 'יש ליצור לקוח לפני יצירת מסמך'
                  : ''
              }
              style={{
                backgroundColor: '#fff',
                border: '0.5px solid var(--border-default)',
                borderRight: '3px solid var(--color-accent)',
                borderRadius: 6,
                padding: 14,
                textAlign: 'center',
                cursor: clients.length === 0 ? 'not-allowed' : 'pointer',
                opacity: clients.length === 0 ? 0.5 : 1,
                fontFamily: 'inherit',
                transition: 'border-color 120ms, transform 120ms',
              }}
              className="hover:!border-r-[3px] hover:!border-r-[color:var(--color-accent-hover)]"
            >
              <i
                className={`ti ${qc.icon}`}
                style={{ fontSize: 20, color: 'var(--color-primary)' }}
                aria-hidden="true"
              />
              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                }}
              >
                {qc.shortLabel}
              </p>
            </button>
          ))}
        </div>

        {/* ===== שתי עמודות: מסמכים אחרונים + לקוחות אחרונים ===== */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 12,
            marginBottom: 28,
          }}
        >
          {/* מסמכים אחרונים */}
          <div
            style={{
              backgroundColor: '#fff',
              border: '0.5px solid var(--border-default)',
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '10px 14px',
                borderBottom: '0.5px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                }}
              >
                מסמכים אחרונים
              </span>
              <a
                href="#all-documents"
                style={{
                  fontSize: 11,
                  color: 'var(--color-primary)',
                  textDecoration: 'none',
                }}
              >
                כל המסמכים ‹
              </a>
            </div>
            {recentDocuments.length === 0 ? (
              <div
                style={{
                  padding: 22,
                  textAlign: 'center',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                }}
              >
                אין עדיין מסמכים
              </div>
            ) : (
              recentDocuments.map((d, idx) => {
                const statusStyle = STATUS_STYLES[d.status]
                return (
                  <Link
                    key={d.id}
                    href={`/clients/${d.clientId}/documents/${d.id}`}
                    style={{
                      display: 'block',
                      padding: '10px 14px',
                      textDecoration: 'none',
                      color: 'inherit',
                      borderBottom:
                        idx === recentDocuments.length - 1
                          ? 'none'
                          : '0.5px solid var(--border-default)',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: 'var(--text-primary)',
                        fontWeight: 500,
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
                      {d.clientName} · {relativeTime(d.updatedAt)}
                    </p>
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: 4,
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                        fontSize: 10,
                        padding: '2px 7px',
                        borderRadius: 9,
                        fontWeight: 500,
                      }}
                    >
                      {STATUS_LABELS[d.status]}
                    </span>
                  </Link>
                )
              })
            )}
          </div>

          {/* לקוחות אחרונים */}
          <div
            style={{
              backgroundColor: '#fff',
              border: '0.5px solid var(--border-default)',
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '10px 14px',
                borderBottom: '0.5px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                }}
              >
                לקוחות אחרונים
              </span>
              <Link
                href="/clients"
                style={{
                  fontSize: 11,
                  color: 'var(--color-primary)',
                  textDecoration: 'none',
                }}
              >
                כל הלקוחות ‹
              </Link>
            </div>
            {recentClients.length === 0 ? (
              <div
                style={{
                  padding: 22,
                  textAlign: 'center',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                }}
              >
                אין עדיין לקוחות.{' '}
                <Link
                  href="/clients"
                  style={{ color: 'var(--color-primary)' }}
                >
                  ליצירת לקוח ראשון
                </Link>
              </div>
            ) : (
              recentClients.map((c, idx) => (
                <Link
                  key={c.id}
                  href={`/clients/${c.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    textDecoration: 'none',
                    color: 'inherit',
                    borderBottom:
                      idx === recentClients.length - 1
                        ? 'none'
                        : '0.5px solid var(--border-default)',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-tertiary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--color-primary)',
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  >
                    {c.displayName.charAt(0)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: 'var(--text-primary)',
                        fontWeight: 500,
                      }}
                    >
                      {c.displayName}
                    </p>
                    <p
                      style={{
                        margin: '2px 0 0',
                        fontSize: 11,
                        color: 'var(--text-muted)',
                      }}
                    >
                      נוסף {relativeTime(c.createdAt)} ·{' '}
                      {c.documentCount} מסמכים
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* ===== כל המסמכים (גריד עם פילטרים) ===== */}
        <div id="all-documents" style={{ scrollMarginTop: 80 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 12,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 500,
                color: 'var(--text-primary)',
              }}
            >
              כל המסמכים
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: 'var(--text-secondary)',
              }}
            >
              {documents.length} מסמכים סך הכל · {filtered.length} מוצגים
            </p>
          </div>

          {/* פילטרים */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              marginBottom: 14,
              fontSize: 12,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>סינון:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              style={{
                padding: '5px 10px',
                fontSize: 12,
                border: '0.5px solid var(--border-hover)',
                borderRadius: 4,
                backgroundColor: '#fff',
                fontFamily: 'inherit',
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
                padding: '5px 10px',
                fontSize: 12,
                border: '0.5px solid var(--border-hover)',
                borderRadius: 4,
                backgroundColor: '#fff',
                fontFamily: 'inherit',
              }}
            >
              <option value="all">כל הסטטוסים</option>
              <option value="draft">טיוטה</option>
              <option value="review">לבדיקה</option>
              <option value="signed">חתום</option>
            </select>
          </div>

          {isLoading ? (
            <div
              style={{
                padding: 40,
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 13,
              }}
            >
              טוען...
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: 'center',
                backgroundColor: '#fff',
                border: '0.5px dashed var(--border-hover)',
                borderRadius: 6,
                color: 'var(--text-muted)',
                fontSize: 13,
              }}
            >
              לא נמצאו מסמכים התואמים את הסינון
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 12,
              }}
            >
              {filtered.map((d) => {
                const typeLabel = DOC_TYPE_CONFIGS[d.type]?.label ?? d.type
                const statusStyle = STATUS_STYLES[d.status]
                return (
                  <div key={d.id} style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setDocToDelete(d)}
                      title="מחיקת מסמך"
                      aria-label="מחיקת מסמך"
                      style={{
                        position: 'absolute',
                        top: 10,
                        insetInlineStart: 10,
                        zIndex: 1,
                        width: 22,
                        height: 22,
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: 16,
                        lineHeight: 1,
                        borderRadius: 4,
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
                        border: '0.5px solid var(--border-default)',
                        borderRadius: 8,
                        padding: 16,
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 8,
                          marginBottom: 10,
                          paddingInlineStart: 24,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            letterSpacing: 0.3,
                          }}
                        >
                          {typeLabel}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '2px 7px',
                            borderRadius: 9,
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
                        style={{
                          fontSize: 15,
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                          margin: '0 0 12px',
                          lineHeight: 1.4,
                          minHeight: 42,
                        }}
                      >
                        {d.title}
                      </h3>
                      <div
                        style={{
                          paddingTop: 10,
                          borderTop:
                            '0.5px solid var(--border-default)',
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <i
                            className="ti ti-user"
                            style={{ fontSize: 12 }}
                            aria-hidden="true"
                          />
                          {d.clientName}
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
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== דיאלוג מחיקה ===== */}
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

      {/* ===== דיאלוג מסמך חדש ===== */}
      {isNewDocOpen && (
        <div
          onClick={() => setIsNewDocOpen(false)}
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
              padding: 24,
              width: '100%',
              maxWidth: 460,
              boxShadow: '0 12px 32px rgba(15, 23, 42, 0.18)',
            }}
          >
            <h3
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: 'var(--text-primary)',
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
                  setNewDocType(
                    (e.target.value || null) as DocumentType | null
                  )
                }
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: 13,
                  border: '0.5px solid var(--border-hover)',
                  borderRadius: 4,
                  backgroundColor: '#fff',
                  fontFamily: 'inherit',
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
                  fontFamily: 'inherit',
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

            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={() => setIsNewDocOpen(false)}
                style={{
                  padding: '8px 14px',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  border: '0.5px solid var(--border-hover)',
                  borderRadius: 4,
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
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
                  fontFamily: 'inherit',
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

// ============================================================
// כרטיס סטטיסטיקה
// ============================================================
interface StatCardProps {
  label: string
  value: number
  sub?: string
  tone?: 'default' | 'warning' | 'success'
  subTone?: 'default' | 'warning' | 'success'
}

function StatCard({
  label,
  value,
  sub,
  tone = 'default',
  subTone = 'default',
}: StatCardProps) {
  const valueColor =
    tone === 'warning'
      ? 'var(--status-review-fg)'
      : tone === 'success'
      ? 'var(--status-success)'
      : 'var(--text-primary)'
  const subColor =
    subTone === 'success'
      ? 'var(--status-success)'
      : subTone === 'warning'
      ? 'var(--status-review-fg)'
      : 'var(--text-muted)'

  return (
    <div
      style={{
        backgroundColor: '#fff',
        border: '0.5px solid var(--border-default)',
        borderRadius: 6,
        padding: 14,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 11,
          color: 'var(--text-secondary)',
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: '4px 0 0',
          fontSize: 22,
          fontWeight: 500,
          color: valueColor,
        }}
      >
        {value}
      </p>
      {sub && (
        <p style={{ margin: '2px 0 0', fontSize: 10, color: subColor }}>
          {sub}
        </p>
      )}
    </div>
  )
}
