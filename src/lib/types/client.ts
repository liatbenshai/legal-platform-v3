import type { DocumentType } from './document'

export interface Client {
  id: string
  userId: string
  displayName: string
  notes?: string
  /** סוגי מסמכים מתוכננים — תזכורת ויזואלית, לא משפיע על לוגיקה */
  plannedDocTypes: DocumentType[]
  createdAt: Date
  updatedAt: Date
}
