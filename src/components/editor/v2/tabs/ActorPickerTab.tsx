'use client'

import { useState } from 'react'
import { PersonPicker } from '@/components/person/PersonPicker'
import { InfoTip } from '@/components/editor/v2/InfoTip'
import { createPerson } from '@/lib/db/persons'
import { getLawyerProfile } from '@/lib/db/lawyer-profile'
import { createClient as createSupabaseClient } from '@/lib/db/supabase'
import { useUser } from '@/lib/hooks/useUser'
import type { Person } from '@/lib/types'

interface ActorPickerTabProps {
  clientId: string
  label: string
  multiple: boolean
  selectedIds: string[]
  selectedPersons: Person[]
  excludeIds: string[]
  onChange: (ids: string[]) => void
  onPersonCreated: (person: Person) => void
  roleSingularMale: string
  roleSingularFemale: string
  rolePlural: string
  /** Set to true on a עו"ד actor tab so the "השתמש בפרטי שלי" button appears. */
  isLawyerRole?: boolean
}

export function ActorPickerTab({
  clientId,
  label,
  multiple,
  selectedIds,
  selectedPersons,
  excludeIds,
  onChange,
  onPersonCreated,
  roleSingularMale,
  roleSingularFemale,
  rolePlural,
  isLawyerRole,
}: ActorPickerTabProps) {
  const { user } = useUser()
  const [isFilling, setIsFilling] = useState(false)
  const [fillError, setFillError] = useState<string | null>(null)
  const pickerLabel = multiple ? `בחירת ${rolePlural} (אחד או יותר)` : `בחירת ${roleSingularMale}`

  async function fillFromLawyerProfile() {
    if (!user) return
    setIsFilling(true)
    setFillError(null)
    try {
      const supabase = createSupabaseClient()
      const profile = await getLawyerProfile(supabase, user.id)
      if (!profile || !profile.fullName.trim()) {
        setFillError('עוד לא הזנת את פרטי הפרופיל. לחצי על "הגדרות" בלוח המחוונים.')
        setIsFilling(false)
        return
      }
      const [firstName, ...rest] = profile.fullName.trim().split(/\s+/)
      const lastName = rest.join(' ') || firstName
      const person = await createPerson(supabase, clientId, {
        firstName,
        lastName,
        idNumber: profile.idNumber,
        gender: profile.gender,
        address: profile.address,
        city: profile.city,
        phone: profile.phone || undefined,
        email: profile.email || undefined,
      })
      onPersonCreated(person)
      onChange([person.id])
    } catch {
      setFillError('שגיאה במילוי הפרטים')
    } finally {
      setIsFilling(false)
    }
  }

  const tip = (() => {
    if (selectedPersons.length === 0) return null
    if (!multiple) {
      const p = selectedPersons[0]
      const genderLabel = p.gender === 'female' ? 'נקבה' : 'זכר'
      return (
        <>
          המגדר של {p.firstName} הוא <strong>{genderLabel}</strong> — הניסוח של
          הסעיפים יותאם אוטומטית.
        </>
      )
    }
    const roleLabel =
      selectedPersons.length > 1
        ? rolePlural
        : selectedPersons[0].gender === 'female'
          ? roleSingularFemale
          : roleSingularMale
    return (
      <>
        תפקיד במסמך: <strong>{roleLabel}</strong>
        {selectedPersons.length > 1 && ` (${selectedPersons.length} אנשים)`} — ההטיה
        תופיע אוטומטית בכל הסעיפים.
      </>
    )
  })()

  return (
    <div>
      {isLawyerRole && selectedPersons.length === 0 && (
        <div style={{ marginBottom: 10 }}>
          <button
            type="button"
            onClick={fillFromLawyerProfile}
            disabled={isFilling}
            style={{
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 500,
              backgroundColor: 'var(--color-accent)',
              color: '#3D2817',
              border: 'none',
              borderRadius: 4,
              cursor: isFilling ? 'not-allowed' : 'pointer',
              opacity: isFilling ? 0.5 : 1,
            }}
          >
            {isFilling ? 'ממלא...' : '+ השתמש בפרטי שלי (מהפרופיל)'}
          </button>
          {fillError && (
            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                color: '#991B1B',
              }}
            >
              {fillError}
            </div>
          )}
        </div>
      )}
      <PersonPicker
        clientId={clientId}
        selectedIds={selectedIds}
        onChange={onChange}
        onPersonCreated={onPersonCreated}
        multiple={multiple}
        excludeIds={excludeIds}
        label={pickerLabel}
      />
      {tip && <InfoTip>{tip}</InfoTip>}
    </div>
  )
}
