import Link from 'next/link'
import { createClient } from '@/lib/db/supabase-server'
import { logoutAction } from '@/lib/auth/actions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
            <form action={logoutAction}>
              <button
                type="submit"
                style={{
                  padding: '8px 14px',
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  border: '0.5px solid var(--border-hover)',
                  borderRadius: 4,
                  backgroundColor: 'transparent',
                }}
              >
                התנתקות
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            padding: 36,
            marginBottom: 24,
          }}
        >
          <h2
            className="doc-title"
            style={{
              fontSize: 24,
              fontWeight: 500,
              color: 'var(--color-primary)',
              margin: '0 0 8px',
            }}
          >
            ברוכים הבאים
          </h2>
          <div
            style={{
              width: 60,
              height: 2,
              backgroundColor: 'var(--color-accent)',
              marginBottom: 16,
            }}
          />
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-secondary)',
              margin: 0,
            }}
          >
            מערכת לניהול תיקי לקוחות, ספריית סעיפים ויצירת מסמכים משפטיים
            בעברית — עם הטיות מגדר אוטומטיות וייצוא ל-Word.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/clients"
            style={{
              backgroundColor: '#fff',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              padding: 24,
              textDecoration: 'none',
              transition: 'border-color 120ms, transform 120ms',
            }}
            className="hover:border-blue-400 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3 mb-3">
              <i
                className="ti ti-folder"
                style={{ fontSize: 20, color: 'var(--color-primary)' }}
              />
              <h3
                className="doc-title"
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: 'var(--color-primary)',
                  margin: 0,
                }}
              >
                תיקי לקוחות
              </h3>
            </div>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              נהלי תיקים, הזיני אנשים בתיק, צרי מסמכים חדשים.
            </p>
          </Link>

          <Link
            href="/library"
            style={{
              backgroundColor: '#fff',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              padding: 24,
              textDecoration: 'none',
            }}
            className="hover:border-blue-400 hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center gap-3 mb-3">
              <i
                className="ti ti-book"
                style={{ fontSize: 20, color: 'var(--color-primary)' }}
              />
              <h3
                className="doc-title"
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: 'var(--color-primary)',
                  margin: 0,
                }}
              >
                ספריית סעיפים
              </h3>
            </div>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              צפי וערכי סעיפים, צרי סעיפים אישיים ונהלי את מילון ההטיות.
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}
