'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IsraeliDateField } from '@/components/common/IsraeliDateField'
import { TopNav } from '@/components/layout/TopNav'
import { createClient as createClientRecord } from '@/lib/db/clients'
import { createPerson } from '@/lib/db/persons'
import { createClient as createSupabaseClient } from '@/lib/db/supabase'
import {
  DOC_TYPE_CONFIGS,
  SUPPORTED_DOC_TYPES,
} from '@/lib/documents/type-config'
import { useUser } from '@/lib/hooks/useUser'
import type { DocumentType, Gender } from '@/lib/types'

interface PersonFields {
  firstName: string
  lastName: string
  idNumber: string
  gender: Gender
  birthDate: Date | undefined
  address: string
  city: string
  phone: string
  email: string
}

const EMPTY_PERSON: PersonFields = {
  firstName: '',
  lastName: '',
  idNumber: '',
  gender: 'female',
  birthDate: undefined,
  address: '',
  city: '',
  phone: '',
  email: '',
}

function buildDisplayName(
  primary: PersonFields,
  hasPartner: boolean,
  partner: PersonFields
): string {
  const primaryFull = `${primary.firstName} ${primary.lastName}`.trim()
  if (!hasPartner) return primaryFull
  const partnerFull = `${partner.firstName} ${partner.lastName}`.trim()
  if (!partnerFull) return primaryFull
  // אותו שם משפחה → "דוד ושרה כהן"; אחרת → "דוד כהן ושרה לוי"
  if (
    primary.lastName &&
    partner.lastName &&
    primary.lastName === partner.lastName
  ) {
    return `${primary.firstName} ו${partner.firstName} ${primary.lastName}`.trim()
  }
  return `${primaryFull} ו${partnerFull}`.trim()
}

export default function NewClientPage() {
  const router = useRouter()
  const { user } = useUser()
  const [supabase] = useState(() => createSupabaseClient())

  const [primary, setPrimary] = useState<PersonFields>(EMPTY_PERSON)
  const [hasPartner, setHasPartner] = useState(false)
  const [partner, setPartner] = useState<PersonFields>(EMPTY_PERSON)
  const [plannedDocTypes, setPlannedDocTypes] = useState<DocumentType[]>([])
  const [notes, setNotes] = useState('')
  const [displayNameOverride, setDisplayNameOverride] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const autoDisplayName = buildDisplayName(primary, hasPartner, partner)
  const effectiveDisplayName = displayNameOverride.trim() || autoDisplayName

  function updatePrimary<K extends keyof PersonFields>(
    key: K,
    value: PersonFields[K]
  ) {
    setPrimary((p) => ({ ...p, [key]: value }))
  }

  function updatePartner<K extends keyof PersonFields>(
    key: K,
    value: PersonFields[K]
  ) {
    setPartner((p) => ({ ...p, [key]: value }))
  }

  function toggleDocType(t: DocumentType) {
    setPlannedDocTypes((curr) =>
      curr.includes(t) ? curr.filter((x) => x !== t) : [...curr, t]
    )
  }

  function validate(): string | null {
    if (!primary.firstName.trim()) return 'יש להזין שם פרטי'
    if (!primary.lastName.trim()) return 'יש להזין שם משפחה'
    if (!primary.idNumber.trim()) return 'יש להזין תעודת זהות'
    if (hasPartner) {
      if (!partner.firstName.trim())
        return 'יש להזין שם פרטי לבן/בת הזוג'
      if (!partner.lastName.trim())
        return 'יש להזין שם משפחה לבן/בת הזוג'
      if (!partner.idNumber.trim())
        return 'יש להזין תעודת זהות לבן/בת הזוג'
    }
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) {
      setError('לא נמצא משתמש מחובר')
      return
    }
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setIsSaving(true)
    try {
      const client = await createClientRecord(supabase, user.id, {
        displayName: effectiveDisplayName,
        notes: notes.trim() || undefined,
        plannedDocTypes,
      })

      // יצירת האדם הראשי
      await createPerson(supabase, client.id, {
        role: 'primary',
        firstName: primary.firstName.trim(),
        lastName: primary.lastName.trim(),
        idNumber: primary.idNumber.trim(),
        gender: primary.gender,
        birthDate: primary.birthDate,
        address: primary.address.trim(),
        city: primary.city.trim(),
        phone: primary.phone.trim() || undefined,
        email: primary.email.trim() || undefined,
      })

      // יצירת בן/בת זוג (אם קיים)
      if (hasPartner) {
        await createPerson(supabase, client.id, {
          role: 'partner',
          firstName: partner.firstName.trim(),
          lastName: partner.lastName.trim(),
          idNumber: partner.idNumber.trim(),
          gender: partner.gender,
          birthDate: partner.birthDate,
          address: partner.address.trim() || primary.address.trim(),
          city: partner.city.trim() || primary.city.trim(),
          phone: partner.phone.trim() || undefined,
          email: partner.email.trim() || undefined,
        })
      }

      router.push(`/clients/${client.id}`)
    } catch (err) {
      console.error(err)
      setError('שגיאה בשמירה. נסי שוב.')
      setIsSaving(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      <TopNav />

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div style={{ marginBottom: 22 }}>
          <Link
            href="/clients"
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
            }}
          >
            ‹ חזרה לתיקי לקוחות
          </Link>
          <h1
            style={{
              margin: '8px 0 4px',
              fontSize: 22,
              fontWeight: 500,
              color: 'var(--text-primary)',
            }}
          >
            תיק לקוח חדש
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            פרטים אישיים בלבד. שחקנים של מסמכים (יורשים, מיופי כוח, עדים)
            ימולאו בתוך המסמך עצמו.
          </p>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 18,
              padding: '10px 14px',
              backgroundColor: '#FEE2E2',
              border: '0.5px solid #FCA5A5',
              borderRadius: 6,
              color: '#991B1B',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ===== פרטי הלקוח ===== */}
          <Section title="פרטי הלקוח">
            <PersonFieldsBlock
              data={primary}
              onChange={updatePrimary}
              required
            />
          </Section>

          {/* ===== בן/בת זוג ===== */}
          <Section
            title="בן/בת זוג"
            subtitle="אם הלקוח נשוי/יה ובן/בת הזוג צריכ/ה גם הוא/היא להופיע במסמכים"
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                fontSize: 13,
                marginBottom: hasPartner ? 16 : 0,
              }}
            >
              <input
                type="checkbox"
                checked={hasPartner}
                onChange={(e) => setHasPartner(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <span>יש בן/בת זוג בתיק</span>
            </label>
            {hasPartner && (
              <PersonFieldsBlock
                data={partner}
                onChange={updatePartner}
                required
              />
            )}
          </Section>

          {/* ===== סוגי מסמכים מתוכננים ===== */}
          <Section
            title="סוגי מסמכים מתוכננים"
            subtitle="לתזכורת ויזואלית בלבד — מה הלקוח רוצה להכין"
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 8,
              }}
            >
              {SUPPORTED_DOC_TYPES.map((t) => {
                const checked = plannedDocTypes.includes(t)
                return (
                  <label
                    key={t}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 12px',
                      backgroundColor: checked
                        ? 'var(--color-accent-bg)'
                        : '#fff',
                      border: checked
                        ? '0.5px solid var(--color-accent)'
                        : '0.5px solid var(--border-default)',
                      borderRadius: 6,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDocType(t)}
                      style={{ width: 15, height: 15, cursor: 'pointer' }}
                    />
                    <span>{DOC_TYPE_CONFIGS[t].label}</span>
                  </label>
                )
              })}
            </div>
          </Section>

          {/* ===== שם תיק ===== */}
          <Section
            title="שם התיק"
            subtitle={`מחושב אוטומטית מהשמות. ניתן לערוך ידנית.`}
          >
            <input
              type="text"
              value={displayNameOverride}
              onChange={(e) => setDisplayNameOverride(e.target.value)}
              placeholder={autoDisplayName || 'יוצב אוטומטית מהשמות'}
              style={inputStyle}
            />
            {effectiveDisplayName && !displayNameOverride && (
              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                }}
              >
                ייקרא: <strong>{effectiveDisplayName}</strong>
              </p>
            )}
          </Section>

          {/* ===== הערות ===== */}
          <Section title="הערות">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="הערות פנימיות (לא יופיעו במסמכים)"
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: 80,
                fontFamily: 'inherit',
              }}
            />
          </Section>

          {/* ===== כפתורים ===== */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
              marginTop: 24,
              paddingTop: 18,
              borderTop: '0.5px solid var(--border-default)',
            }}
          >
            <Link
              href="/clients"
              style={{
                padding: '9px 16px',
                fontSize: 13,
                color: 'var(--text-primary)',
                backgroundColor: '#fff',
                border: '0.5px solid var(--border-hover)',
                borderRadius: 6,
                textDecoration: 'none',
              }}
            >
              ביטול
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              style={{
                padding: '9px 22px',
                fontSize: 13,
                fontWeight: 500,
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.6 : 1,
                fontFamily: 'inherit',
              }}
            >
              {isSaving ? 'שומר...' : 'יצירת תיק'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

// ============================================================
// בלוקים פנימיים
// ============================================================

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  fontSize: 13,
  border: '0.5px solid var(--border-hover)',
  borderRadius: 4,
  backgroundColor: '#fff',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--text-secondary)',
  marginBottom: 5,
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        backgroundColor: '#fff',
        border: '0.5px solid var(--border-default)',
        borderRadius: 8,
        padding: 18,
        marginBottom: 14,
      }}
    >
      <div style={{ marginBottom: 14 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 500,
            color: 'var(--text-primary)',
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}

function PersonFieldsBlock({
  data,
  onChange,
  required,
}: {
  data: PersonFields
  onChange: <K extends keyof PersonFields>(
    key: K,
    value: PersonFields[K]
  ) => void
  required: boolean
}) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* שם פרטי + שם משפחה */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        <div>
          <label style={labelStyle}>
            שם פרטי {required && <span style={{ color: '#DC2626' }}>*</span>}
          </label>
          <input
            type="text"
            value={data.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>
            שם משפחה {required && <span style={{ color: '#DC2626' }}>*</span>}
          </label>
          <input
            type="text"
            value={data.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* ת"ז + מגדר + תאריך לידה */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
        }}
      >
        <div>
          <label style={labelStyle}>
            תעודת זהות{' '}
            {required && <span style={{ color: '#DC2626' }}>*</span>}
          </label>
          <input
            type="text"
            value={data.idNumber}
            onChange={(e) => onChange('idNumber', e.target.value)}
            inputMode="numeric"
            dir="ltr"
            style={{ ...inputStyle, textAlign: 'right' }}
          />
        </div>
        <div>
          <label style={labelStyle}>מגדר</label>
          <select
            value={data.gender}
            onChange={(e) =>
              onChange('gender', e.target.value as Gender)
            }
            style={inputStyle}
          >
            <option value="female">נקבה</option>
            <option value="male">זכר</option>
          </select>
        </div>
        <div>
          <IsraeliDateField
            label="תאריך לידה"
            value={data.birthDate}
            onChange={(d) => onChange('birthDate', d)}
            variant="regular"
          />
        </div>
      </div>

      {/* כתובת + עיר */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 12,
        }}
      >
        <div>
          <label style={labelStyle}>כתובת</label>
          <input
            type="text"
            value={data.address}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder="רחוב, מספר בית, דירה"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>עיר</label>
          <input
            type="text"
            value={data.city}
            onChange={(e) => onChange('city', e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      {/* טלפון + מייל */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}
      >
        <div>
          <label style={labelStyle}>טלפון</label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            inputMode="tel"
            dir="ltr"
            style={{ ...inputStyle, textAlign: 'right' }}
          />
        </div>
        <div>
          <label style={labelStyle}>דואר אלקטרוני</label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onChange('email', e.target.value)}
            inputMode="email"
            dir="ltr"
            style={{ ...inputStyle, textAlign: 'right' }}
          />
        </div>
      </div>
    </div>
  )
}
