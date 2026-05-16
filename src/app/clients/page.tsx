'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ClientCard } from '@/components/clients/ClientCard'
import { NewClientModal } from '@/components/clients/NewClientModal'
import { createClient } from '@/lib/db/supabase'
import { useUser } from '@/lib/hooks/useUser'
import type { Client } from '@/lib/types'

interface ClientRowWithDocs {
  id: string
  user_id: string
  display_name: string
  notes: string | null
  created_at: string
  updated_at: string
  documents: Array<{ count: number }> | null
}

interface ClientWithCount {
  client: Client
  documentCount: number
}

function mapRow(row: ClientRowWithDocs): ClientWithCount {
  return {
    client: {
      id: row.id,
      userId: row.user_id,
      displayName: row.display_name,
      notes: row.notes ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    },
    documentCount: row.documents?.[0]?.count ?? 0,
  }
}

export default function ClientsPage() {
  const { user, loading: userLoading } = useUser()
  const [clients, setClients] = useState<ClientWithCount[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadClients = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error: queryError } = await supabase
      .from('clients')
      .select('*, documents(count)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    if (queryError) {
      setError('שגיאה בטעינת הלקוחות. נסי לרענן את הדף.')
      setIsLoading(false)
      return
    }
    const mapped = ((data ?? []) as ClientRowWithDocs[]).map(mapRow)
    setClients(mapped)
    setIsLoading(false)
  }, [user])

  useEffect(() => {
    if (userLoading) return
    if (!user) {
      setIsLoading(false)
      return
    }
    void loadClients()
  }, [user, userLoading, loadClients])

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
              fontSize: 20,
              fontWeight: 500,
              color: 'var(--color-primary)',
              margin: 0,
            }}
          >
            תיקי לקוחות
          </h1>
          <Link
            href="/dashboard"
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
            }}
            className="hover:text-slate-900"
          >
            → ללוח המחוונים
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חיפוש לקוח לפי שם..."
            aria-label="חיפוש לקוח"
            style={{
              flex: 1,
              padding: '9px 12px',
              fontSize: 14,
              backgroundColor: '#fff',
              border: '0.5px solid var(--border-hover)',
              borderRadius: 4,
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 500,
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            + לקוח חדש
          </button>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              marginBottom: 20,
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
            טוען לקוחות...
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16">
            <p
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: 'var(--text-primary)',
                margin: '0 0 8px',
              }}
            >
              אין לקוחות בתיק שלך
            </p>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              לחצי על &quot;לקוח חדש&quot; כדי להוסיף תיק ראשון
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="text-center py-12"
            style={{ color: 'var(--text-muted)', fontSize: 13 }}
          >
            לא נמצאו לקוחות התואמים את החיפוש &quot;{searchTerm}&quot;
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <ClientCard
                key={c.client.id}
                client={c.client}
                documentCount={c.documentCount}
              />
            ))}
          </div>
        )}
      </div>

      <NewClientModal
        open={isModalOpen}
        userId={user?.id ?? null}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => {
          void loadClients()
        }}
      />
    </main>
  )
}
