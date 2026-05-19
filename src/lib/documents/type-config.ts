import type { ActorRole, DocumentType, Person } from '@/lib/types'

export type TabKind =
  | 'actor'
  | 'powers'
  | 'details'
  | 'directives'
  | 'signature'

export interface TabSpec {
  id: string
  kind: TabKind
  label: string
  description: string
  actorRole?: ActorRole
  multiple?: boolean
}

export interface DocTypeConfig {
  type: DocumentType
  label: string
  defaultTitle: (primary: Person | null) => string
  tabs: TabSpec[]
}

const personFullName = (p: Person | null): string =>
  p ? `${p.firstName} ${p.lastName}` : ''

const poaTabs: TabSpec[] = [
  {
    id: 'principal',
    kind: 'actor',
    label: 'פרטי הממנה',
    description: 'בחרי את האדם שיוצא ייפוי הכוח בשמו.',
    actorRole: 'ממנה',
    multiple: false,
  },
  {
    id: 'attorneys',
    kind: 'actor',
    label: 'מיופי הכוח',
    description: 'מי יקבל את הסמכויות לפעול בשם הממנה.',
    actorRole: 'מיופה',
    multiple: true,
  },
  {
    id: 'powers',
    kind: 'powers',
    label: 'סמכויות',
    description: 'באילו תחומים מיופה הכוח מוסמך לפעול.',
  },
  {
    id: 'details',
    kind: 'details',
    label: 'פרטים',
    description: 'נכסים, רכוש פיננסי, רופאים והעדפות אישיות.',
  },
  {
    id: 'directives',
    kind: 'directives',
    label: 'הנחיות מקדימות',
    description: 'בחרי סעיפים שמפרטים איך לפעול במצבים שונים.',
  },
  {
    id: 'signature',
    kind: 'signature',
    label: 'חתימה ואישור',
    description: 'סקירה אחרונה לפני ייצוא ל-Word.',
  },
]

export const DOC_TYPE_CONFIGS: Record<DocumentType, DocTypeConfig> = {
  'poa-property': {
    type: 'poa-property',
    label: 'ייפוי כוח מתמשך',
    defaultTitle: (p) => `ייפוי כוח - ${personFullName(p) || 'חדש'}`,
    tabs: poaTabs,
  },
  'poa-personal': {
    type: 'poa-personal',
    label: 'ייפוי כוח מתמשך',
    defaultTitle: (p) => `ייפוי כוח - ${personFullName(p) || 'חדש'}`,
    tabs: poaTabs,
  },
  'poa-medical': {
    type: 'poa-medical',
    label: 'ייפוי כוח מתמשך',
    defaultTitle: (p) => `ייפוי כוח - ${personFullName(p) || 'חדש'}`,
    tabs: poaTabs,
  },
  'fee-agreement': {
    type: 'fee-agreement',
    label: 'הסכם שכר טרחה',
    defaultTitle: (p) => `הסכם שכר טרחה - ${personFullName(p) || 'חדש'}`,
    tabs: [
      {
        id: 'client',
        kind: 'actor',
        label: 'לקוח',
        description: 'בחרי את הלקוח שמולו נחתם ההסכם.',
        actorRole: 'לקוח',
        multiple: false,
      },
      {
        id: 'lawyer',
        kind: 'actor',
        label: 'עו"ד',
        description: 'בחרי את עורך הדין שצד להסכם.',
        actorRole: 'עורך_דין',
        multiple: false,
      },
      {
        id: 'details',
        kind: 'details',
        label: 'פרטים',
        description: 'נכסים, רכוש פיננסי, רופאים והעדפות אישיות.',
      },
      {
        id: 'directives',
        kind: 'directives',
        label: 'סעיפי הסכם',
        description: 'סעיפי שכר הטרחה ותנאי ההתקשרות.',
      },
      {
        id: 'signature',
        kind: 'signature',
        label: 'חתימה',
        description: 'סקירה אחרונה לפני ייצוא ל-Word.',
      },
    ],
  },
  'will-individual': {
    type: 'will-individual',
    label: 'צוואת יחיד',
    defaultTitle: (p) => `צוואה - ${personFullName(p) || 'חדשה'}`,
    tabs: [
      {
        id: 'testator',
        kind: 'actor',
        label: 'מצווה',
        description: 'בחרי את האדם שהצוואה מנוסחת בשמו.',
        actorRole: 'מצווה',
        multiple: false,
      },
      {
        id: 'heirs',
        kind: 'actor',
        label: 'יורשים',
        description: 'מי יקבלו את העיזבון לפי הצוואה.',
        actorRole: 'יורש',
        multiple: true,
      },
      {
        id: 'estate-manager',
        kind: 'actor',
        label: 'מנהל עיזבון',
        description: 'מי יבצע את הוראות הצוואה (אופציונלי).',
        actorRole: 'מנהל_עיזבון',
        multiple: false,
      },
      {
        id: 'witness-1',
        kind: 'actor',
        label: 'עד ראשון',
        description: 'פרטי העד הראשון שיחתום על הצוואה.',
        actorRole: 'עד1',
        multiple: false,
      },
      {
        id: 'witness-2',
        kind: 'actor',
        label: 'עד שני',
        description: 'פרטי העד השני שיחתום על הצוואה.',
        actorRole: 'עד2',
        multiple: false,
      },
      {
        id: 'details',
        kind: 'details',
        label: 'פרטים',
        description: 'נכסים, רכוש פיננסי, רופאים והעדפות אישיות.',
      },
      {
        id: 'directives',
        kind: 'directives',
        label: 'סעיפי הצוואה',
        description: 'הוראות חלוקה, הנחיות מיוחדות וכו׳.',
      },
      {
        id: 'signature',
        kind: 'signature',
        label: 'חתימה ועדים',
        description: 'סקירה ועדים לפני ייצוא ל-Word.',
      },
    ],
  },
  'will-mutual': {
    type: 'will-mutual',
    label: 'צוואה הדדית',
    defaultTitle: (p) => `צוואה הדדית - ${personFullName(p) || 'חדשה'}`,
    tabs: [
      {
        id: 'spouse-1',
        kind: 'actor',
        label: 'מצווה ראשון',
        description: 'בחרי את אחד מבני הזוג.',
        actorRole: 'בעל',
        multiple: false,
      },
      {
        id: 'spouse-2',
        kind: 'actor',
        label: 'מצווה שני',
        description: 'בחרי את בן/בת הזוג השני.',
        actorRole: 'אישה',
        multiple: false,
      },
      {
        id: 'heirs',
        kind: 'actor',
        label: 'יורשים',
        description: 'מי יקבלו את העיזבון לאחר פטירת בן הזוג האחרון.',
        actorRole: 'יורש',
        multiple: true,
      },
      {
        id: 'estate-manager',
        kind: 'actor',
        label: 'מנהל עיזבון',
        description: 'מי יבצע את הוראות הצוואה (אופציונלי).',
        actorRole: 'מנהל_עיזבון',
        multiple: false,
      },
      {
        id: 'details',
        kind: 'details',
        label: 'פרטים',
        description: 'נכסים ופרטים נוספים.',
      },
      {
        id: 'directives',
        kind: 'directives',
        label: 'סעיפי הצוואה',
        description: 'הוראות חלוקה, הנחיות מיוחדות וכו׳.',
      },
      {
        id: 'signature',
        kind: 'signature',
        label: 'חתימה ועדים',
        description: 'סקירה ועדים לפני ייצוא ל-Word.',
      },
    ],
  },
  prenup: {
    type: 'prenup',
    label: 'הסכם ממון',
    defaultTitle: (p) => `הסכם ממון - ${personFullName(p) || 'חדש'}`,
    tabs: [],
  },
  divorce: {
    type: 'divorce',
    label: 'הסכם גירושין',
    defaultTitle: (p) => `הסכם גירושין - ${personFullName(p) || 'חדש'}`,
    tabs: [],
  },
  partition: {
    type: 'partition',
    label: 'הסכם פירוק שיתוף',
    defaultTitle: (p) => `הסכם פירוק שיתוף - ${personFullName(p) || 'חדש'}`,
    tabs: [],
  },
}

export function getDocTypeConfig(type: DocumentType): DocTypeConfig {
  return DOC_TYPE_CONFIGS[type]
}

export interface ActorLabels {
  male: string
  female: string
  plural: string
}

export const ACTOR_LABELS: Record<ActorRole, ActorLabels> = {
  ממנה: { male: 'הממנה', female: 'הממנה', plural: 'הממנים' },
  מיופה: { male: 'מיופה הכוח', female: 'מיופת הכוח', plural: 'מיופי הכוח' },
  מיופה_חלופי: {
    male: 'מיופה כוח חלופי',
    female: 'מיופת כוח חלופית',
    plural: 'מיופי כוח חלופיים',
  },
  מצווה: { male: 'המצווה', female: 'המצווה', plural: 'המצווים' },
  יורש: { male: 'יורש', female: 'יורשת', plural: 'יורשים' },
  מנהל_עיזבון: {
    male: 'מנהל עיזבון',
    female: 'מנהלת עיזבון',
    plural: 'מנהלי עיזבון',
  },
  בעל: { male: 'בעל', female: 'בעל', plural: 'בעלים' },
  אישה: { male: 'אישה', female: 'אישה', plural: 'נשים' },
  ילד: { male: 'ילד', female: 'ילדה', plural: 'ילדים' },
  תובע: { male: 'תובע', female: 'תובעת', plural: 'תובעים' },
  נתבע: { male: 'נתבע', female: 'נתבעת', plural: 'נתבעים' },
  עד1: { male: 'עד', female: 'עדה', plural: 'עדים' },
  עד2: { male: 'עד נוסף', female: 'עדה נוספת', plural: 'עדים נוספים' },
  לקוח: { male: 'לקוח', female: 'לקוחה', plural: 'לקוחות' },
  עורך_דין: {
    male: 'עורך דין',
    female: 'עורכת דין',
    plural: 'עורכי דין',
  },
}

export const SUPPORTED_DOC_TYPES: DocumentType[] = [
  'poa-property',
  'fee-agreement',
  'will-individual',
  'will-mutual',
]
