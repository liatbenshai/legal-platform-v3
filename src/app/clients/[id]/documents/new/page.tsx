'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

/**
 * Legacy redirect: the wizard at /documents/new was replaced by the
 * unified editor. Sending users here now bounces them back to the
 * client page where the '+ מסמך חדש' button creates the document
 * directly and redirects to the editor.
 */
export default function LegacyNewDocumentRedirect() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  useEffect(() => {
    router.replace(`/clients/${params.id}`)
  }, [params.id, router])

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <div style={{ color: 'var(--text-muted)' }}>מעביר לתיק הלקוח...</div>
    </main>
  )
}
