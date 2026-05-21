import type { DocumentType } from '@/lib/types'

/**
 * אופן פעולת מיופי הכוח כאשר יש יותר מאחד בתחום נתון.
 */
export type Jointness = 'separate' | 'joint' | 'consent'

export const JOINTNESS_OPTIONS: Array<{
  value: Jointness
  label: string
  /** הניסוח שיופיע בגוף המסמך */
  clauseText: string
}> = [
  {
    value: 'separate',
    label: 'ביחד או לחוד',
    clauseText: 'מיופי הכוח רשאים לפעול ביחד או לחוד',
  },
  {
    value: 'joint',
    label: 'במשותף',
    clauseText: 'מיופי הכוח חייבים לפעול במשותף',
  },
  {
    value: 'consent',
    label: 'בהסכמה',
    clauseText: 'מיופי הכוח חייבים לפעול בהסכמה הדדית',
  },
]

/**
 * חלוקת סמכויות לתחום מסוים — אילו מיופי כוח אחראים, ובאיזה אופן.
 * attorneyIndices מתייחס לסדר ב-actors[role='מיופה'].persons.
 */
export interface DomainScope {
  domain: DocumentType // 'poa-property' | 'poa-personal' | 'poa-medical'
  attorneyIndices: number[]
  jointness?: Jointness
}

export interface AuthorityConfig {
  scopes: DomainScope[]
}

/** המפתח שבו נשמרת התצורה ב-document.variables */
export const AUTHORITY_KEY = '__authority_json'

export function parseAuthority(
  variables: Record<string, string>
): AuthorityConfig {
  const raw = variables[AUTHORITY_KEY]
  if (!raw) return { scopes: [] }
  try {
    const parsed = JSON.parse(raw) as Partial<AuthorityConfig>
    return { scopes: Array.isArray(parsed.scopes) ? parsed.scopes : [] }
  } catch {
    return { scopes: [] }
  }
}

export function serializeAuthority(config: AuthorityConfig): string {
  return JSON.stringify(config)
}

/** ניסוח עברי לתחום בלשון רבים (לשימוש בסעיפים: "בעניינים רכושיים") */
export const DOMAIN_PHRASE_PLURAL: Record<string, string> = {
  'poa-property': 'רכושיים',
  'poa-personal': 'אישיים',
  'poa-medical': 'רפואיים',
}

/** תווית קצרה לתחום (לשימוש ב-UI: "רכושי", "אישי", "רפואי") */
export const DOMAIN_LABEL: Record<string, string> = {
  'poa-property': 'רכושי',
  'poa-personal': 'אישי',
  'poa-medical': 'רפואי',
}

/** ניקוי scopes מאינדקסים שכבר לא תקפים (לאחר הסרת מיופה כוח) */
export function cleanAuthority(
  config: AuthorityConfig,
  attorneyCount: number
): AuthorityConfig {
  return {
    scopes: config.scopes
      .map((s) => ({
        ...s,
        attorneyIndices: s.attorneyIndices.filter(
          (i) => i >= 0 && i < attorneyCount
        ),
      }))
      .filter((s) => s.attorneyIndices.length > 0),
  }
}
