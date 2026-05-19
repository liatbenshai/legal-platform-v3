import type { DocumentType } from '@/lib/types'

/**
 * הגדרות תצוגה לכל סוג מסמך — מה הכותרת הראשית, מה הכיתוב המשני,
 * והאם להציג את בלוק "פרטי הצדדים" בראש המסמך.
 *
 * הערה: heading שונה מ-document.title:
 * - heading — מה שנראה בגדול במרכז המסמך ("צוואה" / "ייפוי כוח מתמשך")
 * - document.title — השם הפנימי של הקובץ ("צוואת ליאת בן שי")
 */
export interface DocLayout {
  /** הכותרת הראשית הממורכזת במסמך */
  heading: string
  /** שורת כיתוב משנה מתחת לכותרת (ריק = לא להציג) */
  subtitle: string
  /** האם להציג את בלוק "פרטי הצדדים" בראש המסמך (לפני הסעיפים)?
   *  ב-POA זה רלוונטי. בצוואה — הפרטים נשזרים בתוך הסעיפים עצמם,
   *  אז עדיף לא להציג שוב. */
  showPartiesBlock: boolean
}

export const DOC_LAYOUTS: Record<DocumentType, DocLayout> = {
  'poa-property': {
    heading: 'ייפוי כוח מתמשך',
    subtitle:
      'לפי חוק הכשרות המשפטית והאפוטרופסות, התשכ״ב-1962',
    showPartiesBlock: true,
  },
  'poa-personal': {
    heading: 'ייפוי כוח מתמשך',
    subtitle:
      'לפי חוק הכשרות המשפטית והאפוטרופסות, התשכ״ב-1962',
    showPartiesBlock: true,
  },
  'poa-medical': {
    heading: 'ייפוי כוח מתמשך',
    subtitle:
      'לפי חוק הכשרות המשפטית והאפוטרופסות, התשכ״ב-1962',
    showPartiesBlock: true,
  },
  'will-individual': {
    heading: 'צוואה',
    subtitle: '',
    showPartiesBlock: false,
  },
  'will-mutual': {
    heading: 'צוואה הדדית',
    subtitle: '',
    showPartiesBlock: false,
  },
  'fee-agreement': {
    heading: 'הסכם שכר טרחה',
    subtitle: '',
    showPartiesBlock: true,
  },
  prenup: {
    heading: 'הסכם ממון',
    subtitle: '',
    showPartiesBlock: true,
  },
  divorce: {
    heading: 'הסכם גירושין',
    subtitle: '',
    showPartiesBlock: true,
  },
  partition: {
    heading: 'הסכם פירוק שיתוף',
    subtitle: '',
    showPartiesBlock: true,
  },
}

export function getDocLayout(type: DocumentType): DocLayout {
  return DOC_LAYOUTS[type]
}
