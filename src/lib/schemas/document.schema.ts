import { z } from 'zod'

export const documentTypeSchema = z.enum([
  'poa-property',
  'poa-personal',
  'poa-medical',
  'will-individual',
  'will-mutual',
  'prenup',
  'divorce',
  'partition',
  'fee-agreement',
])

export const actorRoleSchema = z.enum([
  'ממנה',
  'מיופה',
  'מיופה_חלופי',
  'מצווה',
  'יורש',
  'מנהל_עיזבון',
  'בעל',
  'אישה',
  'ילד',
  'תובע',
  'נתבע',
  'עד1',
  'עד2',
])

export const documentStatusSchema = z.enum(['draft', 'review', 'signed'])

export const sectionLevelSchema = z.enum(['main', 'sub', 'sub-sub'])

export const documentActorSchema = z.object({
  role: actorRoleSchema,
  personIds: z
    .array(z.uuid({ error: 'מזהה אדם לא תקין' }))
    .min(1, { error: 'יש לבחור לפחות אדם אחד עבור התפקיד' }),
  customLabel: z.string().trim().optional(),
})

export const documentSectionSchema = z.object({
  id: z.uuid({ error: 'מזהה סעיף לא תקין' }),
  order: z
    .number({ error: 'יש להזין סדר סעיף' })
    .int({ error: 'סדר סעיף חייב להיות מספר שלם' })
    .nonnegative({ error: 'סדר סעיף חייב להיות אי-שלילי' }),
  templateId: z.uuid().optional(),
  title: z
    .string({ error: 'יש להזין כותרת לסעיף' })
    .trim()
    .min(1, { error: 'יש להזין כותרת לסעיף' }),
  content: z.string({ error: 'יש להזין תוכן לסעיף' }),
  variant: z.string().optional(),
  level: sectionLevelSchema,
  variables: z.record(z.string(), z.string()).optional(),
})

export const documentSchema = z.object({
  id: z.uuid({ error: 'מזהה לא תקין' }),
  clientId: z.uuid({ error: 'מזהה לקוח לא תקין' }),
  userId: z.uuid({ error: 'מזהה משתמש לא תקין' }),
  type: documentTypeSchema,
  title: z
    .string({ error: 'יש להזין כותרת למסמך' })
    .trim()
    .min(1, { error: 'יש להזין כותרת למסמך' }),
  status: documentStatusSchema,
  actors: z.array(documentActorSchema),
  variables: z.record(z.string(), z.string()),
  sections: z.array(documentSectionSchema),
  createdAt: z.coerce.date({ error: 'תאריך יצירה לא תקין' }),
  updatedAt: z.coerce.date({ error: 'תאריך עדכון לא תקין' }),
})

export const documentVersionSchema = z.object({
  id: z.uuid({ error: 'מזהה לא תקין' }),
  documentId: z.uuid({ error: 'מזהה מסמך לא תקין' }),
  versionNumber: z
    .number({ error: 'יש להזין מספר גרסה' })
    .int({ error: 'מספר גרסה חייב להיות מספר שלם' })
    .positive({ error: 'מספר גרסה חייב להיות חיובי' }),
  snapshot: documentSchema,
  createdAt: z.coerce.date({ error: 'תאריך יצירה לא תקין' }),
  createdBy: z.uuid({ error: 'מזהה משתמש לא תקין' }),
})
