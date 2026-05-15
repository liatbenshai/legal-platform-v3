# מפרט מערכת המגדר - גרסה 3

## הבעיה שמערכת זו פותרת

בייפוי כוח מתמשך משתתפים שניים עד שלושה אנשים: הממנה, מיופה הכוח, ולעיתים מיופה כוח חלופי. כל אחד יכול להיות זכר או נקבה. הניסוח של אותו רעיון משפטי משתנה לפי המגדרים. המערכת הקודמת ניסתה לטפל בזה עם 500 שורות של regex כללי, ולכן הופיעו טעויות כמו "אני, רחל לוי, ממנה את דוד כהן להיות מיופת הכוח שלי".

הפתרון: כל מילה מוטה מתויגת **למי היא שייכת**. המערכת יודעת מי כל אחד מהשחקנים ומה המגדר שלו, ובוחרת את ההטיה הנכונה לכל מילה.

---

## תחביר ה-Placeholders

כל placeholder עוטף ב-`{{ }}` ויכול להיות אחד משלושה סוגים:

### סוג 1: שדה של שחקן

`{{שחקן.שדה}}` - מחזיר נתון של אדם.

| Placeholder | תוצאה |
|-------------|-------|
| `{{ממנה.שם}}` | שם פרטי + משפחה |
| `{{ממנה.שם_פרטי}}` | שם פרטי בלבד |
| `{{ממנה.שם_משפחה}}` | שם משפחה בלבד |
| `{{ממנה.תז}}` | תעודת זהות |
| `{{ממנה.כתובת}}` | כתובת |
| `{{ממנה.עיר}}` | עיר |
| `{{ממנה.תאריך_לידה}}` | תאריך לידה |
| `{{ממנה.טלפון}}` | טלפון |
| `{{ממנה.אימייל}}` | אימייל |

### סוג 2: מילה מוטה לפי שחקן

`{{שחקן.מילה}}` - מחזיר את המילה מוטה לפי המגדר והמספר של השחקן.

| Placeholder | זכר יחיד | נקבה יחידה | מיופים מרובים |
|-------------|----------|------------|----------------|
| `{{ממנה.מצהיר}}` | מצהיר | מצהירה | מצהירים |
| `{{מיופה.ינהל}}` | ינהל | תנהל | ינהלו |
| `{{מיופה.רשאי}}` | רשאי | רשאית | רשאים |
| `{{מיופה.תפקידו}}` | תפקידו | תפקידה | תפקידם |

### סוג 3: משתנה גלובלי

`{{משתנה}}` (בלי נקודה) - מחזיר מתוך `document.variables`.

| Placeholder | דוגמה |
|-------------|-------|
| `{{תאריך_חתימה}}` | 15.5.2026 |
| `{{מקום_חתימה}}` | חיפה |
| `{{מספר_עדים}}` | שניים |

---

## רשימת שחקנים סטנדרטית

### ייפוי כוח מתמשך
- `ממנה` - יחיד תמיד
- `מיופה` - יחיד או רבים
- `מיופה_חלופי` - יחיד או רבים (אופציונלי)
- `עד1`, `עד2` - יחיד
- `עוד` - עורך הדין המאשר

### צוואה
- `מצווה` - יחיד (צוואת יחיד) או הדדי (אז יש `מצווה1` ו-`מצווה2`)
- `יורש` - מערך
- `מנהל_עיזבון`

### הסכם שכר טרחה
- `עוד` - עורך הדין
- `לקוח` - יחיד או רבים

---

## מילון המגדר

המילון יושב בקובץ `lib/engine/dictionary.ts`. כל ערך מכיל ארבע צורות.

```typescript
export interface InflectedWord {
  male: string         // זכר יחיד
  female: string       // נקבה יחידה
  plural: string       // רבים מעורב או זכרים בלבד
  plural_female?: string  // אופציונלי - רבות בלבד
}
```

### מילון ראשוני - ייפוי כוח מתמשך

```typescript
export const dictionary: Record<string, InflectedWord> = {
  // === התייחסות עצמית של הממנה ===
  'מצהיר': { male: 'מצהיר', female: 'מצהירה', plural: 'מצהירים' },
  'ממנה_פעולה': { male: 'ממנה', female: 'ממנה', plural: 'ממנים' },
  'מבטל': { male: 'מבטל', female: 'מבטלת', plural: 'מבטלים' },
  'מאשר': { male: 'מאשר', female: 'מאשרת', plural: 'מאשרים' },
  'חותם': { male: 'חותם', female: 'חותמת', plural: 'חותמים' },
  'מודע': { male: 'מודע', female: 'מודעת', plural: 'מודעים' },
  'בריא': { male: 'בריא', female: 'בריאה', plural: 'בריאים' },
  'צלול': { male: 'צלול', female: 'צלולה', plural: 'צלולים' },
  'כשיר': { male: 'כשיר', female: 'כשירה', plural: 'כשירים' },
  'יודע': { male: 'יודע', female: 'יודעת', plural: 'יודעים' },
  'מבין': { male: 'מבין', female: 'מבינה', plural: 'מבינים' },
  'רוצה': { male: 'רוצה', female: 'רוצה', plural: 'רוצים' },
  'מסכים': { male: 'מסכים', female: 'מסכימה', plural: 'מסכימים' },
  'יליד': { male: 'יליד', female: 'ילידת', plural: 'ילידי' },
  'תושב': { male: 'תושב', female: 'תושבת', plural: 'תושבי' },
  
  // === שמות תפקיד ===
  'מיופה_כוח': { male: 'מיופה הכוח', female: 'מיופת הכוח', plural: 'מיופי הכוח' },
  'מיופה_חלופי': { male: 'מיופה כוח חלופי', female: 'מיופת כוח חלופית', plural: 'מיופי כוח חלופיים' },
  'הממנה': { male: 'הממנה', female: 'הממנה', plural: 'הממנים' },
  'אפוטרופוס': { male: 'אפוטרופוס', female: 'אפוטרופסית', plural: 'אפוטרופסים' },
  
  // === פעלים בעתיד (מיופה הכוח עתיד לעשות) ===
  'יפעל': { male: 'יפעל', female: 'תפעל', plural: 'יפעלו' },
  'ינהל': { male: 'ינהל', female: 'תנהל', plural: 'ינהלו' },
  'יטפל': { male: 'יטפל', female: 'תטפל', plural: 'יטפלו' },
  'יחליט': { male: 'יחליט', female: 'תחליט', plural: 'יחליטו' },
  'יבחר': { male: 'יבחר', female: 'תבחר', plural: 'יבחרו' },
  'ימכור': { male: 'ימכור', female: 'תמכור', plural: 'ימכרו' },
  'יקנה': { male: 'יקנה', female: 'תקנה', plural: 'יקנו' },
  'יקבל': { male: 'יקבל', female: 'תקבל', plural: 'יקבלו' },
  'ייתן': { male: 'ייתן', female: 'תיתן', plural: 'ייתנו' },
  'יחתום': { male: 'יחתום', female: 'תחתום', plural: 'יחתמו' },
  'יבצע': { male: 'יבצע', female: 'תבצע', plural: 'יבצעו' },
  'יודיע': { male: 'יודיע', female: 'תודיע', plural: 'יודיעו' },
  'יגיש': { male: 'יגיש', female: 'תגיש', plural: 'יגישו' },
  'יפנה': { male: 'יפנה', female: 'תפנה', plural: 'יפנו' },
  'ידאג': { male: 'ידאג', female: 'תדאג', plural: 'ידאגו' },
  'ישמור': { male: 'ישמור', female: 'תשמור', plural: 'ישמרו' },
  'יוכל': { male: 'יוכל', female: 'תוכל', plural: 'יוכלו' },
  'ירצה': { male: 'ירצה', female: 'תרצה', plural: 'ירצו' },
  'יהיה': { male: 'יהיה', female: 'תהיה', plural: 'יהיו' },
  'יישא': { male: 'יישא', female: 'תישא', plural: 'יישאו' },
  'יסרב': { male: 'יסרב', female: 'תסרב', plural: 'יסרבו' },
  'ידווח': { male: 'ידווח', female: 'תדווח', plural: 'ידווחו' },
  'יוודא': { male: 'יוודא', female: 'תוודא', plural: 'יוודאו' },
  'יקפיד': { male: 'יקפיד', female: 'תקפיד', plural: 'יקפידו' },
  'יקיים': { male: 'יקיים', female: 'תקיים', plural: 'יקיימו' },
  'ייצג': { male: 'ייצג', female: 'תייצג', plural: 'ייצגו' },
  'יתייעץ': { male: 'יתייעץ', female: 'תתייעץ', plural: 'יתייעצו' },
  
  // === תארים ===
  'רשאי': { male: 'רשאי', female: 'רשאית', plural: 'רשאים' },
  'אחראי': { male: 'אחראי', female: 'אחראית', plural: 'אחראים' },
  'מוסמך': { male: 'מוסמך', female: 'מוסמכת', plural: 'מוסמכים' },
  'מחויב': { male: 'מחויב', female: 'מחויבת', plural: 'מחויבים' },
  'זכאי': { male: 'זכאי', female: 'זכאית', plural: 'זכאים' },
  'חייב': { male: 'חייב', female: 'חייבת', plural: 'חייבים' },
  'יכול': { male: 'יכול', female: 'יכולה', plural: 'יכולים' },
  'מעוניין': { male: 'מעוניין', female: 'מעוניינת', plural: 'מעוניינים' },
  'ראוי': { male: 'ראוי', female: 'ראויה', plural: 'ראויים' },
  'נאמן': { male: 'נאמן', female: 'נאמנה', plural: 'נאמנים' },
  'מתאים': { male: 'מתאים', female: 'מתאימה', plural: 'מתאימים' },
  
  // === כינויי שייכות בגוף ראשון (של הממנה) ===
  // אלה לא משתנים בין זכר לנקבה, רק ביחיד-רבים
  'שלי': { male: 'שלי', female: 'שלי', plural: 'שלנו' },
  'רכושי': { male: 'רכושי', female: 'רכושי', plural: 'רכושנו' },
  'ענייני': { male: 'ענייני', female: 'ענייני', plural: 'ענייננו' },
  'נכסיי': { male: 'נכסיי', female: 'נכסיי', plural: 'נכסינו' },
  'כספיי': { male: 'כספיי', female: 'כספיי', plural: 'כספינו' },
  'חשבונותיי': { male: 'חשבונותיי', female: 'חשבונותיי', plural: 'חשבונותינו' },
  'ביתי': { male: 'ביתי', female: 'ביתי', plural: 'ביתנו' },
  'רצוני': { male: 'רצוני', female: 'רצוני', plural: 'רצוננו' },
  'בריאותי': { male: 'בריאותי', female: 'בריאותי', plural: 'בריאותנו' },
  
  // === כינויי שייכות בגוף שלישי (של מיופה הכוח) ===
  // אלה כן משתנים בין זכר לנקבה
  'תפקידו': { male: 'תפקידו', female: 'תפקידה', plural: 'תפקידם' },
  'שמו': { male: 'שמו', female: 'שמה', plural: 'שמם' },
  'אחריותו': { male: 'אחריותו', female: 'אחריותה', plural: 'אחריותם' },
  'סמכותו': { male: 'סמכותו', female: 'סמכותה', plural: 'סמכותם' },
  'סמכויותיו': { male: 'סמכויותיו', female: 'סמכויותיה', plural: 'סמכויותיהם' },
  'שיקול_דעתו': { male: 'שיקול דעתו', female: 'שיקול דעתה', plural: 'שיקול דעתם' },
  'עיניו': { male: 'עיניו', female: 'עיניה', plural: 'עיניהם' },
  'חתימתו': { male: 'חתימתו', female: 'חתימתה', plural: 'חתימתם' },
  'הסכמתו': { male: 'הסכמתו', female: 'הסכמתה', plural: 'הסכמתם' },
  'בשמו': { male: 'בשמו', female: 'בשמה', plural: 'בשמם' },
  'במקומו': { male: 'במקומו', female: 'במקומה', plural: 'במקומם' },
  'עבורו': { male: 'עבורו', female: 'עבורה', plural: 'עבורם' },
  'בעניינו': { male: 'בעניינו', female: 'בעניינה', plural: 'בעניינם' },
  
  // === כינויי גוף ===
  'הוא': { male: 'הוא', female: 'היא', plural: 'הם' },
  'אותו': { male: 'אותו', female: 'אותה', plural: 'אותם' },
  'לו': { male: 'לו', female: 'לה', plural: 'להם' },
  'ממנו': { male: 'ממנו', female: 'ממנה', plural: 'מהם' },
  'אצלו': { male: 'אצלו', female: 'אצלה', plural: 'אצלם' },
  'עליו': { male: 'עליו', female: 'עליה', plural: 'עליהם' },
  
  // === ביטויים משפטיים ===
  'הצהיר': { male: 'הצהיר', female: 'הצהירה', plural: 'הצהירו' },
  'התחייב': { male: 'התחייב', female: 'התחייבה', plural: 'התחייבו' },
  'הסכים': { male: 'הסכים', female: 'הסכימה', plural: 'הסכימו' },
  'אישר': { male: 'אישר', female: 'אישרה', plural: 'אישרו' },
  'קיבל': { male: 'קיבל', female: 'קיבלה', plural: 'קיבלו' },
  'הופיע': { male: 'הופיע', female: 'הופיעה', plural: 'הופיעו' },
}
```

המילון לעיל מכיל כ-90 ערכים. זה מספיק ל-95% מהמסמכים. הוספת ערך חדשה היא שורה אחת בקובץ אחד.

---

## מנוע ה-Rendering

קוד מלא ב-`lib/engine/renderer.ts`. הליבה היא פונקציה אחת:

```typescript
import { dictionary } from './dictionary'
import type { Document, Person, DocumentActor } from '@/lib/types'

export interface RenderContext {
  document: Document
  persons: Person[]  // כל הפרסונים של הלקוח
}

/**
 * מטפל ב-placeholder יחיד
 */
function resolvePlaceholder(
  expr: string,
  ctx: RenderContext
): string {
  // משתנה גלובלי - אין נקודה
  if (!expr.includes('.')) {
    return ctx.document.variables[expr] ?? `{{${expr}}}`
  }
  
  const [actorRole, ...rest] = expr.split('.')
  const property = rest.join('.')
  
  // מאתר את השחקן במסמך
  const actor = ctx.document.actors.find(a => a.role === actorRole)
  if (!actor) return `{{${expr}}}`
  
  // מאתר את האנשים בתפקיד הזה
  const persons = actor.personIds
    .map(id => ctx.persons.find(p => p.id === id))
    .filter((p): p is Person => p !== undefined)
  
  if (persons.length === 0) return `{{${expr}}}`
  
  // קביעת המגדר והמספר של השחקן
  const isPlural = persons.length > 1
  const allFemale = persons.every(p => p.gender === 'female')
  
  // טיפול בשדות אישיים
  switch (property) {
    case 'שם':
      return persons.map(p => `${p.firstName} ${p.lastName}`).join(' ו-')
    case 'שם_פרטי':
      return persons.map(p => p.firstName).join(' ו-')
    case 'שם_משפחה':
      return persons.map(p => p.lastName).join(' ו-')
    case 'תז':
    case 'ת.ז.':
      return persons.map(p => p.idNumber).join(', ')
    case 'כתובת':
      return persons.map(p => p.address).join(', ')
    case 'עיר':
      return persons.map(p => p.city).join(', ')
    case 'תאריך_לידה':
      return persons.map(p => p.birthDate?.toLocaleDateString('he-IL') ?? '').join(', ')
    case 'טלפון':
      return persons.map(p => p.phone ?? '').join(', ')
    case 'אימייל':
      return persons.map(p => p.email ?? '').join(', ')
  }
  
  // טיפול במילה מוטה מהמילון
  const word = dictionary[property]
  if (!word) {
    // המילה לא במילון - מחזירים אותה כמו שהיא
    return property
  }
  
  if (isPlural) {
    return word.plural_female && allFemale ? word.plural_female : word.plural
  }
  if (allFemale) return word.female
  return word.male
}

/**
 * רנדור מסמך שלם
 */
export function renderDocument(ctx: RenderContext): RenderedSection[] {
  return ctx.document.sections
    .sort((a, b) => a.order - b.order)
    .map(section => ({
      id: section.id,
      title: renderText(section.title, ctx),
      content: renderText(section.content, ctx),
      level: section.level,
      order: section.order
    }))
}

/**
 * רנדור טקסט יחיד
 */
export function renderText(text: string, ctx: RenderContext): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
    return resolvePlaceholder(expr.trim(), ctx)
  })
}

export interface RenderedSection {
  id: string
  title: string
  content: string
  level: 'main' | 'sub' | 'sub-sub'
  order: number
}
```

זה הכל. מנוע המגדר המלא הוא 70 שורות, לעומת 1,664 קודם.

---

## דוגמאות שימוש

### תבנית של סעיף בודד

```
{{מיופה.מיופה_כוח}} {{מיופה.יהיה}} {{מיופה.רשאי}} לפעול בשמי בכל הקשור 
לניהול {{ממנה.רכושי}}, לרבות מכירה, השכרה, רכישה והשקעות. 
{{מיופה.הוא}} {{מיופה.יפעל}} לפי {{מיופה.שיקול_דעתו}} ויהיה {{מיופה.אחראי}} 
לדווח לי על פעולותיו.
```

### תוצאות לפי קונפיגורציות

**ממנה זכר, מיופה כוח אישה:**
> מיופת הכוח תהיה רשאית לפעול בשמי בכל הקשור לניהול רכושי, לרבות מכירה, השכרה, רכישה והשקעות. היא תפעל לפי שיקול דעתה ותהיה אחראית לדווח לי על פעולותיה.

**ממנה אישה, שני מיופי כוח:**
> מיופי הכוח יהיו רשאים לפעול בשמי בכל הקשור לניהול רכושי, לרבות מכירה, השכרה, רכישה והשקעות. הם יפעלו לפי שיקול דעתם ויהיו אחראים לדווח לי על פעולותיהם.

---

## כללי כתיבת תבניות

ירון יקבל מסמך הדרכה קצר ובו הכללים:

**אחד.** כל מילה שמשתנה לפי מגדר חייבת להיות placeholder. אל תכתוב "רשאי/ת", כתוב `{{מיופה.רשאי}}`.

**שתיים.** כל הפנייה לאדם היא placeholder. אל תכתוב "ירון בן-שי", כתוב `{{ממנה.שם}}`.

**שלוש.** אם מילה לא במילון, יש שתי אפשרויות. או להוסיף אותה למילון (קל), או לכתוב אותה רגיל בטקסט (אבל אז היא לא תוטה).

**ארבע.** placeholder חייב בדיוק שני סוגריים מעוקלים: `{{ }}`. בלי רווחים מסביב לנקודה: `{{ממנה.שם}}` נכון, `{{ ממנה . שם }}` לא.

**חמש.** שם השחקן צריך להתאים בדיוק לשם בקונפיגורציה: `ממנה`, `מיופה`, `מיופה_חלופי`. אם תכתוב `מייפה` או `הממנה`, זה לא יעבוד.

---

## טיפול במקרים מורכבים

### מילה לא במילון

הפתרון: המערכת מציגה אזהרה בעת עריכת התבנית. "המילה X מופיעה בתוך placeholder אבל אינה במילון. רוצה להוסיף אותה?" וטופס קצר של ארבעה שדות.

### מיופים מרובים ממגדרים שונים

אם יש שני מיופי כוח, אחד גבר ואחת אישה, בעברית נכון להשתמש בריבוי זכר. הקוד עושה זאת אוטומטית: `isPlural=true` מחזיר את `plural` שהוא בזכר.

### צוואה הדדית

יש שני מצווים. נגדיר שני שחקנים: `מצווה1` ו-`מצווה2`. או לחילופין, שחקן אחד `מצווים` עם שני personIds. שתי הגישות יעבדו.

### עדים

עד1 ועד2 הם שחקנים נפרדים. כל אחד עם שם וגוף ראשון. בסעיף העדים:

```
אנו, {{עד1.שם}} ת.ז. {{עד1.תז}} ו-{{עד2.שם}} ת.ז. {{עד2.תז}}, 
מצהירים בזאת...
```

---

## בדיקות אוטומטיות

צריך בדיקות שמוודאות שהמנוע עובד תמיד אחרי שינויים. הקובץ `lib/engine/renderer.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { renderText } from './renderer'

const samplePersons = [
  { id: 'p1', firstName: 'דוד', lastName: 'כהן', gender: 'male' as const, ... },
  { id: 'p2', firstName: 'שרה', lastName: 'לוי', gender: 'female' as const, ... },
]

describe('renderText - basic gender', () => {
  it('זכר יחיד', () => {
    const ctx = makeCtx({
      actors: [{ role: 'מיופה', personIds: ['p1'] }],
      persons: samplePersons,
    })
    expect(renderText('{{מיופה.רשאי}}', ctx)).toBe('רשאי')
    expect(renderText('{{מיופה.יפעל}}', ctx)).toBe('יפעל')
    expect(renderText('{{מיופה.תפקידו}}', ctx)).toBe('תפקידו')
  })
  
  it('נקבה יחידה', () => {
    const ctx = makeCtx({
      actors: [{ role: 'מיופה', personIds: ['p2'] }],
      persons: samplePersons,
    })
    expect(renderText('{{מיופה.רשאי}}', ctx)).toBe('רשאית')
    expect(renderText('{{מיופה.יפעל}}', ctx)).toBe('תפעל')
    expect(renderText('{{מיופה.תפקידו}}', ctx)).toBe('תפקידה')
  })
  
  it('רבים', () => {
    const ctx = makeCtx({
      actors: [{ role: 'מיופה', personIds: ['p1', 'p2'] }],
      persons: samplePersons,
    })
    expect(renderText('{{מיופה.רשאי}}', ctx)).toBe('רשאים')
    expect(renderText('{{מיופה.יפעל}}', ctx)).toBe('יפעלו')
    expect(renderText('{{מיופה.תפקידו}}', ctx)).toBe('תפקידם')
  })
})
```

כל סעיף חדש בספרייה ייבדק אוטומטית בכל הקומבינציות.
