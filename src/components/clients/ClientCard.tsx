import Link from 'next/link'
import type { Client } from '@/lib/types'

interface ClientCardProps {
  client: Client
  documentCount: number
}

function formatDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function ClientCard({ client, documentCount }: ClientCardProps) {
  return (
    <Link
      href={`/clients/${client.id}`}
      className="block bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
    >
      <h3 className="text-lg font-bold text-slate-800 mb-3 truncate">
        {client.displayName}
      </h3>
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>
          {documentCount} {documentCount === 1 ? 'מסמך' : 'מסמכים'}
        </span>
        <span>עודכן: {formatDate(client.updatedAt)}</span>
      </div>
      {client.notes && (
        <p className="mt-3 text-sm text-slate-500 line-clamp-2">
          {client.notes}
        </p>
      )}
    </Link>
  )
}
