'use client'

import { PersonPicker } from '@/components/person/PersonPicker'
import { InfoTip } from '@/components/editor/v2/InfoTip'
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
}: ActorPickerTabProps) {
  const pickerLabel = multiple ? `בחירת ${rolePlural} (אחד או יותר)` : `בחירת ${roleSingularMale}`

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
