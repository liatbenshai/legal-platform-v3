'use client'

import { useState } from 'react'
import { InfoTip } from '@/components/editor/v2/InfoTip'
import { getLawyerProfile } from '@/lib/db/lawyer-profile'
import { createClient as createSupabaseClient } from '@/lib/db/supabase'
import { useUser } from '@/lib/hooks/useUser'
import type { EmbeddedPerson, Gender, Person } from '@/lib/types'

interface ActorInlineTabProps {
  /** השחקנים הנוכחיים של הטאב */
  persons: EmbeddedPerson[]
  /** false → שחקן יחיד; true → שחקנים מרובים עם כפתור הוסף */
  multiple: boolean
  /** עדכון הרשימה */
  onChange: (next: EmbeddedPerson[]) => void
  /** הסכמה ויזואלית לתפקיד */
  roleSingularMale: string
  roleSingularFemale: string
  rolePlural: string
  /** האדם הראשי של הלקוח — אם קיים, יוצע "מילוי אוטומטי מפרטי הלקוח" */
  clientPrimary?: Person | null
  /** בן/בת זוג של הלקוח — אם קיים, יוצע "מילוי אוטומטי מבן/בת הזוג" */
  clientPartner?: Person | null
  /** האם זה תפקיד של עורך/ת דין → יוצע "מילוי מההגדרות" */
  isLawyerRole?: boolean
}

const EMPTY_PERSON: EmbeddedPerson = {
  firstName: '',
  lastName: '',
  idNumber: '',
  gender: 'female',
  address: '',
  city: '',
}

function personToEmbedded(p: Person): EmbeddedPerson {
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    idNumber: p.idNumber,
    gender: p.gender,
    birthDate: p.birthDate,
    address: p.address,
    city: p.city,
    phone: p.phone,
    email: p.email,
  }
}

export function ActorInlineTab({
  persons,
  multiple,
  onChange,
  roleSingularMale,
  roleSingularFemale,
  rolePlural,
  clientPrimary,
  clientPartner,
  isLawyerRole,
}: ActorInlineTabProps) {
  const { user } = useUser()

  // מצב נעילה — לכל אינדקס, האם השחקן ננעל בעקבות מילוי אוטומטי
  const [lockedIndices, setLockedIndices] = useState<Set<number>>(new Set())
  // איזה כרטיס מורחב כרגע (במצב multiple)
  const [expandedIndex, setExpandedIndex] = useState<number>(0)
  // שגיאת מילוי מההגדרות
  const [lawyerFillError, setLawyerFillError] = useState<string | null>(null)
  const [isFillingFromLawyer, setIsFillingFromLawyer] = useState(false)

  // אם אין שחקנים בכלל ולא מרובה — נציג שדה ריק אחד (לעריכה)
  const visiblePersons = persons.length === 0 && !multiple ? [EMPTY_PERSON] : persons

  // clamp בזמן רינדור (במקום useEffect): אם הרחבנו ל-index שאינו תקין יותר, נצמצם
  const safeExpanded = Math.min(
    expandedIndex,
    Math.max(0, visiblePersons.length - 1)
  )

  function updatePerson(index: number, next: EmbeddedPerson) {
    const updated = [...persons]
    if (index >= updated.length) {
      // אם זה ה-EMPTY_PERSON הוויזואלי שעוד לא קיים — הוסף
      updated.push(next)
    } else {
      updated[index] = next
    }
    onChange(updated)
  }

  function fieldChange<K extends keyof EmbeddedPerson>(
    index: number,
    field: K,
    value: EmbeddedPerson[K]
  ) {
    const base = persons[index] ?? EMPTY_PERSON
    updatePerson(index, { ...base, [field]: value })
  }

  function addPerson() {
    const next = [...persons, { ...EMPTY_PERSON }]
    onChange(next)
    setExpandedIndex(next.length - 1)
  }

  function removePerson(index: number) {
    const next = persons.filter((_, i) => i !== index)
    onChange(next)
    const newLocked = new Set<number>()
    lockedIndices.forEach((i) => {
      if (i < index) newLocked.add(i)
      else if (i > index) newLocked.add(i - 1)
    })
    setLockedIndices(newLocked)
  }

  function fillFromSource(source: Person, atIndex = 0) {
    const embedded = personToEmbedded(source)
    const next = [...persons]
    if (atIndex >= next.length) next.push(embedded)
    else next[atIndex] = embedded
    onChange(next)
    setLockedIndices(new Set(lockedIndices).add(atIndex))
  }

  function unlockPerson(index: number) {
    const next = new Set(lockedIndices)
    next.delete(index)
    setLockedIndices(next)
  }

  async function fillFromLawyerProfile() {
    if (!user) return
    setIsFillingFromLawyer(true)
    setLawyerFillError(null)
    try {
      const supabase = createSupabaseClient()
      const profile = await getLawyerProfile(supabase, user.id)
      if (!profile || !profile.fullName.trim()) {
        setLawyerFillError(
          'עוד לא הזנת את פרטי הפרופיל. לחצי על "הגדרות" בלוח הבקרה.'
        )
        return
      }
      const [firstName, ...rest] = profile.fullName.trim().split(/\s+/)
      const lastName = rest.join(' ') || firstName
      const embedded: EmbeddedPerson = {
        firstName,
        lastName,
        idNumber: profile.idNumber,
        gender: profile.gender,
        address: profile.address,
        city: profile.city,
        phone: profile.phone || undefined,
        email: profile.email || undefined,
      }
      const next = [...persons]
      if (next.length === 0) next.push(embedded)
      else next[0] = embedded
      onChange(next)
      setLockedIndices(new Set([0]))
    } catch {
      setLawyerFillError('שגיאה במילוי הפרטים')
    } finally {
      setIsFillingFromLawyer(false)
    }
  }

  const tip = (() => {
    if (visiblePersons.length === 0) return null
    if (!multiple) {
      const p = visiblePersons[0]
      if (!p.firstName.trim()) return null
      const genderLabel = p.gender === 'female' ? 'נקבה' : 'זכר'
      return (
        <>
          המגדר של {p.firstName || 'האדם'}{' '}
          הוא <strong>{genderLabel}</strong> — הניסוח של הסעיפים יותאם
          אוטומטית.
        </>
      )
    }
    const allFemale =
      visiblePersons.length > 0 &&
      visiblePersons.every((p) => p.gender === 'female')
    const roleLabel =
      visiblePersons.length > 1
        ? rolePlural
        : allFemale
          ? roleSingularFemale
          : roleSingularMale
    return (
      <>
        תפקיד במסמך: <strong>{roleLabel}</strong>
        {visiblePersons.length > 1 && ` (${visiblePersons.length} אנשים)`} —
        ההטיה תופיע אוטומטית בכל הסעיפים.
      </>
    )
  })()

  return (
    <div>
      {/* === כפתורי מילוי אוטומטי === */}
      {!multiple && visiblePersons.length <= 1 && (
        <div style={{ marginBottom: 14 }}>
          {/* מילוי מפרטי הלקוח */}
          {clientPrimary && (
            <AutoFillCard
              label="מפרטי הלקוח"
              personName={`${clientPrimary.firstName} ${clientPrimary.lastName}`}
              onClick={() => fillFromSource(clientPrimary, 0)}
            />
          )}
          {/* מילוי מפרטי בן/בת הזוג */}
          {clientPartner && (
            <AutoFillCard
              label="מפרטי בן/בת הזוג"
              personName={`${clientPartner.firstName} ${clientPartner.lastName}`}
              onClick={() => fillFromSource(clientPartner, 0)}
            />
          )}
          {/* מילוי מההגדרות (עורך/ת דין) */}
          {isLawyerRole && (
            <div style={{ marginBottom: 8 }}>
              <button
                type="button"
                onClick={fillFromLawyerProfile}
                disabled={isFillingFromLawyer}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                  backgroundColor: 'var(--color-accent-bg)',
                  color: 'var(--status-review-fg)',
                  border: '0.5px solid var(--color-accent)',
                  borderRadius: 6,
                  cursor: isFillingFromLawyer ? 'not-allowed' : 'pointer',
                  opacity: isFillingFromLawyer ? 0.6 : 1,
                  textAlign: 'right',
                  fontFamily: 'inherit',
                }}
              >
                <i
                  className="ti ti-copy"
                  style={{ marginLeft: 4, fontSize: 12 }}
                  aria-hidden="true"
                />
                {isFillingFromLawyer
                  ? 'ממלא...'
                  : 'מילוי מפרטי הפרופיל שלי'}
              </button>
              {lawyerFillError && (
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 11,
                    color: '#991B1B',
                  }}
                >
                  {lawyerFillError}
                </p>
              )}
            </div>
          )}
          {(clientPrimary || clientPartner || isLawyerRole) && (
            <p
              style={{
                margin: '6px 0 0',
                fontSize: 10,
                color: 'var(--text-muted)',
                fontStyle: 'italic',
                lineHeight: 1.5,
              }}
            >
              הנתונים יועתקו ויישמרו במסמך עצמו. עריכה במסמך לא תשפיע על
              פרטי הלקוח.
            </p>
          )}
        </div>
      )}

      {/* === שדות עריכה === */}
      {visiblePersons.length === 0 && multiple ? (
        <div
          style={{
            padding: 18,
            textAlign: 'center',
            backgroundColor: '#fff',
            border: '0.5px dashed var(--border-hover)',
            borderRadius: 6,
            color: 'var(--text-muted)',
            fontSize: 12,
            marginBottom: 10,
          }}
        >
          טרם נוספו {rolePlural}
        </div>
      ) : (
        visiblePersons.map((person, index) => {
          const isLocked = lockedIndices.has(index)
          const isExpanded = !multiple || safeExpanded === index
          const cardLabel = multiple
            ? `${roleSingularMale} #${index + 1}`
            : roleSingularMale
          return (
            <PersonCard
              key={index}
              index={index}
              label={cardLabel}
              person={person}
              isExpanded={isExpanded}
              isLocked={isLocked}
              canRemove={multiple}
              onExpand={() => setExpandedIndex(index)}
              onChange={(field, value) => fieldChange(index, field, value)}
              onRemove={() => removePerson(index)}
              onUnlock={() => unlockPerson(index)}
            />
          )
        })
      )}

      {/* === כפתור הוסף === */}
      {multiple && (
        <button
          type="button"
          onClick={addPerson}
          style={{
            width: '100%',
            padding: 10,
            fontSize: 12,
            color: 'var(--text-primary)',
            background: '#fff',
            border: '0.5px dashed var(--border-hover)',
            borderRadius: 6,
            cursor: 'pointer',
            fontFamily: 'inherit',
            marginTop: 8,
          }}
        >
          <i
            className="ti ti-plus"
            style={{ fontSize: 12, marginLeft: 4, verticalAlign: -1 }}
            aria-hidden="true"
          />
          הוסף {roleSingularMale}
        </button>
      )}

      {tip && (
        <div style={{ marginTop: 12 }}>
          <InfoTip>{tip}</InfoTip>
        </div>
      )}
    </div>
  )
}

// ============================================================
// כרטיס מילוי אוטומטי
// ============================================================
function AutoFillCard({
  label,
  personName,
  onClick,
}: {
  label: string
  personName: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 12px',
        backgroundColor: '#fff',
        color: 'var(--text-primary)',
        border: '0.5px solid var(--color-accent)',
        borderRadius: 6,
        cursor: 'pointer',
        marginBottom: 6,
        fontFamily: 'inherit',
        textAlign: 'right',
      }}
    >
      <i
        className="ti ti-copy"
        style={{ fontSize: 13, color: 'var(--color-accent)' }}
        aria-hidden="true"
      />
      <div style={{ flex: 1 }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--text-primary)',
          }}
        >
          {label}
        </p>
        <p
          style={{
            margin: '1px 0 0',
            fontSize: 11,
            color: 'var(--text-muted)',
          }}
        >
          {personName}
        </p>
      </div>
    </button>
  )
}

// ============================================================
// כרטיס עריכת שחקן
// ============================================================
interface PersonCardProps {
  index: number
  label: string
  person: EmbeddedPerson
  isExpanded: boolean
  isLocked: boolean
  canRemove: boolean
  onExpand: () => void
  onChange: <K extends keyof EmbeddedPerson>(
    field: K,
    value: EmbeddedPerson[K]
  ) => void
  onRemove: () => void
  onUnlock: () => void
}

function PersonCard({
  label,
  person,
  isExpanded,
  isLocked,
  canRemove,
  onExpand,
  onChange,
  onRemove,
  onUnlock,
}: PersonCardProps) {
  const summaryText = (() => {
    const parts = []
    const full = `${person.firstName} ${person.lastName}`.trim()
    if (full) parts.push(full)
    if (person.idNumber) parts.push(`ת"ז ${person.idNumber}`)
    return parts.length > 0 ? parts.join(' · ') : 'טרם מולא'
  })()

  if (!isExpanded) {
    return (
      <div
        style={{
          background: '#fff',
          border: '0.5px solid var(--border-default)',
          borderRadius: 6,
          padding: '8px 10px',
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--text-primary)',
            }}
          >
            {label}
          </p>
          <p
            style={{
              margin: '1px 0 0',
              fontSize: 10,
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {summaryText}
          </p>
        </div>
        <button
          type="button"
          onClick={onExpand}
          aria-label="ערוך"
          title="ערוך"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <i
            className="ti ti-pencil"
            style={{ fontSize: 13 }}
            aria-hidden="true"
          />
        </button>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="הסר"
            title="הסר"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <i
              className="ti ti-x"
              style={{ fontSize: 13 }}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    )
  }

  const lockedBg = isLocked ? 'var(--color-accent-bg)' : '#fff'
  const lockedBorder = isLocked
    ? '0.5px solid var(--color-accent)'
    : '0.5px solid var(--border-default)'

  return (
    <div
      style={{
        background: lockedBg,
        border: lockedBorder,
        borderRadius: 6,
        padding: 10,
        marginBottom: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 500,
            color: isLocked
              ? 'var(--status-review-fg)'
              : 'var(--text-primary)',
          }}
        >
          {label}
          {isLocked && (
            <span
              style={{
                marginRight: 6,
                fontSize: 10,
                color: 'var(--status-review-fg)',
                fontWeight: 400,
              }}
            >
              <i
                className="ti ti-lock"
                style={{ fontSize: 11, verticalAlign: -1 }}
                aria-hidden="true"
              />
              {' '}ננעל אחרי מילוי אוטומטי
            </span>
          )}
        </p>
        <div style={{ display: 'flex', gap: 4 }}>
          {isLocked && (
            <button
              type="button"
              onClick={onUnlock}
              style={{
                background: 'transparent',
                color: 'var(--status-review-fg)',
                border: '0.5px solid var(--color-accent)',
                padding: '3px 8px',
                borderRadius: 3,
                fontSize: 10,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <i
                className="ti ti-pencil"
                style={{ fontSize: 10, marginLeft: 2, verticalAlign: -1 }}
                aria-hidden="true"
              />
              ערוך בכל זאת
            </button>
          )}
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label="הסר"
              title="הסר"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 11,
                padding: 2,
                fontFamily: 'inherit',
              }}
            >
              <i
                className="ti ti-x"
                style={{ fontSize: 12 }}
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 6 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
          }}
        >
          <FieldInput
            label="שם פרטי"
            value={person.firstName}
            disabled={isLocked}
            onChange={(v) => onChange('firstName', v)}
          />
          <FieldInput
            label="שם משפחה"
            value={person.lastName}
            disabled={isLocked}
            onChange={(v) => onChange('lastName', v)}
          />
        </div>
        <FieldInput
          label="תעודת זהות"
          value={person.idNumber}
          disabled={isLocked}
          dir="ltr"
          inputMode="numeric"
          onChange={(v) => onChange('idNumber', v)}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
          }}
        >
          <FieldSelect
            label="מגדר"
            value={person.gender}
            disabled={isLocked}
            options={[
              { value: 'female', label: 'נקבה' },
              { value: 'male', label: 'זכר' },
            ]}
            onChange={(v) => onChange('gender', v as Gender)}
          />
          <FieldInput
            label="תאריך לידה"
            type="date"
            value={
              person.birthDate ? toDateInput(person.birthDate) : ''
            }
            disabled={isLocked}
            onChange={(v) =>
              onChange('birthDate', v ? new Date(v) : undefined)
            }
          />
        </div>
        <FieldInput
          label="כתובת"
          value={person.address}
          disabled={isLocked}
          onChange={(v) => onChange('address', v)}
        />
        <FieldInput
          label="עיר"
          value={person.city}
          disabled={isLocked}
          onChange={(v) => onChange('city', v)}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
          }}
        >
          <FieldInput
            label="טלפון"
            type="tel"
            value={person.phone ?? ''}
            disabled={isLocked}
            dir="ltr"
            onChange={(v) => onChange('phone', v || undefined)}
          />
          <FieldInput
            label="דואר אלקטרוני"
            type="email"
            value={person.email ?? ''}
            disabled={isLocked}
            dir="ltr"
            onChange={(v) => onChange('email', v || undefined)}
          />
        </div>
      </div>
    </div>
  )
}

function toDateInput(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ============================================================
// שדה קלט קטן
// ============================================================
function FieldInput({
  label,
  value,
  onChange,
  disabled,
  type = 'text',
  dir = 'rtl',
  inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  type?: 'text' | 'email' | 'tel' | 'date'
  dir?: 'rtl' | 'ltr'
  inputMode?: 'numeric' | 'tel' | 'email'
}) {
  return (
    <div>
      <p
        style={{
          margin: 0,
          fontSize: 9,
          color: 'var(--text-muted)',
        }}
      >
        {label}
      </p>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        dir={dir}
        inputMode={inputMode}
        style={{
          width: '100%',
          padding: '4px 6px',
          fontSize: 11,
          border: '0.5px solid var(--border-hover)',
          borderRadius: 3,
          background: disabled ? 'var(--bg-tertiary)' : '#fff',
          color: 'var(--text-primary)',
          fontFamily: 'inherit',
          textAlign: dir === 'ltr' ? 'right' : 'right',
          boxSizing: 'border-box',
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
    </div>
  )
}

function FieldSelect<T extends string>({
  label,
  value,
  onChange,
  disabled,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  disabled?: boolean
  options: Array<{ value: T; label: string }>
}) {
  return (
    <div>
      <p
        style={{
          margin: 0,
          fontSize: 9,
          color: 'var(--text-muted)',
        }}
      >
        {label}
      </p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '4px 6px',
          fontSize: 11,
          border: '0.5px solid var(--border-hover)',
          borderRadius: 3,
          background: disabled ? 'var(--bg-tertiary)' : '#fff',
          color: 'var(--text-primary)',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
