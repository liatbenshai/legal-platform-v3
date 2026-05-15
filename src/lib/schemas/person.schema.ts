import { z } from 'zod'

export const genderSchema = z.enum(['male', 'female'])

export const personSchema = z.object({
  id: z.uuid({ error: 'מזהה לא תקין' }),
  clientId: z.uuid({ error: 'מזהה לקוח לא תקין' }),
  firstName: z
    .string({ error: 'יש להזין שם פרטי' })
    .trim()
    .min(1, { error: 'יש להזין שם פרטי' }),
  lastName: z
    .string({ error: 'יש להזין שם משפחה' })
    .trim()
    .min(1, { error: 'יש להזין שם משפחה' }),
  idNumber: z
    .string({ error: 'יש להזין תעודת זהות' })
    .regex(/^\d{9}$/, { error: 'תעודת זהות חייבת להכיל בדיוק 9 ספרות' }),
  gender: genderSchema,
  birthDate: z.coerce.date({ error: 'תאריך לידה לא תקין' }).optional(),
  address: z
    .string({ error: 'יש להזין כתובת' })
    .trim()
    .min(1, { error: 'יש להזין כתובת' }),
  city: z
    .string({ error: 'יש להזין עיר' })
    .trim()
    .min(1, { error: 'יש להזין עיר' }),
  phone: z.string().trim().optional(),
  email: z.email({ error: 'כתובת אימייל לא תקינה' }).optional(),
})
