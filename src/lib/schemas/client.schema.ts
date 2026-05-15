import { z } from 'zod'

export const clientSchema = z.object({
  id: z.uuid({ error: 'מזהה לא תקין' }),
  userId: z.uuid({ error: 'מזהה משתמש לא תקין' }),
  displayName: z
    .string({ error: 'יש להזין שם תיק' })
    .trim()
    .min(1, { error: 'יש להזין שם תיק' }),
  notes: z.string().optional(),
  createdAt: z.coerce.date({ error: 'תאריך יצירה לא תקין' }),
  updatedAt: z.coerce.date({ error: 'תאריך עדכון לא תקין' }),
})
