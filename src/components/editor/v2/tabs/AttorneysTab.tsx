'use client'

import { PersonPicker } from '@/components/person/PersonPicker'
import { InfoTip } from '@/components/editor/v2/InfoTip'
import type { Person } from '@/lib/types'

interface AttorneysTabProps {
  clientId: string
  selectedIds: string[]
  onChange: (ids: string[]) => void
  onPersonCreated: (person: Person) => void
  principalIds: string[]
  attorneys: Person[]
}

function describeRole(attorneys: Person[]): string {
  if (attorneys.length === 0) return ''
  if (attorneys.length > 1) return 'מיופי הכוח'
  return attorneys[0].gender === 'female' ? 'מיופת הכוח' : 'מיופה הכוח'
}

export function AttorneysTab({
  clientId,
  selectedIds,
  onChange,
  onPersonCreated,
  principalIds,
  attorneys,
}: AttorneysTabProps) {
  const roleLabel = describeRole(attorneys)
  return (
    <div>
      <PersonPicker
        clientId={clientId}
        selectedIds={selectedIds}
        onChange={onChange}
        onPersonCreated={onPersonCreated}
        multiple={true}
        excludeIds={principalIds}
        label="בחירת מיופי כוח (אחד או יותר)"
      />
      {roleLabel && (
        <InfoTip>
          תפקיד במסמך: <strong>{roleLabel}</strong>
          {attorneys.length > 1 && ` (${attorneys.length} אנשים)`} — ההטיה
          תופיע אוטומטית בכל הסעיפים.
        </InfoTip>
      )}
    </div>
  )
}
