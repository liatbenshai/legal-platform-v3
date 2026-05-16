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
      setError('שגיאה בטעינת הלקוחות. נסה/י לרענן את הדף.')
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">תיקי לקוחות</h1>
          <Link
            href="/dashboard"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← חזרה ללוח המחוונים
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
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            + לקוח חדש
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-slate-500">טוען לקוחות...</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-700 text-lg font-medium">
              אין לקוחות בתיק שלך
            </p>
            <p className="text-slate-500 text-sm mt-2">
              לחץ/י על &quot;לקוח חדש&quot; כדי להוסיף תיק ראשון
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
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
