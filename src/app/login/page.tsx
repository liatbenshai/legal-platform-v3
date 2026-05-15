'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { loginAction, type AuthState } from '@/lib/auth/actions'

export default function LoginPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    loginAction,
    undefined
  )

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 text-center">
          התחברות
        </h1>
        <p className="text-slate-500 text-center mb-8">
          ברוכים השבים למערכת המסמכים המשפטיים
        </p>

        <form action={action} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              כתובת אימייל
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              dir="ltr"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              סיסמה
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              dir="ltr"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            />
          </div>

          {state?.error && (
            <div
              role="alert"
              className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
            >
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
          >
            {pending ? 'מתחבר/ת...' : 'התחברות'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          אין לך חשבון?{' '}
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            הירשם/י כאן
          </Link>
        </p>
      </div>
    </main>
  )
}
