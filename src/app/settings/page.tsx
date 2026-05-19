'use client'

import { useEffect, useState } from 'react'
import {
  getLawyerProfile,
  upsertLawyerProfile,
} from '@/lib/db/lawyer-profile'
import { createClient } from '@/lib/db/supabase'
import { useUser } from '@/lib/hooks/useUser'
import { EMPTY_LAWYER_PROFILE, type Gender } from '@/lib/types'
import { TopNav } from '@/components/layout/TopNav'

type FormState = typeof EMPTY_LAWYER_PROFILE

export default function SettingsPage() {
  const { user, loading: userLoading } = useUser()
  const [supabase] = useState(() => createClient())
  const [form, setForm] = useState<FormState>(EMPTY_LAWYER_PROFILE)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  useEffect(() => {
    if (userLoading) return
    if (!user) {
      Promise.resolve().then(() => setIsLoading(false))
      return
    }

    let cancelled = false
    getLawyerProfile(supabase, user.id)
      .then((profile) => {
        if (cancelled) return
        if (profile) {
          setForm({
            fullName: profile.fullName,
            gender: profile.gender,
            idNumber: profile.idNumber,
            licenseNumber: profile.licenseNumber,
            barAssociation: profile.barAssociation,
            firmName: profile.firmName,
            address: profile.address,
            city: profile.city,
            phone: profile.phone,
            email: profile.email,
          })
        }
        setError(null)
        setIsLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('שגיאה בטעינת הפרופיל')
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, userLoading, supabase])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((s) => ({ ...s, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    if (!form.fullName.trim()) {
      setError('שם מלא הוא שדה חובה')
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      await upsertLawyerProfile(supabase, user.id, form)
      setSavedAt(new Date())
    } catch {
      setError('שגיאה בשמירה')
    } finally {
      setIsSaving(false)
    }
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    fontSize: 13,
    backgroundColor: '#fff',
    border: '0.5px solid var(--border-hover)',
    borderRadius: 4,
    color: 'var(--text-primary)',
  }

  return (
    <main
      style={{ minHeight: '100vh', backgroundColor: 'var(--bg-secondary)' }}
    >
      <TopNav />

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div style={{ marginBottom: 22 }}>
          <h1
            style={{
              margin: '0 0 4px',
              fontSize: 22,
              fontWeight: 500,
              color: 'var(--text-primary)',
            }}
          >
            הגדרות &mdash; פרופיל עו&quot;ד
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            הפרטים יישמרו פעם אחת בלבד וימולאו אוטומטית בכל מסמך שדורש אותך כעו&quot;ד.
          </p>
        </div>

        {isLoading ? (
          <div
            className="text-center py-12"
            style={{ color: 'var(--text-muted)', fontSize: 13 }}
          >
            טוען...
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{
              backgroundColor: '#fff',
              border: '1px solid var(--border-default)',
              borderRadius: 8,
              padding: 24,
            }}
          >
            <Field label="שם מלא *">
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                style={fieldStyle}
                required
              />
            </Field>

            <Field label="מגדר">
              <div className="flex gap-4" style={{ fontSize: 13 }}>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    checked={form.gender === 'female'}
                    onChange={() => update('gender', 'female' as Gender)}
                  />
                  נקבה
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    checked={form.gender === 'male'}
                    onChange={() => update('gender', 'male' as Gender)}
                  />
                  זכר
                </label>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="תעודת זהות">
                <input
                  type="text"
                  value={form.idNumber}
                  onChange={(e) => update('idNumber', e.target.value)}
                  style={fieldStyle}
                  dir="ltr"
                />
              </Field>
              <Field label="מספר רישיון">
                <input
                  type="text"
                  value={form.licenseNumber}
                  onChange={(e) => update('licenseNumber', e.target.value)}
                  style={fieldStyle}
                  dir="ltr"
                />
              </Field>
            </div>

            <Field label="לשכת עורכי הדין">
              <input
                type="text"
                value={form.barAssociation}
                onChange={(e) => update('barAssociation', e.target.value)}
                style={fieldStyle}
                placeholder="למשל: מחוז תל אביב"
              />
            </Field>

            <Field label="שם המשרד">
              <input
                type="text"
                value={form.firmName}
                onChange={(e) => update('firmName', e.target.value)}
                style={fieldStyle}
              />
            </Field>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Field label="כתובת">
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => update('address', e.target.value)}
                    style={fieldStyle}
                  />
                </Field>
              </div>
              <Field label="עיר">
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  style={fieldStyle}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="טלפון">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  style={fieldStyle}
                  dir="ltr"
                />
              </Field>
              <Field label="דוא״ל">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  style={fieldStyle}
                  dir="ltr"
                />
              </Field>
            </div>

            {error && (
              <div
                role="alert"
                style={{
                  marginTop: 12,
                  padding: '10px 12px',
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

            <div
              className="flex items-center justify-between"
              style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: '1px solid var(--border-default)',
              }}
            >
              {savedAt && (
                <span
                  style={{ fontSize: 12, color: 'var(--text-success)' }}
                >
                  ✓ נשמר ב-{savedAt.toLocaleTimeString('he-IL')}
                </span>
              )}
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  marginRight: 'auto',
                  padding: '9px 18px',
                  fontSize: 13,
                  fontWeight: 500,
                  backgroundColor: 'var(--color-primary)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.5 : 1,
                }}
              >
                {isSaving ? 'שומר...' : 'שמירה'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--text-secondary)',
          marginBottom: 4,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}
