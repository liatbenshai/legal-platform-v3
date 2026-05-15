# מסמך ארכיטקטורה - מערכת מסמכים משפטיים גרסה 3

## עקרונות יסוד

המערכת נבנית סביב חמישה עקרונות שאסור לסטות מהם:

**אנשים נשמרים פעם אחת.** כל אדם במערכת (ממנה, מיופה כוח, יורש, בן זוג) מוזן פעם אחת ומשמש בכל מסמך שבו הוא מופיע.

**מסמך הוא צירוף של שחקנים, משתנים וסעיפים.** המסמך עצמו לא מכיל טקסט סופי, אלא תבניות שמתורגמות בהפקה.

**הטיית מגדר היא תכונה של הענקת תפקיד, לא של הטקסט.** כשמיופה הכוח הוא אישה, המילה "ינהל" הופכת ל"תנהל" אוטומטית כי היא מתויגת `{{מיופה.ינהל}}`.

**ספריית הסעיפים מופרדת מהמסמכים.** סעיפים נשמרים כתבניות, מסמכים מצביעים אליהן. שינוי בסעיף ספרייה לא משנה מסמכים קיימים.

**הלקוח הוא ישות עצמאית.** מסמכים שייכים ללקוח. ייפוי כוח, צוואה והסכם ממון של אותה משפחה נמצאים תחת אותו תיק.

---

## מבנה תיקיות

```
legal-platform-v3/
├── app/                          # Next.js routes
│   ├── (auth)/                   # התחברות, הרשמה
│   ├── dashboard/                # מסך ראשי
│   ├── clients/                  # ניהול לקוחות
│   │   ├── page.tsx              # רשימת לקוחות
│   │   └── [id]/                 # תיק לקוח ספציפי
│   │       ├── page.tsx          # פרטי לקוח + מסמכים
│   │       └── documents/        
│   │           └── [docId]/      # עורך מסמך
│   ├── library/                  # ספריית סעיפים
│   └── api/                      # API routes
│
├── components/
│   ├── editor/                   # רכיבי עורך מסמכים
│   │   ├── ActorsPanel.tsx       # פאנל שחקנים
│   │   ├── SectionsList.tsx      # רשימת סעיפים
│   │   ├── SectionEditor.tsx     # עריכת סעיף בודד
│   │   ├── VariablesPanel.tsx    # משתנים
│   │   └── PreviewPane.tsx       # תצוגה מקדימה
│   ├── library/                  # רכיבי ספריית סעיפים
│   │   ├── SectionPicker.tsx     # בחירת סעיפים מהספרייה
│   │   ├── VariantSelector.tsx   # בחירת וריאציה
│   │   └── TemplateEditor.tsx    # יצירה/עריכת תבנית
│   ├── person/                   # רכיבי טיפול באנשים
│   │   ├── PersonForm.tsx        # טופס פרטי אדם
│   │   └── PersonPicker.tsx      # בחירה מתוך לקוח קיים
│   ├── export/                   # ייצוא
│   │   └── WordExporter.tsx      # ייצוא Word אחד לכל סוגי המסמכים
│   └── ui/                       # רכיבי UI כלליים (shadcn)
│
├── lib/
│   ├── engine/                   # מנוע התבניות
│   │   ├── dictionary.ts         # מילון המגדר
│   │   ├── renderer.ts           # מנוע ההחלפה
│   │   ├── validators.ts         # בדיקות תקינות
│   │   └── conflicts.ts          # זיהוי קונפליקטים
│   ├── types/                    # הגדרות TypeScript
│   │   ├── person.ts
│   │   ├── client.ts
│   │   ├── document.ts
│   │   └── template.ts
│   ├── db/                       # שכבת Supabase
│   │   ├── clients.ts
│   │   ├── documents.ts
│   │   ├── persons.ts
│   │   └── templates.ts
│   ├── ai/                       # שילוב Claude
│   │   └── improve.ts            # שיפור ניסוח
│   └── utils/
│
├── templates/                    # ספריית סעיפים ראשונית (seed)
│   ├── poa-property/             # סעיפי ייפוי כוח רכושי
│   ├── poa-personal/             # סעיפי ייפוי כוח אישי
│   ├── poa-medical/              # סעיפי ייפוי כוח רפואי
│   └── poa-common/               # סעיפים משותפים
│
└── supabase/
    └── migrations/
```

---

## סכמת בסיס נתונים (Supabase)

### טבלת `users`
משתמשי המערכת (עורכי דין). Supabase Auth מטפל באימות.

### טבלת `clients`
תיקי לקוחות.

| שדה | סוג | הערה |
|------|-----|------|
| id | uuid | PK |
| user_id | uuid | FK ל-users |
| display_name | text | "משפחת כהן" |
| notes | text | הערות חופשיות |
| created_at | timestamp | |
| updated_at | timestamp | |

### טבלת `persons`
כל אדם שמופיע במסמכי הלקוח.

| שדה | סוג | הערה |
|------|-----|------|
| id | uuid | PK |
| client_id | uuid | FK ל-clients |
| first_name | text | |
| last_name | text | |
| id_number | text | ת.ז. |
| gender | text | 'male' \| 'female' |
| birth_date | date | אופציונלי |
| address | text | |
| city | text | |
| phone | text | |
| email | text | |
| created_at | timestamp | |

### טבלת `documents`
מסמכים שעורך הדין יוצר.

| שדה | סוג | הערה |
|------|-----|------|
| id | uuid | PK |
| client_id | uuid | FK ל-clients |
| user_id | uuid | FK ל-users (יוצר) |
| type | text | 'poa-property', 'poa-personal' וכו' |
| title | text | "ייפוי כוח מתמשך - דוד כהן" |
| status | text | 'draft', 'review', 'signed' |
| actors | jsonb | מערך שחקנים |
| variables | jsonb | משתנים גלובליים של המסמך |
| sections | jsonb | מערך סעיפים |
| created_at | timestamp | |
| updated_at | timestamp | |

### טבלת `document_versions`
שמירת היסטוריה.

| שדה | סוג | הערה |
|------|-----|------|
| id | uuid | PK |
| document_id | uuid | FK ל-documents |
| version_number | int | |
| snapshot | jsonb | תוכן המסמך המלא |
| created_at | timestamp | |
| created_by | uuid | FK ל-users |

### טבלת `section_templates`
ספריית סעיפים מערכתית.

| שדה | סוג | הערה |
|------|-----|------|
| id | uuid | PK |
| category | text | 'poa-property', 'poa-personal' וכו' |
| document_types | text[] | באילו סוגי מסמכים השתמשים |
| title | text | |
| description | text | |
| variants | jsonb | מערך וריאציות |
| required_actors | text[] | ['ממנה', 'מיופה'] |
| legal_basis | text | חוק והפניה |
| is_required | boolean | חובה במסמך |
| conflicts_with | uuid[] | מערך IDs של תבניות סותרות |
| tags | text[] | |
| is_system | boolean | תבנית מערכת (true) או של משתמש (false) |
| user_id | uuid | אם של משתמש |
| usage_count | int | סטטיסטיקת שימוש |

### טבלת `user_section_templates`
ספרייה אישית של ירון.

מבנה זהה ל-section_templates אבל `is_system=false` ו-`user_id` מאוכלס.

---

## מודלים בקוד (TypeScript)

```typescript
// person.ts
export type Gender = 'male' | 'female'

export interface Person {
  id: string
  clientId: string
  firstName: string
  lastName: string
  idNumber: string
  gender: Gender
  birthDate?: Date
  address: string
  city: string
  phone?: string
  email?: string
}

// document.ts
export type DocumentType =
  | 'poa-property'    // ייפוי כוח רכושי
  | 'poa-personal'    // ייפוי כוח אישי
  | 'poa-medical'     // ייפוי כוח רפואי
  | 'will-individual' // צוואת יחיד
  | 'will-mutual'     // צוואה הדדית
  | 'prenup'          // הסכם ממון
  | 'divorce'         // הסכם גירושין
  | 'partition'       // פירוק שיתוף
  | 'fee-agreement'   // הסכם שכר טרחה

export interface DocumentActor {
  role: ActorRole              // 'ממנה', 'מיופה' וכו'
  personIds: string[]          // מערך - לתמיכה במיופים מרובים
  customLabel?: string         // אופציה לשם תפקיד מותאם
}

export type ActorRole =
  | 'ממנה' | 'מיופה' | 'מיופה_חלופי'
  | 'מצווה' | 'יורש' | 'מנהל_עיזבון'
  | 'בעל' | 'אישה' | 'ילד'
  | 'תובע' | 'נתבע'
  | 'עד1' | 'עד2'

export interface DocumentSection {
  id: string
  order: number
  templateId?: string          // אם נלקח מהספרייה
  title: string
  content: string              // עם placeholders
  variant?: string
  level: 'main' | 'sub' | 'sub-sub'
  variables?: Record<string, string>  // משתנים ספציפיים לסעיף
}

export interface Document {
  id: string
  clientId: string
  userId: string
  type: DocumentType
  title: string
  status: 'draft' | 'review' | 'signed'
  actors: DocumentActor[]
  variables: Record<string, string>   // משתנים גלובליים
  sections: DocumentSection[]
  createdAt: Date
  updatedAt: Date
}
```

---

## זרימת מידע

### יצירת מסמך חדש

```
1. ירון נכנס לתיק לקוח (משפחת כהן)
2. לוחץ "מסמך חדש" → בוחר סוג (ייפוי כוח רכושי)
3. מסך הגדרת שחקנים נפתח
   - ממנה: בוחר מ-Person picker (דוד כהן כבר קיים בלקוח)
   - מיופה כוח: בוחר את שרה כהן או יוצר חדש
   - מיופה כוח חלופי: אופציונלי
4. מסך עריכת סעיפים נפתח
   - בצד שמאל: ספריית סעיפים מסוננת לפי סוג + שחקנים נדרשים
   - באמצע: רשימת הסעיפים שכבר נבחרו
   - בצד ימין: תצוגה מקדימה של המסמך עם השמות והמגדרים הנכונים
5. ירון מוסיף סעיפים, בוחר וריאציות, עורך
6. כל שינוי נשמר אוטומטית ל-Supabase
7. כשגומר, לוחץ "ייצוא לוורד"
```

### תהליך ה-Rendering

כשמציגים את המסמך או מייצאים אותו:

```
1. טוען את המסמך מ-Supabase
2. טוען את כל הפרסונים של הלקוח
3. עבור כל סעיף:
   3.1. מאתר את כל ה-{{...}} בטקסט
   3.2. עבור כל placeholder:
        - אם זה {{שחקן.שדה}}: מאתר את ה-Person של השחקן, מחזיר את השדה
        - אם זה {{שחקן.מילה}}: מאתר את ה-Person, מחזיר את הטיית המילה לפי המגדר
        - אם זה {{משתנה}}: מחזיר מתוך document.variables
4. מציג/מייצא את הטקסט הסופי
```

---

## עקרון "אין מצב סודי"

כל הלוגיקה גלויה ובדיקה. אסור:

- פונקציות `replace` ענקיות עם מאות regex
- "תיקונים מיוחדים" שמסתירים תקלות בלוגיקה הראשית  
- שתי מערכות מקבילות לאותה בעיה
- localStorage **וגם** Supabase

המערכת תמיד נשענת על אותם רכיבים: מילון אחד, מנוע אחד, מקור נתונים אחד.

---

## תכונות שלב 1 (MVP לייפוי כוח)

חובה:
- ניהול תיקי לקוחות בסיסי
- יצירת מסמך ייפוי כוח עם שחקנים
- ספריית סעיפים מסודרת (40-60 סעיפים)
- מנוע מגדר עם מילון
- בחירת וריאציות לסעיפים
- ייצוא לוורד עם עיצוב נקי
- שמירה אוטומטית

לא בשלב 1:
- בדיקת קונפליקטים אוטומטית (שלב 2)
- שילוב Claude לשיפור ניסוח (שלב 2)
- היסטוריית גרסאות (שלב 2)
- ספרייה אישית של ירון (שלב 2)
- ייפוי כוח אישי ורפואי (שלב 2)

---

## תכונות שלב 2

- ייפוי כוח אישי ורפואי
- היסטוריית גרסאות
- שילוב Claude לטיוב ניסוחים
- ספרייה אישית של ירון
- צ'קליסט תיקוף לפני הפקה
- בדיקת קונפליקטים

## תכונות שלב 3

- צוואות (יחיד והדדית)
- הסכם ממון
- הסכם גירושין
- פירוק שיתוף
- מחשבון יורשים על פי דין
- מחשבון איזון משאבים
- שאלון לקוח טרום פגישה
