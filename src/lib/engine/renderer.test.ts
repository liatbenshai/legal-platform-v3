import { describe, expect, it } from 'vitest'
import type {
  Document,
  DocumentActor,
  DocumentSection,
  Person,
} from '@/lib/types'
import {
  extractPlaceholders,
  renderDocument,
  renderText,
  type RenderContext,
} from './renderer'

const david: Person = {
  id: 'p1',
  clientId: 'c1',
  role: 'primary',
  firstName: 'דוד',
  lastName: 'כהן',
  idNumber: '123456789',
  gender: 'male',
  birthDate: new Date(1980, 4, 15),
  address: 'רחוב הרצל 12',
  city: 'תל אביב',
  phone: '050-1234567',
  email: 'david@example.com',
}

const sara: Person = {
  id: 'p2',
  clientId: 'c1',
  role: 'partner',
  firstName: 'שרה',
  lastName: 'לוי',
  idNumber: '987654321',
  gender: 'female',
  birthDate: new Date(1985, 7, 22),
  address: 'רחוב יפו 3',
  city: 'חיפה',
  phone: '052-7654321',
  email: 'sara@example.com',
}

const rachel: Person = {
  id: 'p3',
  clientId: 'c1',
  role: 'contact',
  firstName: 'רחל',
  lastName: 'אברהם',
  idNumber: '111222333',
  gender: 'female',
  address: 'רחוב הים 5',
  city: 'אילת',
}

const allPersons: Person[] = [david, sara, rachel]

function makeCtx(opts: {
  actors?: DocumentActor[]
  persons?: Person[]
  variables?: Record<string, string>
  sections?: DocumentSection[]
}): RenderContext {
  const now = new Date(2026, 4, 15)
  const document: Document = {
    id: 'doc-1',
    clientId: 'c1',
    userId: 'u1',
    type: 'poa-property',
    title: 'מסמך בדיקה',
    status: 'draft',
    actors: opts.actors ?? [],
    variables: opts.variables ?? {},
    sections: opts.sections ?? [],
    createdAt: now,
    updatedAt: now,
  }
  return { document, persons: opts.persons ?? allPersons }
}

describe('renderText - global variables', () => {
  it('מחזיר ערך של משתנה גלובלי', () => {
    const ctx = makeCtx({ variables: { 'תאריך_חתימה': '15/05/2026' } })
    expect(renderText('נחתם בתאריך {{תאריך_חתימה}}', ctx)).toBe(
      'נחתם בתאריך 15/05/2026'
    )
  })

  it('משתנה גלובלי שלא קיים מוחזר כמו שהוא', () => {
    const ctx = makeCtx({})
    expect(renderText('{{תאריך_חסר}}', ctx)).toBe('{{תאריך_חסר}}')
  })

  it('placeholder עם רווחים מסביב לאחר trim עובד', () => {
    const ctx = makeCtx({ variables: { 'מקום': 'חיפה' } })
    expect(renderText('{{  מקום  }}', ctx)).toBe('חיפה')
  })
})

describe('renderText - person fields (single)', () => {
  const ctx = makeCtx({ actors: [{ role: 'ממנה', personIds: ['p1'] }] })

  it('שדה שם מחזיר שם פרטי + משפחה', () => {
    expect(renderText('{{ממנה.שם}}', ctx)).toBe('דוד כהן')
  })

  it('שדה שם_פרטי מחזיר שם פרטי בלבד', () => {
    expect(renderText('{{ממנה.שם_פרטי}}', ctx)).toBe('דוד')
  })

  it('שדה שם_משפחה מחזיר שם משפחה בלבד', () => {
    expect(renderText('{{ממנה.שם_משפחה}}', ctx)).toBe('כהן')
  })

  it('שדה תז מחזיר תעודת זהות', () => {
    expect(renderText('{{ממנה.תז}}', ctx)).toBe('123456789')
  })

  it('האליאס ת.ז. מחזיר תעודת זהות', () => {
    expect(renderText('{{ממנה.ת.ז.}}', ctx)).toBe('123456789')
  })

  it('שדה כתובת מחזיר כתובת', () => {
    expect(renderText('{{ממנה.כתובת}}', ctx)).toBe('רחוב הרצל 12')
  })

  it('שדה עיר מחזיר עיר', () => {
    expect(renderText('{{ממנה.עיר}}', ctx)).toBe('תל אביב')
  })
})

describe('renderText - optional fields', () => {
  it('תאריך_לידה מוחזר בפורמט dd/mm/yyyy', () => {
    const ctx = makeCtx({ actors: [{ role: 'ממנה', personIds: ['p1'] }] })
    expect(renderText('{{ממנה.תאריך_לידה}}', ctx)).toBe('15/05/1980')
  })

  it('תאריך_לידה ריק לאדם בלי תאריך', () => {
    const ctx = makeCtx({ actors: [{ role: 'ממנה', personIds: ['p3'] }] })
    expect(renderText('{{ממנה.תאריך_לידה}}', ctx)).toBe('')
  })

  it('שדה טלפון מחזיר טלפון', () => {
    const ctx = makeCtx({ actors: [{ role: 'ממנה', personIds: ['p1'] }] })
    expect(renderText('{{ממנה.טלפון}}', ctx)).toBe('050-1234567')
  })

  it('שדה אימייל מחזיר אימייל', () => {
    const ctx = makeCtx({ actors: [{ role: 'ממנה', personIds: ['p1'] }] })
    expect(renderText('{{ממנה.אימייל}}', ctx)).toBe('david@example.com')
  })
})

describe('renderText - gender inflection', () => {
  it('זכר יחיד - יפעל', () => {
    const ctx = makeCtx({ actors: [{ role: 'מיופה', personIds: ['p1'] }] })
    expect(renderText('{{מיופה.יפעל}}', ctx)).toBe('יפעל')
    expect(renderText('{{מיופה.רשאי}}', ctx)).toBe('רשאי')
    expect(renderText('{{מיופה.תפקידו}}', ctx)).toBe('תפקידו')
  })

  it('נקבה יחידה - יפעל הופך לתפעל', () => {
    const ctx = makeCtx({ actors: [{ role: 'מיופה', personIds: ['p2'] }] })
    expect(renderText('{{מיופה.יפעל}}', ctx)).toBe('תפעל')
    expect(renderText('{{מיופה.רשאי}}', ctx)).toBe('רשאית')
    expect(renderText('{{מיופה.תפקידו}}', ctx)).toBe('תפקידה')
  })

  it('רבים זכרים - יפעלו', () => {
    const ctx = makeCtx({
      actors: [{ role: 'מיופה', personIds: ['p1', 'p1'] }],
    })
    expect(renderText('{{מיופה.יפעל}}', ctx)).toBe('יפעלו')
    expect(renderText('{{מיופה.רשאי}}', ctx)).toBe('רשאים')
  })

  it('רבים מעורב (זכר + נקבה) - משתמש בצורת רבים זכר', () => {
    const ctx = makeCtx({
      actors: [{ role: 'מיופה', personIds: ['p1', 'p2'] }],
    })
    expect(renderText('{{מיופה.יפעל}}', ctx)).toBe('יפעלו')
    expect(renderText('{{מיופה.תפקידו}}', ctx)).toBe('תפקידם')
  })

  it('רבות בלבד - נופל ל-plural כשאין plural_female במילון', () => {
    const ctx = makeCtx({
      actors: [{ role: 'מיופה', personIds: ['p2', 'p3'] }],
    })
    expect(renderText('{{מיופה.רשאי}}', ctx)).toBe('רשאים')
    expect(renderText('{{מיופה.תפקידו}}', ctx)).toBe('תפקידם')
  })

  it('מילה שלא במילון מוחזרת כמו שהיא', () => {
    const ctx = makeCtx({ actors: [{ role: 'מיופה', personIds: ['p2'] }] })
    expect(renderText('{{מיופה.שטויות}}', ctx)).toBe('שטויות')
  })
})

describe('renderText - multiple persons joining', () => {
  it('שמות של שני אנשים מצורפים עם " ו-"', () => {
    const ctx = makeCtx({
      actors: [{ role: 'מיופה', personIds: ['p1', 'p2'] }],
    })
    expect(renderText('{{מיופה.שם}}', ctx)).toBe('דוד כהן ו-שרה לוי')
  })

  it('תעודות זהות של שני אנשים מצורפות עם ", "', () => {
    const ctx = makeCtx({
      actors: [{ role: 'מיופה', personIds: ['p1', 'p2'] }],
    })
    expect(renderText('{{מיופה.תז}}', ctx)).toBe('123456789, 987654321')
  })

  it('כתובות של שני אנשים מצורפות עם ", "', () => {
    const ctx = makeCtx({
      actors: [{ role: 'מיופה', personIds: ['p2', 'p3'] }],
    })
    expect(renderText('{{מיופה.כתובת}}', ctx)).toBe('רחוב יפו 3, רחוב הים 5')
  })
})

describe('renderText - edge cases', () => {
  it('שחקן שלא קיים במסמך - מחזיר את ה-placeholder המקורי', () => {
    const ctx = makeCtx({ actors: [{ role: 'ממנה', personIds: ['p1'] }] })
    expect(renderText('{{מיופה.שם}}', ctx)).toBe('{{מיופה.שם}}')
  })

  it('שחקן עם personIds ריק - מחזיר את ה-placeholder המקורי', () => {
    const ctx = makeCtx({ actors: [{ role: 'מיופה', personIds: [] }] })
    expect(renderText('{{מיופה.שם}}', ctx)).toBe('{{מיופה.שם}}')
  })

  it('שחקן שמצביע ל-personId לא קיים - מחזיר את ה-placeholder המקורי', () => {
    const ctx = makeCtx({
      actors: [{ role: 'מיופה', personIds: ['p999'] }],
    })
    expect(renderText('{{מיופה.שם}}', ctx)).toBe('{{מיופה.שם}}')
  })

  it('טקסט בלי placeholders חוזר ללא שינוי', () => {
    const ctx = makeCtx({})
    expect(renderText('זהו טקסט פשוט ללא תחביר מיוחד', ctx)).toBe(
      'זהו טקסט פשוט ללא תחביר מיוחד'
    )
  })
})

describe('renderText - composite text', () => {
  it('טקסט מורכב עם מספר placeholders מסוגים שונים', () => {
    const ctx = makeCtx({
      actors: [
        { role: 'ממנה', personIds: ['p1'] },
        { role: 'מיופה', personIds: ['p2'] },
      ],
      variables: { 'תאריך_חתימה': '15/05/2026' },
    })
    const template =
      'אני, {{ממנה.שם}} ת.ז. {{ממנה.תז}}, ממנה את {{מיופה.שם}} ב-{{תאריך_חתימה}}. {{מיופה.הוא}} {{מיופה.יפעל}} בשמי.'
    expect(renderText(template, ctx)).toBe(
      'אני, דוד כהן ת.ז. 123456789, ממנה את שרה לוי ב-15/05/2026. היא תפעל בשמי.'
    )
  })

  it('placeholder שמופיע פעמיים מוחלף בשני המקומות', () => {
    const ctx = makeCtx({ actors: [{ role: 'ממנה', personIds: ['p1'] }] })
    expect(renderText('{{ממנה.שם}} ו-{{ממנה.שם}}', ctx)).toBe('דוד כהן ו-דוד כהן')
  })
})

describe('extractPlaceholders', () => {
  it('מחזיר רשימה של כל ה-placeholders בטקסט', () => {
    const result = extractPlaceholders(
      '{{ממנה.שם}} ת.ז. {{ממנה.תז}}, תאריך: {{תאריך_חתימה}}'
    )
    expect(result).toEqual(['ממנה.שם', 'ממנה.תז', 'תאריך_חתימה'])
  })

  it('משמיט placeholders חוזרים (ייחודי)', () => {
    const result = extractPlaceholders(
      '{{ממנה.שם}} ו-{{ממנה.שם}} בתאריך {{תאריך}}'
    )
    expect(result).toEqual(['ממנה.שם', 'תאריך'])
  })

  it('טקסט ללא placeholders מחזיר מערך ריק', () => {
    expect(extractPlaceholders('סתם טקסט')).toEqual([])
  })

  it('placeholders עם רווחים נסגרים אחרי trim', () => {
    const result = extractPlaceholders('{{  ממנה.שם  }} ו-{{ ממנה.שם }}')
    expect(result).toEqual(['ממנה.שם'])
  })
})

describe('renderDocument', () => {
  const ctx = makeCtx({
    actors: [{ role: 'ממנה', personIds: ['p1'] }],
    sections: [
      {
        id: 's2',
        order: 2,
        title: 'סעיף שני',
        content: 'תוכן עם {{ממנה.שם}}',
        level: 'main',
      },
      {
        id: 's1',
        order: 1,
        title: 'סעיף ראשון',
        content: 'תוכן ראשון',
        level: 'main',
      },
      {
        id: 's3',
        order: 3,
        title: 'תת-סעיף',
        content: 'תוכן {{ממנה.תז}}',
        level: 'sub',
      },
    ],
  })

  it('ממיין סעיפים לפי order', () => {
    const rendered = renderDocument(ctx)
    expect(rendered.map((s) => s.id)).toEqual(['s1', 's2', 's3'])
  })

  it('מבצע rendering על title ו-content', () => {
    const rendered = renderDocument(ctx)
    expect(rendered[1].content).toBe('תוכן עם דוד כהן')
    expect(rendered[2].content).toBe('תוכן 123456789')
  })

  it('שומר על שדה level', () => {
    const rendered = renderDocument(ctx)
    expect(rendered[0].level).toBe('main')
    expect(rendered[2].level).toBe('sub')
  })

  it('לא משנה את מערך הסעיפים המקורי (immutability)', () => {
    const originalOrders = ctx.document.sections.map((s) => s.order)
    const originalIds = ctx.document.sections.map((s) => s.id)
    renderDocument(ctx)
    expect(ctx.document.sections.map((s) => s.order)).toEqual(originalOrders)
    expect(ctx.document.sections.map((s) => s.id)).toEqual(originalIds)
  })
})
