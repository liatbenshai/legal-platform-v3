'use client'

import { useState } from 'react'
import { InfoTip } from '@/components/editor/v2/InfoTip'
import type {
  BankAccount,
  Doctor,
  DocumentDetails,
  FinancialAsset,
  FinancialAssetType,
  Property,
  PropertyStatus,
} from '@/lib/types'

interface DetailsTabProps {
  details: DocumentDetails
  onChange: (next: DocumentDetails) => void
}

type GroupId = 'assets' | 'financial' | 'medical' | 'preferences'

const GROUPS: Array<{ id: GroupId; label: string; icon: string }> = [
  { id: 'assets', label: 'נכסים', icon: 'ti-building-bank' },
  { id: 'financial', label: 'רכוש פיננסי', icon: 'ti-coin' },
  { id: 'medical', label: 'רפואה', icon: 'ti-stethoscope' },
  { id: 'preferences', label: 'העדפות אישיות', icon: 'ti-heart' },
]

const PROPERTY_STATUSES: PropertyStatus[] = ['מגורים', 'השקעה', 'השכרה']

const FINANCIAL_LABELS: Record<FinancialAssetType, string> = {
  pension: 'קרן פנסיה',
  gemel: 'קופת גמל',
  hishtalmut: 'קרן השתלמות',
  insurance: 'ביטוח',
}

const FINANCIAL_TYPES: FinancialAssetType[] = [
  'pension',
  'gemel',
  'hishtalmut',
  'insurance',
]

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const fieldStyle: React.CSSProperties = {
  padding: '7px 10px',
  fontSize: 12,
  border: '0.5px solid var(--border-hover)',
  borderRadius: 4,
  backgroundColor: '#fff',
  color: 'var(--text-primary)',
  width: '100%',
}

const removeBtn: React.CSSProperties = {
  width: 22,
  height: 22,
  border: '0.5px solid #FCA5A5',
  borderRadius: 3,
  color: '#DC2626',
  backgroundColor: '#fff',
  fontSize: 13,
  lineHeight: 1,
  flexShrink: 0,
  cursor: 'pointer',
}

const addBtn: React.CSSProperties = {
  marginTop: 10,
  padding: '7px 14px',
  fontSize: 12,
  fontWeight: 500,
  backgroundColor: 'var(--color-primary)',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
}

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  alignItems: 'center',
  padding: '10px 10px',
  border: '0.5px solid var(--border-default)',
  borderRadius: 4,
  backgroundColor: '#fff',
  marginBottom: 6,
}

export function DetailsTab({ details, onChange }: DetailsTabProps) {
  const [open, setOpen] = useState<Record<GroupId, boolean>>({
    assets: true,
    financial: false,
    medical: false,
    preferences: false,
  })

  function toggle(id: GroupId) {
    setOpen((s) => ({ ...s, [id]: !s[id] }))
  }

  function addBank() {
    onChange({
      ...details,
      bankAccounts: [
        ...details.bankAccounts,
        { id: uid(), bank: '', branch: '', accountNumber: '' },
      ],
    })
  }

  function updateBank(id: string, patch: Partial<BankAccount>) {
    onChange({
      ...details,
      bankAccounts: details.bankAccounts.map((b) =>
        b.id === id ? { ...b, ...patch } : b
      ),
    })
  }

  function removeBank(id: string) {
    onChange({
      ...details,
      bankAccounts: details.bankAccounts.filter((b) => b.id !== id),
    })
  }

  function addProperty(status: PropertyStatus) {
    onChange({
      ...details,
      properties: [
        ...details.properties,
        { id: uid(), address: '', gushHelka: '', status },
      ],
    })
  }

  function updateProperty(id: string, patch: Partial<Property>) {
    onChange({
      ...details,
      properties: details.properties.map((p) =>
        p.id === id ? { ...p, ...patch } : p
      ),
    })
  }

  function removeProperty(id: string) {
    onChange({
      ...details,
      properties: details.properties.filter((p) => p.id !== id),
    })
  }

  function addFinancial() {
    onChange({
      ...details,
      financialAssets: [
        ...details.financialAssets,
        { id: uid(), type: 'pension', company: '', policyNumber: '' },
      ],
    })
  }

  function updateFinancial(id: string, patch: Partial<FinancialAsset>) {
    onChange({
      ...details,
      financialAssets: details.financialAssets.map((f) =>
        f.id === id ? { ...f, ...patch } : f
      ),
    })
  }

  function removeFinancial(id: string) {
    onChange({
      ...details,
      financialAssets: details.financialAssets.filter((f) => f.id !== id),
    })
  }

  function addDoctor() {
    onChange({
      ...details,
      doctors: [
        ...details.doctors,
        { id: uid(), name: '', specialty: '', clinic: '' },
      ],
    })
  }

  function updateDoctor(id: string, patch: Partial<Doctor>) {
    onChange({
      ...details,
      doctors: details.doctors.map((d) =>
        d.id === id ? { ...d, ...patch } : d
      ),
    })
  }

  function removeDoctor(id: string) {
    onChange({
      ...details,
      doctors: details.doctors.filter((d) => d.id !== id),
    })
  }

  return (
    <div>
      {GROUPS.map((g) => {
        const isOpen = open[g.id]
        return (
          <div
            key={g.id}
            style={{
              marginBottom: 10,
              border: '0.5px solid var(--border-default)',
              borderRadius: 4,
              backgroundColor: '#fff',
              overflow: 'hidden',
            }}
          >
            <button
              type="button"
              onClick={() => toggle(g.id)}
              style={{
                width: '100%',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: isOpen
                  ? 'var(--color-primary-light)'
                  : 'var(--bg-secondary)',
                color: 'var(--color-primary)',
                fontSize: 13,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'right',
              }}
            >
              <span className="flex items-center gap-2">
                <i className={`ti ${g.icon}`} style={{ fontSize: 14 }} />
                {g.label}
              </span>
              <span style={{ fontSize: 11 }}>{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <div style={{ padding: '12px 12px' }}>
                {g.id === 'assets' && (
                  <AssetsGroup
                    details={details}
                    addBank={addBank}
                    updateBank={updateBank}
                    removeBank={removeBank}
                    addProperty={addProperty}
                    updateProperty={updateProperty}
                    removeProperty={removeProperty}
                  />
                )}
                {g.id === 'financial' && (
                  <FinancialGroup
                    items={details.financialAssets}
                    add={addFinancial}
                    update={updateFinancial}
                    remove={removeFinancial}
                  />
                )}
                {g.id === 'medical' && (
                  <DoctorsGroup
                    items={details.doctors}
                    add={addDoctor}
                    update={updateDoctor}
                    remove={removeDoctor}
                  />
                )}
                {g.id === 'preferences' && (
                  <PreferencesGroup
                    dietary={details.dietaryPreferences}
                    special={details.specialRequests}
                    onChangeDietary={(v) =>
                      onChange({ ...details, dietaryPreferences: v })
                    }
                    onChangeSpecial={(v) =>
                      onChange({ ...details, specialRequests: v })
                    }
                  />
                )}
              </div>
            )}
          </div>
        )
      })}

      <div style={{ marginTop: 16 }}>
        <InfoTip>
          הקטגוריות שתמלאי יופיעו אוטומטית כסעיפים נוספים בתצוגה המקדימה ובייצוא.
        </InfoTip>
      </div>
    </div>
  )
}

interface AssetsGroupProps {
  details: DocumentDetails
  addBank: () => void
  updateBank: (id: string, patch: Partial<BankAccount>) => void
  removeBank: (id: string) => void
  addProperty: (status: PropertyStatus) => void
  updateProperty: (id: string, patch: Partial<Property>) => void
  removeProperty: (id: string) => void
}

function AssetsGroup({
  details,
  addBank,
  updateBank,
  removeBank,
  addProperty,
  updateProperty,
  removeProperty,
}: AssetsGroupProps) {
  const residentialProps = details.properties.filter(
    (p) => p.status === 'מגורים'
  )
  const otherProps = details.properties.filter((p) => p.status !== 'מגורים')

  return (
    <div>
      <SectionLabel>חשבונות בנק</SectionLabel>
      {details.bankAccounts.length === 0 && <EmptyHint text="אין חשבונות" />}
      {details.bankAccounts.map((b) => (
        <div
          key={b.id}
          style={{
            ...rowStyle,
            gridTemplateColumns: '1fr 1fr 1.4fr auto',
          }}
        >
          <input
            placeholder="בנק"
            value={b.bank}
            onChange={(e) => updateBank(b.id, { bank: e.target.value })}
            style={fieldStyle}
          />
          <input
            placeholder="סניף"
            value={b.branch}
            onChange={(e) => updateBank(b.id, { branch: e.target.value })}
            style={fieldStyle}
          />
          <input
            placeholder="מס' חשבון"
            value={b.accountNumber}
            onChange={(e) =>
              updateBank(b.id, { accountNumber: e.target.value })
            }
            style={fieldStyle}
          />
          <button
            type="button"
            onClick={() => removeBank(b.id)}
            style={removeBtn}
            aria-label="הסר"
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" onClick={addBank} style={addBtn}>
        + חשבון בנק
      </button>

      <SectionLabel marginTop={20}>דירת מגורים</SectionLabel>
      {residentialProps.length === 0 && (
        <EmptyHint text="טרם הוזנה דירת מגורים" />
      )}
      {residentialProps.map((p) => (
        <PropertyRow
          key={p.id}
          property={p}
          onUpdate={(patch) => updateProperty(p.id, patch)}
          onRemove={() => removeProperty(p.id)}
          hideStatus
        />
      ))}
      <button
        type="button"
        onClick={() => addProperty('מגורים')}
        style={addBtn}
      >
        + דירת מגורים
      </button>

      <SectionLabel marginTop={20}>דירות נוספות (השקעה / השכרה)</SectionLabel>
      {otherProps.length === 0 && <EmptyHint text="אין דירות נוספות" />}
      {otherProps.map((p) => (
        <PropertyRow
          key={p.id}
          property={p}
          onUpdate={(patch) => updateProperty(p.id, patch)}
          onRemove={() => removeProperty(p.id)}
        />
      ))}
      <div className="flex gap-2 mt-2.5">
        <button
          type="button"
          onClick={() => addProperty('השקעה')}
          style={addBtn}
        >
          + דירת השקעה
        </button>
        <button
          type="button"
          onClick={() => addProperty('השכרה')}
          style={{ ...addBtn, backgroundColor: 'var(--color-accent)' }}
        >
          + דירה להשכרה
        </button>
      </div>
    </div>
  )
}

interface PropertyRowProps {
  property: Property
  onUpdate: (patch: Partial<Property>) => void
  onRemove: () => void
  hideStatus?: boolean
}

function PropertyRow({ property, onUpdate, onRemove, hideStatus }: PropertyRowProps) {
  return (
    <div
      style={{
        ...rowStyle,
        gridTemplateColumns: hideStatus
          ? '1.6fr 1fr auto'
          : '1.6fr 1fr 0.9fr auto',
      }}
    >
      <input
        placeholder="כתובת"
        value={property.address}
        onChange={(e) => onUpdate({ address: e.target.value })}
        style={fieldStyle}
      />
      <input
        placeholder="גוש / חלקה"
        value={property.gushHelka}
        onChange={(e) => onUpdate({ gushHelka: e.target.value })}
        style={fieldStyle}
      />
      {!hideStatus && (
        <select
          value={property.status}
          onChange={(e) =>
            onUpdate({ status: e.target.value as PropertyStatus })
          }
          style={fieldStyle}
        >
          {PROPERTY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        onClick={onRemove}
        style={removeBtn}
        aria-label="הסר"
      >
        ×
      </button>
    </div>
  )
}

interface FinancialGroupProps {
  items: FinancialAsset[]
  add: () => void
  update: (id: string, patch: Partial<FinancialAsset>) => void
  remove: (id: string) => void
}

function FinancialGroup({ items, add, update, remove }: FinancialGroupProps) {
  return (
    <div>
      {items.length === 0 && (
        <EmptyHint text="טרם הוזן רכוש פיננסי" />
      )}
      {items.map((f) => (
        <div
          key={f.id}
          style={{ ...rowStyle, gridTemplateColumns: '1fr 1.2fr 1fr auto' }}
        >
          <select
            value={f.type}
            onChange={(e) =>
              update(f.id, { type: e.target.value as FinancialAssetType })
            }
            style={fieldStyle}
          >
            {FINANCIAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {FINANCIAL_LABELS[t]}
              </option>
            ))}
          </select>
          <input
            placeholder="חברה"
            value={f.company}
            onChange={(e) => update(f.id, { company: e.target.value })}
            style={fieldStyle}
          />
          <input
            placeholder="מספר פוליסה / קופה"
            value={f.policyNumber}
            onChange={(e) => update(f.id, { policyNumber: e.target.value })}
            style={fieldStyle}
          />
          <button
            type="button"
            onClick={() => remove(f.id)}
            style={removeBtn}
            aria-label="הסר"
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" onClick={add} style={addBtn}>
        + רכוש פיננסי
      </button>
    </div>
  )
}

interface DoctorsGroupProps {
  items: Doctor[]
  add: () => void
  update: (id: string, patch: Partial<Doctor>) => void
  remove: (id: string) => void
}

function DoctorsGroup({ items, add, update, remove }: DoctorsGroupProps) {
  return (
    <div>
      {items.length === 0 && <EmptyHint text="לא הוזנו רופאים מטפלים" />}
      {items.map((d) => (
        <div
          key={d.id}
          style={{ ...rowStyle, gridTemplateColumns: '1.2fr 1fr 1.2fr auto' }}
        >
          <input
            placeholder="שם הרופא"
            value={d.name}
            onChange={(e) => update(d.id, { name: e.target.value })}
            style={fieldStyle}
          />
          <input
            placeholder="התמחות"
            value={d.specialty}
            onChange={(e) => update(d.id, { specialty: e.target.value })}
            style={fieldStyle}
          />
          <input
            placeholder="מרפאה / טלפון"
            value={d.clinic}
            onChange={(e) => update(d.id, { clinic: e.target.value })}
            style={fieldStyle}
          />
          <button
            type="button"
            onClick={() => remove(d.id)}
            style={removeBtn}
            aria-label="הסר"
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" onClick={add} style={addBtn}>
        + רופא מטפל
      </button>
    </div>
  )
}

interface PreferencesGroupProps {
  dietary: string
  special: string
  onChangeDietary: (v: string) => void
  onChangeSpecial: (v: string) => void
}

function PreferencesGroup({
  dietary,
  special,
  onChangeDietary,
  onChangeSpecial,
}: PreferencesGroupProps) {
  return (
    <div>
      <SectionLabel>העדפות תזונה</SectionLabel>
      <textarea
        value={dietary}
        onChange={(e) => onChangeDietary(e.target.value)}
        placeholder='למשל: כשרות, צמחונות, אלרגיות, מאכלים מועדפים…'
        rows={3}
        style={{ ...fieldStyle, resize: 'vertical', minHeight: 64 }}
      />

      <SectionLabel marginTop={16}>בקשות מיוחדות</SectionLabel>
      <textarea
        value={special}
        onChange={(e) => onChangeSpecial(e.target.value)}
        placeholder='הוראות נוספות לטיפול היומיומי, העדפות לבילוי, הרגלים…'
        rows={4}
        style={{ ...fieldStyle, resize: 'vertical', minHeight: 80 }}
      />
    </div>
  )
}

function SectionLabel({
  children,
  marginTop = 0,
}: {
  children: React.ReactNode
  marginTop?: number
}) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--text-secondary)',
        marginTop,
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: '8px 10px',
        fontSize: 11,
        color: 'var(--text-muted)',
        border: '1px dashed var(--border-default)',
        borderRadius: 4,
        marginBottom: 6,
      }}
    >
      {text}
    </div>
  )
}
