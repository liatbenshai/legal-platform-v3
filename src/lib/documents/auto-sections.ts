import type { Document, DocumentSection, DocumentType } from '@/lib/types'
import {
  cleanAuthority,
  DOMAIN_PHRASE_PLURAL,
  JOINTNESS_OPTIONS,
  parseAuthority,
} from '@/lib/documents/authority'

const POA_TYPES: DocumentType[] = ['poa-property', 'poa-personal', 'poa-medical']

/**
 * סעיף חלוקת סמכויות — מתווסף אוטומטית בראש מסמך ייפוי כוח
 * כאשר הוגדרה חלוקה (אילו מיופי כוח אחראים על אילו תחומים).
 */
function buildAuthorityClause(doc: Document): DocumentSection | null {
  if (!POA_TYPES.includes(doc.type)) return null

  const attorneys = doc.actors.find((a) => a.role === 'מיופה')?.persons ?? []
  if (attorneys.length === 0) return null

  const authority = cleanAuthority(parseAuthority(doc.variables), attorneys.length)
  if (authority.scopes.length === 0) return null

  // בונים פסקה לכל תחום
  const paragraphs: string[] = []
  for (const scope of authority.scopes) {
    const responsibleAttorneys = scope.attorneyIndices
      .map((i) => attorneys[i])
      .filter((a) => a !== undefined)
    if (responsibleAttorneys.length === 0) continue

    const domainPhrase = DOMAIN_PHRASE_PLURAL[scope.domain] ?? scope.domain
    const namesText = responsibleAttorneys
      .map((a) => {
        const fullName = `${a.firstName} ${a.lastName}`.trim()
        return a.idNumber ? `${fullName}, ת.ז. ${a.idNumber}` : fullName
      })
      .join(' ו-')

    const isPlural = responsibleAttorneys.length > 1
    const allFemale = responsibleAttorneys.every((a) => a.gender === 'female')
    const titleText = isPlural
      ? allFemale
        ? 'מיופות הכוח הן'
        : 'מיופי הכוח הם'
      : responsibleAttorneys[0].gender === 'female'
        ? 'מיופת הכוח היא'
        : 'מיופה הכוח הוא'

    let para = `בעניינים ${domainPhrase} — ${titleText} ${namesText}.`

    if (isPlural && scope.jointness) {
      const jointnessOpt = JOINTNESS_OPTIONS.find(
        (j) => j.value === scope.jointness
      )
      if (jointnessOpt) {
        para += ` ${jointnessOpt.clauseText}.`
      }
    }

    paragraphs.push(para)
  }

  if (paragraphs.length === 0) return null

  return {
    id: '__auto_authority',
    order: -10000, // מבטיח שיופיע ראשון
    title: 'חלוקת סמכויות בין מיופי הכוח',
    level: 'main',
    content: paragraphs.join('\n\n'),
  }
}

/**
 * סעיף אישור עדים — מצורף בסוף כל צוואת יחיד אוטומטית.
 * משתמש ב-placeholders רגילים שיופעלו ע"י המנוע (renderer).
 * תאריך החתימה מתעדכן דינמית בכל פעם שהמסמך נצפה או מיוצא.
 */
const WITNESS_SECTION_WILL_INDIVIDUAL: DocumentSection = {
  id: '__auto_witness',
  order: 99999, // מבטיח שיהיה בסוף
  title: 'אישור עדים',
  level: 'main',
  content: [
    'אנו הח״מ, {{עד1.שם}}, ת״ז {{עד1.תז}}, מ{{עד1.כתובת}} {{עד1.עיר}},',
    'ו-{{עד2.שם}}, ת״ז {{עד2.תז}}, מ{{עד2.כתובת}} {{עד2.עיר}},',
    'מעידים בזה כי:',
    '',
    '1. {{מצווה.שם}}, ת״ז {{מצווה.תז}} (להלן "המצווה"), זיהינו אישית את {{מצווה.מצווה_תפקיד}} ו/או באמצעות תעודת זהות.',
    '',
    '2. {{מצווה.מצווה_תפקיד}} {{מצווה.מצהיר}} בפנינו, ביום החתימה, כי זוהי {{מצווה.מצווה_תפקיד}} אחרונה והיחידה.',
    '',
    '3. {{מצווה.מצווה_תפקיד}} חתם בפנינו ובנוכחותינו על הצוואה, ואנו חתמנו אף אנו בנוכחותו ובנוכחות {{מצווה.מצווה_תפקיד}} ההדדית.',
    '',
    '4. במועד החתימה היה {{מצווה.מצווה_תפקיד}} בדעה {{מצווה.צלול}}, {{מצווה.כשיר}} משפטית, ולא ניכרה בו כל סימן ללחץ, השפעה בלתי הוגנת, או הטעיה.',
    '',
    '5. אין לנו כל טובת הנאה מהוראות צוואה זו, איננו מוטבים בה, ואיננו קרובי משפחה של {{מצווה.מצווה_תפקיד}} או של {{יורש.יורש_תפקיד}}.',
    '',
    'ולראיה באנו על החתום ביום {{תאריך_היום}}:',
    '',
    'עד 1: {{עד1.שם}}  __________________',
    '',
    'עד 2: {{עד2.שם}}  __________________',
  ].join('\n'),
}

/**
 * החזרת סעיפים שמתווספים אוטומטית בסוף המסמך לפי סוגו.
 *
 * אם המשתמשת כבר הוסיפה ידנית סעיף עם אותו templateId (למשל "SEC_W04"),
 * הסעיף האוטומטי לא יתווסף — למניעת כפילות בצוואות ישנות.
 */
export function getAutoAppendedSections(doc: Document): DocumentSection[] {
  const sections: DocumentSection[] = []
  const type: DocumentType = doc.type

  // ייפוי כוח: סעיף חלוקת סמכויות בראש
  const authorityClause = buildAuthorityClause(doc)
  if (authorityClause) sections.push(authorityClause)

  // צוואת יחיד: סעיף אישור עדים בסוף
  if (type === 'will-individual') {
    const alreadyHasWitnessManually = doc.sections.some(
      (s) => s.templateId === 'SEC_W04'
    )
    if (!alreadyHasWitnessManually) {
      sections.push(WITNESS_SECTION_WILL_INDIVIDUAL)
    }
  }

  return sections
}
