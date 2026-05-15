'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { registerAction, type AuthState } from '@/lib/auth/actions'

export default function RegisterPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    registerAction,
    undefined
  )

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2 text-center">
          הרשמה
        </h1>
        <p className="text-slate-500 text-center mb-8">
          יצירת חשבון חדש במערכת המסמכים המשפטיים
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
              minLength={6}
              autoComplete="new-password"
              dir="ltr"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            />
            <p className="text-xs text-slate-500 mt-1">לפחות 6 תווים</p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              אימות סיסמה
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
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
            {pending ? 'נרשם/ת...' : 'הרשמה'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          כבר יש לך חשבון?{' '}
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            התחבר/י כאן
          </Link>
        </p>
      </div>
    </main>
  )
}
