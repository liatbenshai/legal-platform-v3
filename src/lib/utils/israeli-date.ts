/**
 * עזרים לעבודה עם תאריכים בפורמט ישראלי (יום/חודש/שנה).
 *
 * הפורמט הנתמך בקלט:
 *   - 15/05/1980
 *   - 15.05.1980
 *   - 15-05-1980
 *   - 5/5/80   (שנה דו-ספרתית: <30 → 2000s, >=30 → 1900s)
 *
 * הפורמט הקבוע בתצוגה: DD/MM/YYYY עם אפסים מובילים.
 */

/** ממיר מחרוזת בפורמט ישראלי ל-Date. מחזיר null אם הפורמט לא תקין. */
export function parseIsraeliDate(input: string): Date | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const match = trimmed.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/)
  if (!match) return null

  const day = parseInt(match[1], 10)
  const month = parseInt(match[2], 10) - 1 // JS Date החודשים 0-מבוססים
  let year = parseInt(match[3], 10)

  // טיפול בשנה דו-ספרתית
  if (year < 100) {
    year += year < 30 ? 2000 : 1900
  }

  if (day < 1 || day > 31) return null
  if (month < 0 || month > 11) return null
  if (year < 1900 || year > 2100) return null

  const date = new Date(year, month, day)
  // וידוא שהתאריך לא "גלש" (למשל 31/02 → 03/03)
  if (
    date.getDate() !== day ||
    date.getMonth() !== month ||
    date.getFullYear() !== year
  ) {
    return null
  }
  return date
}

/** ממיר Date למחרוזת DD/MM/YYYY. */
export function formatIsraeliDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * עוטף ערך שייתכן שהוא מחרוזת ISO (לאחר deserialization מ-JSON)
 * וממיר ל-Date אם צריך. מחזיר undefined אם הקלט ריק.
 */
export function ensureDate(value: Date | string | null | undefined): Date | undefined {
  if (!value) return undefined
  if (value instanceof Date) return value
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return undefined
  return d
}
