import type { EmbeddedPerson } from './person'

export type DocumentType =
  | 'poa-property'
  | 'poa-personal'
  | 'poa-medical'
  | 'will-individual'
  | 'will-mutual'
  | 'prenup'
  | 'divorce'
  | 'partition'
  | 'fee-agreement'

export type ActorRole =
  | 'ממנה'
  | 'מיופה'
  | 'מיופה_חלופי'
  | 'מצווה'
  | 'יורש'
  | 'מנהל_עיזבון'
  | 'בעל'
  | 'אישה'
  | 'ילד'
  | 'תובע'
  | 'נתבע'
  | 'עד1'
  | 'עד2'
  | 'לקוח'
  | 'עורך_דין'

export type DocumentStatus = 'draft' | 'review' | 'signed'

export type SectionLevel = 'main' | 'sub' | 'sub-sub'

/**
 * שחקן במסמך (ממנה, מיופה כוח, יורש, וכו').
 * persons מאוחסן inline — אין הפניה לטבלת persons.
 * זה אומר שאם פרטי הלקוח ישתנו אחר כך, מסמכים ישנים לא ייפגעו.
 */
export interface DocumentActor {
  role: ActorRole
  persons: EmbeddedPerson[]
  customLabel?: string
}

export interface DocumentSection {
  id: string
  order: number
  templateId?: string
  title: string
  content: string
  variant?: string
  level: SectionLevel
  variables?: Record<string, string>
}

export interface BankAccount {
  id: string
  bank: string
  branch: string
  accountNumber: string
}

export type PropertyStatus = 'מגורים' | 'השקעה' | 'השכרה'

export interface Property {
  id: string
  address: string
  gushHelka: string
  status: PropertyStatus
}

export type FinancialAssetType = 'pension' | 'gemel' | 'hishtalmut' | 'insurance'

export interface FinancialAsset {
  id: string
  type: FinancialAssetType
  company: string
  policyNumber: string
}

export interface Doctor {
  id: string
  name: string
  specialty: string
  clinic: string
}

export interface DocumentDetails {
  bankAccounts: BankAccount[]
  properties: Property[]
  financialAssets: FinancialAsset[]
  doctors: Doctor[]
  dietaryPreferences: string
  specialRequests: string
}

export const EMPTY_DETAILS: DocumentDetails = {
  bankAccounts: [],
  properties: [],
  financialAssets: [],
  doctors: [],
  dietaryPreferences: '',
  specialRequests: '',
}

export interface Document {
  id: string
  clientId: string
  userId: string
  type: DocumentType
  title: string
  status: DocumentStatus
  actors: DocumentActor[]
  variables: Record<string, string>
  sections: DocumentSection[]
  details?: DocumentDetails
  createdAt: Date
  updatedAt: Date
}

export interface DocumentVersion {
  id: string
  documentId: string
  versionNumber: number
  snapshot: Document
  createdAt: Date
  createdBy: string
}
