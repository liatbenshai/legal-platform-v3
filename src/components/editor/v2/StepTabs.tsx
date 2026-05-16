'use client'

export type TabId =
  | 'principal'
  | 'attorneys'
  | 'powers'
  | 'details'
  | 'directives'
  | 'signature'

export interface TabDef {
  id: TabId
  label: string
}

export const TABS: TabDef[] = [
  { id: 'principal', label: 'פרטי הממנה' },
  { id: 'attorneys', label: 'מיופי הכוח' },
  { id: 'powers', label: 'סמכויות' },
  { id: 'details', label: 'פרטים' },
  { id: 'directives', label: 'הנחיות מקדימות' },
  { id: 'signature', label: 'חתימה ואישור' },
]

interface StepTabsProps {
  activeId: TabId
  onChange: (id: TabId) => void
}

export function StepTabs({ activeId, onChange }: StepTabsProps) {
  return (
    <div
      className="flex border-b"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        padding: '12px 32px',
        borderColor: 'var(--border-default)',
        gap: 28,
      }}
    >
      {TABS.map((tab, idx) => {
        const isActive = tab.id === activeId
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className="relative flex items-center"
            style={{
              fontSize: 13,
              paddingBottom: isActive ? 12 : 0,
              color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
              fontWeight: isActive ? 500 : 400,
            }}
          >
            <span
              className="inline-flex items-center justify-center rounded-full"
              style={{
                width: 18,
                height: 18,
                fontSize: 11,
                marginLeft: 6,
                backgroundColor: isActive ? 'var(--color-primary)' : '#E5E7EB',
                color: isActive ? '#fff' : '#6B7280',
              }}
            >
              {idx + 1}
            </span>
            {tab.label}
            {isActive && (
              <span
                className="absolute right-0 left-0"
                style={{
                  bottom: -13,
                  height: 2,
                  backgroundColor: 'var(--color-accent)',
                }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
