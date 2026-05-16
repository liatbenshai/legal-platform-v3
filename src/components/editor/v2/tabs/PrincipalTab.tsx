'use client'

import { PersonPicker } from '@/components/person/PersonPicker'
import { InfoTip } from '@/components/editor/v2/InfoTip'
import type { Person } from '@/lib/types'

interface PrincipalTabProps {
  clientId: string
  selectedIds: string[]
  onChange: (ids: string[]) => void
  onPersonCreated: (person: Person) => void
  attorneyIds: string[]
  principal: Person | null
}

export function PrincipalTab({
  clientId,
  selectedIds,
  onChange,
  onPersonCreated,
  attorneyIds,
  principal,
}: PrincipalTabProps) {
  return (
    <div>
      <PersonPicker
        clientId={clientId}
        selectedIds={selectedIds}
        onChange={onChange}
        onPersonCreated={onPersonCreated}
        multiple={false}
        excludeIds={attorneyIds}
        label="בחירת הממנה"
      />
      {principal && (
        <InfoTip>
          המגדר של {principal.firstName} הוא{' '}
          <strong>
            {principal.gender === 'female' ? 'נקבה' : 'זכר'}
          </strong>{' '}
          — הניסוח של הסעיפים יותאם אוטומטית.
        </InfoTip>
      )}
    </div>
  )
}
