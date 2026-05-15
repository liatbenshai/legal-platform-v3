import type { ActorRole, DocumentType } from './document'

export interface SectionVariant {
  id: string
  label: string
  content: string
}

export interface SectionTemplate {
  id: string
  category: DocumentType
  documentTypes: DocumentType[]
  title: string
  description: string
  variants: SectionVariant[]
  requiredActors: ActorRole[]
  legalBasis: string
  isRequired: boolean
  conflictsWith: string[]
  tags: string[]
  isSystem: boolean
  userId?: string
  usageCount: number
}
