import type {
  DocumentDetails,
  FinancialAssetType,
  Property,
} from '@/lib/types'
import type { RenderedSection } from './renderer'

const FINANCIAL_LABELS: Record<FinancialAssetType, string> = {
  pension: 'קרן פנסיה',
  gemel: 'קופת גמל',
  hishtalmut: 'קרן השתלמות',
  insurance: 'ביטוח',
}

function formatBankAccount(b: {
  bank: string
  branch: string
  accountNumber: string
}): string {
  const parts: string[] = []
  if (b.bank) parts.push(`בנק ${b.bank}`)
  if (b.branch) parts.push(`סניף ${b.branch}`)
  if (b.accountNumber) parts.push(`חשבון מס' ${b.accountNumber}`)
  return parts.join(', ')
}

function formatProperty(p: Property, includeStatus: boolean): string {
  const parts: string[] = []
  if (p.address) parts.push(p.address)
  if (p.gushHelka) parts.push(`גוש/חלקה: ${p.gushHelka}`)
  if (includeStatus) parts.push(`(${p.status})`)
  return parts.join(', ')
}

function numberedList(items: string[]): string {
  return items.map((item, i) => `${i + 1}. ${item}`).join('\n')
}

export function buildDetailsSections(
  details: DocumentDetails
): RenderedSection[] {
  const sections: RenderedSection[] = []
  let order = -1000

  const bankItems = details.bankAccounts
    .map(formatBankAccount)
    .filter((s) => s.length > 0)
  if (bankItems.length > 0) {
    sections.push({
      id: '__details_bank',
      order: order++,
      title: 'חשבונות הבנק של הממנה',
      content: numberedList(bankItems),
      level: 'main',
    })
  }

  const residentialProps = details.properties.filter(
    (p) => p.status === 'מגורים'
  )
  const otherProps = details.properties.filter((p) => p.status !== 'מגורים')

  const propItems: string[] = []
  for (const p of residentialProps) {
    const line = formatProperty(p, false)
    if (line) propItems.push(`דירת מגורים: ${line}`)
  }
  for (const p of otherProps) {
    const line = formatProperty(p, true)
    if (line) propItems.push(line)
  }
  if (propItems.length > 0) {
    sections.push({
      id: '__details_properties',
      order: order++,
      title: 'נכסי מקרקעין',
      content: numberedList(propItems),
      level: 'main',
    })
  }

  const finItems = details.financialAssets
    .map((f) => {
      const parts: string[] = [FINANCIAL_LABELS[f.type]]
      if (f.company) parts.push(`ב-${f.company}`)
      if (f.policyNumber) parts.push(`מס' ${f.policyNumber}`)
      return parts.join(' ')
    })
    .filter((s) => s.trim().length > 0)
  if (finItems.length > 0) {
    sections.push({
      id: '__details_financial',
      order: order++,
      title: 'רכוש פיננסי',
      content: numberedList(finItems),
      level: 'main',
    })
  }

  const docItems = details.doctors
    .map((d) => {
      const parts: string[] = []
      if (d.name) parts.push(d.name)
      if (d.specialty) parts.push(`(${d.specialty})`)
      if (d.clinic) parts.push(`— ${d.clinic}`)
      return parts.join(' ')
    })
    .filter((s) => s.trim().length > 0)
  if (docItems.length > 0) {
    sections.push({
      id: '__details_doctors',
      order: order++,
      title: 'רופאים מטפלים',
      content: numberedList(docItems),
      level: 'main',
    })
  }

  const prefParts: string[] = []
  if (details.dietaryPreferences.trim()) {
    prefParts.push(`**העדפות תזונה:** ${details.dietaryPreferences.trim()}`)
  }
  if (details.specialRequests.trim()) {
    prefParts.push(`**בקשות מיוחדות:** ${details.specialRequests.trim()}`)
  }
  if (prefParts.length > 0) {
    sections.push({
      id: '__details_preferences',
      order: order++,
      title: 'העדפות אישיות',
      content: prefParts.join('\n\n'),
      level: 'main',
    })
  }

  return sections
}
