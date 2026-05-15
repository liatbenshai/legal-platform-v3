import { z } from 'zod'
import { actorRoleSchema, documentTypeSchema } from './document.schema'

export const sectionVariantSchema = z.object({
  id: z
    .string({ error: 'יש להזין מזהה וריאציה' })
    .trim()
    .min(1, { error: 'יש להזין מזהה וריאציה' }),
  label: z
    .string({ error: 'יש להזין שם תצוגה לוריאציה' })
    .trim()
    .min(1, { error: 'יש להזין שם תצוגה לוריאציה' }),
  content: z.string({ error: 'יש להזין תוכן וריאציה' }),
})

export const sectionTemplateSchema = z.object({
  id: z.uuid({ error: 'מזהה לא תקין' }),
  category: documentTypeSchema,
  documentTypes: z
    .array(documentTypeSchema)
    .min(1, { error: 'יש לציין לפחות סוג מסמך אחד' }),
  title: z
    .string({ error: 'יש להזין כותרת לתבנית' })
    .trim()
    .min(1, { error: 'יש להזין כותרת לתבנית' }),
  description: z.string(),
  variants: z
    .array(sectionVariantSchema)
    .min(1, { error: 'יש להזין לפחות וריאציה אחת' }),
  requiredActors: z.array(actorRoleSchema),
  legalBasis: z.string(),
  isRequired: z.boolean(),
  conflictsWith: z.array(z.uuid({ error: 'מזהה תבנית מתנגשת לא תקין' })),
  tags: z.array(z.string()),
  isSystem: z.boolean(),
  userId: z.uuid({ error: 'מזהה משתמש לא תקין' }).optional(),
  usageCount: z
    .number({ error: 'יש להזין מספר שימושים' })
    .int({ error: 'מספר שימושים חייב להיות מספר שלם' })
    .nonnegative({ error: 'מספר שימושים חייב להיות אי-שלילי' }),
})
