import Link from 'next/link'
import { createClient } from '@/lib/db/supabase-server'
import { logoutAction } from '@/lib/auth/actions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">
            מערכת מסמכים משפטיים
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600" dir="ltr">
              {user?.email}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="px-4 py-1.5 text-sm text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                התנתקות
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            ברוכים הבאים
          </h2>
          <p className="text-slate-600 mb-8">
            מערכת לניהול תיקי לקוחות ויצירת מסמכים משפטיים בעברית
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/clients"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              צא ליצירת לקוח חדש
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
