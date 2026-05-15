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

export type DocumentStatus = 'draft' | 'review' | 'signed'

export type SectionLevel = 'main' | 'sub' | 'sub-sub'

export interface DocumentActor {
  role: ActorRole
  personIds: string[]
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
