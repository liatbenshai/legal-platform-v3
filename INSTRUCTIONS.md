# מדריך הקמה - הכל מוכן, רק להעתיק

הכנתי לך את כל הקבצים מוכנים. את לא צריכה לכתוב או לערוך שום קוד. רק להעתיק קבצים למקומות הנכונים ולהריץ פקודות.

---

## שלב א: יצירת Supabase Project (5 דקות)

1. https://supabase.com/dashboard → **New project**
2. Name: `legal-platform-v3`
3. Region: **Frankfurt (eu-central-1)**
4. **Generate Password** → העתיקי לפנקס רשימות
5. המתיני 2-3 דקות עד שהפרויקט מוקם

לאחר ההקמה: **Settings → API**. העתיקי לפנקס שתי שורות:
- `Project URL` (משהו כמו `https://abcdefgh.supabase.co`)
- `anon public` key (מחרוזת ארוכה שמתחילה ב-`eyJ...`)

---

## שלב ב: יצירת GitHub Repository (2 דקות)

1. https://github.com/new
2. Repository name: `legal-platform-v3`
3. ✅ **Private**
4. ⛔ אל תסמני אף checkbox של initialization
5. **Create repository**

העתיקי את ה-URL של ה-repo לפנקס.

---

## שלב ג: יצירת פרויקט מקומי (5 דקות)

צרי תיקייה ריקה במחשב בשם `legal-platform-v3`, פתחי אותה ב-Cursor.

פתחי טרמינל ב-Cursor (Ctrl+`) והריצי:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

תקבלי 2-3 שאלות. תני **Enter** לכולן (תקבלי את ברירת המחדל).

אחרי שזה מסתיים, הריצי:

```bash
npm install @supabase/supabase-js @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities docx file-saver lucide-react @anthropic-ai/sdk clsx tailwind-merge zod
```

ואז:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @types/file-saver @types/node
```

---

## שלב ד: החלפת קבצים (5 דקות)

הורדתי לך 4 קבצים מוכנים. כל קובץ יש לו מקום שאליו הוא הולך.

### קובץ 1: `.env.local`

**יעד:** שורש הפרויקט (אותה רמה של `package.json`)

**זה הקובץ שצריך לערוך** כי הוא מכיל ערכים שמיוחדים לחשבון שלך:
1. צרי קובץ חדש בשם `.env.local` בשורש הפרויקט
2. העתיקי לתוכו את התוכן של הקובץ שהורדת
3. החליפי את `https://YOUR_PROJECT.supabase.co` ב-Project URL שלך מהפנקס
4. החליפי את `YOUR_ANON_KEY_HERE` ב-anon public key שלך מהפנקס
5. השאירי את `ANTHROPIC_API_KEY=` ריק לעת עתה

### קובץ 2: `layout.tsx`

**יעד:** `src/app/layout.tsx`

הקובץ הזה כבר קיים בפרויקט (Next.js יצר אותו). החליפי את התוכן שלו לגמרי בתוכן של הקובץ שהורדת.

### קובץ 3: `page.tsx`

**יעד:** `src/app/page.tsx`

גם הוא קיים כבר. החליפי את כל התוכן בזה שהורדת.

### קובץ 4: `supabase.ts`

**יעד:** `src/lib/db/supabase.ts`

הקובץ הזה **לא קיים** בפרויקט. צריך:
1. ליצור תיקיות חדשות: ב-`src/` ליצור תיקייה `lib`, ובתוכה תיקייה `db`
2. בתוך `src/lib/db/` ליצור קובץ חדש בשם `supabase.ts`
3. להעתיק לתוכו את התוכן של הקובץ שהורדת

---

## שלב ה: בדיקה שהכל עובד מקומית (1 דקה)

בטרמינל:

```bash
npm run dev
```

פתחי דפדפן: http://localhost:3000

את אמורה לראות את הכותרת "מערכת מסמכים משפטיים" מימין לשמאל בעברית.

אם זה עובד, סגרי את השרת עם **Ctrl+C**.

אם יש שגיאה, צלמי את המסך ושלחי לי.

---

## שלב ו: יצירת הטבלאות ב-Supabase (3 דקות)

1. כנסי ל-Supabase Dashboard של הפרויקט שלך
2. בתפריט הצדדי: **SQL Editor**
3. לחצי **New query**
4. פתחי את הקובץ `001_initial_schema.sql` שהורדת והעתיקי את **כל התוכן**
5. הדביקי ב-SQL Editor
6. לחצי **Run** (או Ctrl+Enter)

אמורה לקבל הודעה ירוקה "Success".

**וידוא:** בתפריט הצדדי לחצי **Table Editor**. את אמורה לראות חמש טבלאות.

---

## שלב ז: דחיפת הקוד ל-GitHub (3 דקות)

ב-Cursor, מצד ימין יש אייקון של ענפים (Source Control). לחצי עליו.

1. תראי את כל הקבצים החדשים. לחצי על **+** ליד "Changes" כדי לבחור Stage All.
2. בשורת הקלט למעלה, כתבי: `Initial scaffolding`
3. לחצי על הכפתור **Commit**
4. לחצי **Publish Branch**
5. בחרי `Private` כסוג הrepo
6. אם זה לא מוצא את הrepo הקיים, תני לו שם זהה: `legal-platform-v3`

לחילופין, אם זה לא עובד דרך הממשק, בטרמינל:

```bash
git remote add origin YOUR_GITHUB_REPO_URL
git add .
git commit -m "Initial scaffolding"
git branch -M main
git push -u origin main
```

החליפי `YOUR_GITHUB_REPO_URL` ב-URL מהפנקס.

---

## שלב ח: חיבור Vercel (3 דקות)

1. https://vercel.com → **Add New** → **Project**
2. תחת "Import Git Repository" תני לזהות את `legal-platform-v3`. אם לא רואה אותו, לחצי **Adjust GitHub App Permissions** ותני גישה ל-repo.
3. ליד `legal-platform-v3` לחצי **Import**
4. בדף ההגדרות, גלגלי למטה ל-**Environment Variables**. הוסיפי שלוש שורות:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL שלך מ-Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key שלך |
| `ANTHROPIC_API_KEY` | (השאירי ריק) |

5. לחצי **Deploy**
6. המתיני 2-3 דקות

תקבלי URL כמו `https://legal-platform-v3-abc.vercel.app`. פתחי אותו, אמורה לראות את אותו דף שראית מקומית.

---

## ✅ סיום

עברת בהצלחה את כל ההקמה אם:

- [ ] http://localhost:3000 מציג את הכותרת בעברית
- [ ] חמש טבלאות קיימות ב-Supabase Table Editor
- [ ] הקוד מופיע ב-GitHub (ב-Code tab)
- [ ] ה-URL של Vercel מציג את האפליקציה

עכשיו מוכנים להתחיל לעבוד עם Claude Code על המשימות הבאות. תגידי לי שסיימת ואני אכין לך את הפרומפט המדויק להתחלת המשימה הבאה.

---

## בעיות נפוצות

**npm install נכשל:** הריצי `npm cache clean --force` ואז שוב.

**Supabase SQL Error: relation already exists:** מחקי את כל הטבלאות ב-Table Editor והריצי את הסקריפט שוב.

**Vercel build נכשל:** ראי את ה-Build Logs ב-Vercel, צלמי את השגיאה ושלחי לי.

**Git push דורש password:** השתמשי ב-Personal Access Token מ-https://github.com/settings/tokens במקום סיסמה. או פשוט עבדי דרך הפאנל ב-Cursor.

**עברית לא מימין לשמאל:** בדקי שב-`layout.tsx` יש `<html lang="he" dir="rtl">`. אם לא, הקובץ לא הוחלף כראוי.
