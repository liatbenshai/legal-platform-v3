'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/db/supabase-server'

export type AuthState = { error?: string } | undefined

function translateAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'אימייל או סיסמה שגויים'
  if (m.includes('email not confirmed')) return 'יש לאמת את כתובת האימייל לפני התחברות'
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return 'משתמש עם אימייל זה כבר קיים במערכת'
  }
  if (m.includes('password should be at least')) return 'הסיסמה חייבת להיות באורך 6 תווים לפחות'
  if (m.includes('weak password') || m.includes('weak_password')) return 'הסיסמה חלשה מדי. בחר/י סיסמה חזקה יותר'
  if (m.includes('unable to validate email') || m.includes('invalid email')) return 'כתובת אימייל לא תקינה'
  if (m.includes('rate limit')) return 'יותר מדי ניסיונות. נסה/י שוב בעוד כמה דקות'
  return 'שגיאה לא צפויה. נסה/י שנית.'
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function loginAction(
  _state: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email) return { error: 'יש להזין כתובת אימייל' }
  if (!isValidEmail(email)) return { error: 'כתובת אימייל לא תקינה' }
  if (!password) return { error: 'יש להזין סיסמה' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: translateAuthError(error.message) }
  }

  redirect('/dashboard')
}

export async function registerAction(
  _state: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const confirmPassword = String(formData.get('confirmPassword') ?? '')

  if (!email) return { error: 'יש להזין כתובת אימייל' }
  if (!isValidEmail(email)) return { error: 'כתובת אימייל לא תקינה' }
  if (!password) return { error: 'יש להזין סיסמה' }
  if (password.length < 6) return { error: 'הסיסמה חייבת להיות באורך 6 תווים לפחות' }
  if (password !== confirmPassword) return { error: 'הסיסמאות אינן תואמות' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return { error: translateAuthError(error.message) }
  }

  redirect('/dashboard')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
