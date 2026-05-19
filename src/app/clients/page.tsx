'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { TopNav } from '@/components/layout/TopNav'
import { createClient } from '@/lib/db/supabase'
import { DOC_TYPE_CONFIGS } from '@/lib/documents/type-config'
import { useUser } from '@/lib/hooks/useUser'
import type { Client, DocumentType } from '@/lib/types'

interface ClientRowWithExtras {
  id: string
  user_id: string
  display_name: string
  notes: string | null
  planned_doc_types: string[] | null
  created_at: string
  updated_at: string
  documents: Array<{ count: number }> | null
  persons: Array<{ id: string }> | null
}

interface ClientCard {
  client: Client
  documentCount: number
  personCount: number
}

function mapRow(row: ClientRowWithExtras): ClientCard {
  return {
    client: {
      id: row.id,
      userId: row.user_id,
      displayName: row.display_name,
      notes: row.notes ?? undefined,
      plannedDocTypes: (row.planned_doc_types ?? []) as DocumentType[],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    },
    documentCount: row.documents?.[0]?.count ?? 0,
    personCount: row.persons?.length ?? 0,
  }
}

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export default function ClientsPage() {
  const { user, loading: userLoading } = useUser()
  const [clients, setClients] = useState<ClientCard[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userLoading) return
    if (!user) {
      Promise.resolve().then(() => setIsLoading(false))
      return
    }

    let cancelled = false
    const supabase = createClient()
    supabase
      .from('clients')
      .select('*, documents(count), persons(id)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .then(({ data, error: queryError }) => {
        if (cancelled) return
        if (queryError) {
          setError('שגיאה בטעינת הלקוחות. נסי לרענן את הדף.')
          setIsLoading(false)
          return
        }
        const mapped = ((data ?? []) as ClientRowWithExtras[]).map(mapRow)
        setClients(mapped)
        setError(null)
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, userLoading])

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return clients
    return clients.filter((c) =>
      c.client.displayName.toLowerCase().includes(term)
    )
  }, [clients, searchTerm])

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      <TopNav clientsCount={clients.length} />

      <div className="max-w-6xl mx-auto px-6 py-8">
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
                fontSize: 22,
                fontWeight: 500,
                color: 'var(--text-primary)',
              }}
            >
              תיקי לקוחות
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: 'var(--text-secondary)',
              }}
            >
              {clients.length} תיקים סך הכל
            </p>
          </div>
          <Link
            href="/clients/new"
            style={{
              padding: '9px 16px',
              fontSize: 13,
              fontWeight: 500,
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              borderRadius: 6,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <i className="ti ti-plus" style={{ fontSize: 14 }} aria-hidden="true" />
            לקוח חדש
          </Link>
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

        {/* חיפוש */}
        {clients.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש לפי שם תיק..."
              style={{
                width: '100%',
                maxWidth: 360,
                padding: '8px 12px',
                fontSize: 13,
                border: '0.5px solid var(--border-hover)',
                borderRadius: 6,
                backgroundColor: '#fff',
                fontFamily: 'inherit',
              }}
            />
          </div>
        )}

        {/* רשימת לקוחות */}
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
        ) : clients.length === 0 ? (
          <div
            style={{
              padding: 60,
              textAlign: 'center',
              backgroundColor: '#fff',
              border: '0.5px dashed var(--border-hover)',
              borderRadius: 8,
            }}
          >
            <i
              className="ti ti-users"
              style={{
                fontSize: 36,
                color: 'var(--text-muted)',
              }}
              aria-hidden="true"
            />
            <p
              style={{
                margin: '12px 0 4px',
                fontSize: 15,
                color: 'var(--text-primary)',
                fontWeight: 500,
              }}
            >
              אין עדיין תיקי לקוחות
            </p>
            <p
              style={{
                margin: '0 0 16px',
                fontSize: 13,
                color: 'var(--text-secondary)',
              }}
            >
              צרי את התיק הראשון שלך כדי להתחיל
            </p>
            <Link
              href="/clients/new"
              style={{
                padding: '9px 18px',
                fontSize: 13,
                fontWeight: 500,
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                borderRadius: 6,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <i className="ti ti-plus" style={{ fontSize: 14 }} aria-hidden="true" />
              לקוח חדש
            </Link>
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
            לא נמצאו תיקים התואמים את החיפוש
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}
          >
            {filtered.map(({ client, documentCount }) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}`}
                style={{
                  display: 'block',
                  backgroundColor: '#fff',
                  border: '0.5px solid var(--border-default)',
                  borderRadius: 8,
                  padding: 18,
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    margin: '0 0 8px',
                  }}
                >
                  {client.displayName}
                </h3>

                {/* תגיות סוגי מסמכים מתוכננים */}
                {client.plannedDocTypes.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 4,
                      marginBottom: 12,
                    }}
                  >
                    {client.plannedDocTypes.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: 10,
                          padding: '2px 8px',
                          backgroundColor: 'var(--color-accent-bg)',
                          color: 'var(--status-review-fg)',
                          border: '0.5px solid var(--color-accent)',
                          borderRadius: 9,
                          fontWeight: 500,
                        }}
                      >
                        {DOC_TYPE_CONFIGS[t]?.label ?? t}
                      </span>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    paddingTop: client.plannedDocTypes.length > 0 ? 0 : 8,
                    borderTop:
                      client.plannedDocTypes.length > 0
                        ? 'none'
                        : '0.5px solid var(--border-default)',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <i
                      className="ti ti-files"
                      style={{ fontSize: 13 }}
                      aria-hidden="true"
                    />
                    {documentCount}{' '}
                    {documentCount === 1 ? 'מסמך' : 'מסמכים'}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {formatDate(client.updatedAt)}
                  </span>
                </div>

                {client.notes && (
                  <p
                    style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: '0.5px solid var(--border-default)',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {client.notes}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
