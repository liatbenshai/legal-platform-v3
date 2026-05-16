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
      style={{
        display: 'block',
        backgroundColor: '#fff',
        border: '1px solid var(--border-default)',
        borderRadius: 8,
        padding: 20,
        textDecoration: 'none',
        transition: 'border-color 120ms',
      }}
      className="hover:border-blue-400"
    >
      <h3
        className="doc-title truncate"
        style={{
          fontSize: 17,
          fontWeight: 500,
          color: 'var(--color-primary)',
          margin: '0 0 10px',
        }}
      >
        {client.displayName}
      </h3>
      <div
        className="flex items-center justify-between"
        style={{ fontSize: 12, color: 'var(--text-secondary)' }}
      >
        <span>
          <i
            className="ti ti-files"
            style={{ marginLeft: 4, fontSize: 13 }}
          />
          {documentCount} {documentCount === 1 ? 'מסמך' : 'מסמכים'}
        </span>
        <span>עודכן {formatDate(client.updatedAt)}</span>
      </div>
      {client.notes && (
        <p
          className="line-clamp-2"
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid var(--border-default)',
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          {client.notes}
        </p>
      )}
    </Link>
  )
}
