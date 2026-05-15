# מדריך הקמת הפרויקט - צעד אחרי צעד

מדריך זה לוקח אותך מאפס עד לפרויקט עובד שמוכן לעבודה עם Cursor. עוקבים לפי הסדר. אל תדלגי.

הערכת זמן: 45-60 דקות לכל התהליך.

---

## הכנה לפני שמתחילים

הכיני בצד פתוחים:
- חלון דפדפן ראשי (כרום)
- מסך פנקס רשימות פתוח לשמירת מפתחות ו-URLs
- Cursor פתוח

הכיני שמות:
- שם הפרויקט באנגלית: `legal-platform-v3` (מומלץ)
- שם הפרויקט בעברית לתצוגה: "מערכת מסמכים משפטיים"

---

## שלב 1: יצירת Supabase Project (10 דקות)

### 1.1 התחברות

1. כנסי ל-https://supabase.com
2. לחצי "Sign in" בפינה הימנית עליונה
3. התחברי עם החשבון שלך (כנראה GitHub)

### 1.2 יצירת פרויקט חדש

1. בדשבורד הראשי, לחצי "New project"
2. אם נדרש לבחור organization, בחרי את הקיים שלך
3. מלאי את הפרטים:
   - **Name:** `legal-platform-v3`
   - **Database Password:** לחצי על "Generate a password". העתיקי אותו מיד לפנקס הרשימות. כותרת: `Supabase DB Password`. הסיסמה הזו לא ניתנת לשחזור.
   - **Region:** Frankfurt (eu-central-1). הכי קרוב לישראל.
   - **Pricing Plan:** Free
4. לחצי "Create new project"
5. המתיני 2-3 דקות עד שהפרויקט מוקם. תראי באר התקדמות.

### 1.3 שמירת המפתחות

לאחר שהפרויקט מוכן:

1. בתפריט הצדדי השמאלי (או הימני בעברית), לחצי על אייקון Settings ⚙️
2. בחרי "API"
3. תראי דף עם שני בלוקים חשובים:

**מבלוק "Project URL":**
העתיקי את ה-URL (מתחיל ב-`https://...supabase.co`). שמרי בפנקס תחת `SUPABASE_URL`.

**מבלוק "Project API Keys":**
- העתיקי את ה-`anon public` key. שמרי תחת `SUPABASE_ANON_KEY`.
- העתיקי את ה-`service_role` key (לוחצים "Reveal" קודם). שמרי תחת `SUPABASE_SERVICE_KEY`. **אל תחשפי את המפתח הזה לאף אחד ואל תדחפי אותו ל-GitHub.**

### 1.4 ✅ נקודת בדיקה

לפני שממשיכים, ודאי שיש לך בפנקס:
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_KEY`
- [ ] `Supabase DB Password`

---

## שלב 2: יצירת GitHub Repository (5 דקות)

### 2.1 יצירת ה-repo

1. כנסי ל-https://github.com
2. בפינה הימנית עליונה, לחצי על "+" ובחרי "New repository"
3. מלאי:
   - **Repository name:** `legal-platform-v3`
   - **Description:** "מערכת מסמכים משפטיים לעורך דין דיני משפחה - גרסה 3"
   - **Visibility:** **Private** (חשוב! יש כאן קוד עם API keys)
   - **Initialize repository with:** *לא לסמן כלום*. אל תוסיפי README, .gitignore, או license. נעשה את זה דרך Cursor.
4. לחצי "Create repository"

### 2.2 שמירת ה-URL

בדף שנפתח, תראי שורה כמו:
```
git@github.com:USERNAME/legal-platform-v3.git
```
או:
```
https://github.com/USERNAME/legal-platform-v3.git
```

העתיקי את ה-URL ושמרי בפנקס תחת `GITHUB_REPO_URL`.

### 2.3 ✅ נקודת בדיקה

- [ ] ה-repo קיים ב-GitHub
- [ ] ה-repo מוגדר **Private**
- [ ] שמרת את ה-URL של ה-repo

---

## שלב 3: הקמת הפרויקט המקומי עם Cursor (15 דקות)

### 3.1 פתיחת תיקייה חדשה

1. פתחי את Cursor
2. File → Open Folder → צרי תיקייה חדשה בשולחן העבודה או ב-Documents בשם `legal-platform-v3` ופתחי אותה.

### 3.2 פרומפט פתיחה ל-Cursor

ב-Cursor, פתחי את הצ'אט (Cmd+L או Ctrl+L) והעתיקי את הפרומפט הבא:

```
אני מתחילה פרויקט חדש בשם legal-platform-v3 - מערכת מסמכים משפטיים בעברית.

צרפתי שלושה מסמכי מקור:
- 01-architecture.md
- 02-gender-engine-spec.md  
- 03-cursor-tasks.md

עכשיו אנחנו עושים את משימה 0.1 - הקמת הפרויקט בלבד.

בצע את הצעדים:

1. אתחל פרויקט Next.js 14 חדש בתיקייה הנוכחית:
   - TypeScript: כן
   - ESLint: כן
   - Tailwind CSS: כן
   - src/ directory: כן
   - App Router: כן
   - Import alias: @/* → ./src/*

2. התקן את התלויות הבאות:
   @supabase/supabase-js
   @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   docx file-saver
   @types/file-saver
   lucide-react
   @anthropic-ai/sdk
   clsx tailwind-merge
   zod

3. התקן devDependencies:
   vitest @testing-library/react @testing-library/jest-dom jsdom
   @types/node

4. הוסף את כיוון RTL ל-app/layout.tsx (dir="rtl" ב-html, lang="he").

5. עדכן את tailwind.config.ts לתמיכה ב-RTL.

6. צור קובץ .env.local.example עם המשתנים:
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ANTHROPIC_API_KEY=

7. צור קובץ .gitignore סטנדרטי של Next.js + הוסף .env.local.

8. עדכן את app/page.tsx להציג כותרת בעברית: "מערכת מסמכים משפטיים - גרסה 3".

9. הוסף ל-package.json את הסקריפט: "test": "vitest"

10. הרץ npm run build וודא שאין שגיאות.

אל תיגע בכלום מעבר לזה. אחרי שתסיים, ספר לי מה עשית והעלה לבדיקה. אל תתחיל את המשימה הבאה לפני אישור.
```

### 3.3 צירוף המסמכים

לפני ששולחים את הפרומפט:
1. גררי לתוך החלון של Cursor את שלושת קבצי ה-md שהורדת
2. או השתמשי באייקון "+" בצ'אט להוספת קבצים

### 3.4 ביצוע

שלחי את הפרומפט והמתיני. Cursor יבצע את הצעדים אחד אחרי השני.

### 3.5 בדיקה ידנית

אחרי שCursor סיים, פתחי טרמינל ב-Cursor (Ctrl+`) והריצי:

```bash
npm run dev
```

פתחי דפדפן ב-http://localhost:3000

תראי דף עם הכותרת "מערכת מסמכים משפטיים - גרסה 3" מימין לשמאל.

עצרי את השרת עם Ctrl+C.

### 3.6 ✅ נקודת בדיקה

- [ ] הפרויקט פתוח ב-Cursor
- [ ] `npm run dev` עובד
- [ ] הדף נטען בעברית RTL
- [ ] `npm run build` עובר בלי שגיאות

---

## שלב 4: הזרקת הקובץ סביבה האמיתי (3 דקות)

עכשיו אנחנו לוקחים את המפתחות מ-Supabase ושמים בקובץ הסביבה האמיתי.

### 4.1 יצירת .env.local

ב-Cursor, צרי קובץ חדש בשם `.env.local` בשורש הפרויקט (לא בתוך src).

הדביקי:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
ANTHROPIC_API_KEY=
```

### 4.2 מילוי הערכים

החליפי:
- `https://YOUR-PROJECT.supabase.co` → ה-`SUPABASE_URL` שלך מהפנקס
- `YOUR-ANON-KEY` → ה-`SUPABASE_ANON_KEY` שלך מהפנקס

את ה-`ANTHROPIC_API_KEY` נשאיר ריק לעת עתה. כשנגיע לשלב של שילוב Claude, נמלא.

### 4.3 וידוא שלא ייעלה ל-GitHub

ודאי שיש שורה `.env.local` ב-`.gitignore`. אם לא, הוסיפי.

### 4.4 ✅ נקודת בדיקה

- [ ] קובץ `.env.local` קיים עם הערכים האמיתיים
- [ ] `.env.local` מופיע ב-`.gitignore`

---

## שלב 5: חיבור ל-GitHub (5 דקות)

### 5.1 אתחול Git

בטרמינל של Cursor, הריצי בזה אחר זה:

```bash
git init
git add .
git commit -m "Initial commit - project scaffolding"
```

### 5.2 חיבור ל-repo המרוחק

```bash
git remote add origin YOUR_GITHUB_REPO_URL
git branch -M main
git push -u origin main
```

החליפי את `YOUR_GITHUB_REPO_URL` ב-URL שלך מהפנקס (מומלץ להשתמש ב-HTTPS אם אין לך SSH מוגדר).

### 5.3 אם יש שגיאת הרשאות

אם git שואל לאיזה סוג authentication:
- בחרי "https"
- שם משתמש: שם המשתמש שלך ב-GitHub
- סיסמה: צרי Personal Access Token ב-https://github.com/settings/tokens (לא הסיסמה הרגילה)

אם זה הופך מסובך, ב-Cursor יש פאנל Source Control מובנה (אייקון של ענפים בצד שמאל). אפשר ללחוץ "Publish Branch" והוא יטפל באימות אוטומטית.

### 5.4 בדיקה

חזרי ל-GitHub בדפדפן, רעני את הדף של ה-repo. את אמורה לראות את כל הקבצים שם.

### 5.5 ✅ נקודת בדיקה

- [ ] git initialized מקומית
- [ ] commit ראשון בוצע
- [ ] הקוד מופיע ב-GitHub
- [ ] `.env.local` **לא** מופיע ב-GitHub (בדקי בעיני בדפדפן!)

---

## שלב 6: חיבור ל-Vercel (10 דקות)

### 6.1 התחברות

1. כנסי ל-https://vercel.com
2. התחברי עם GitHub (אותו חשבון של ה-repo)

### 6.2 ייבוא הפרויקט

1. בדשבורד, לחצי "Add New..." → "Project"
2. בחרי "Import Git Repository"
3. אם לא רואה את `legal-platform-v3`, לחצי "Adjust GitHub App Permissions" ותני ל-Vercel גישה ל-repo
4. ליד `legal-platform-v3`, לחצי "Import"

### 6.3 הגדרות הפרויקט

בדף הקונפיגורציה:
- **Project Name:** `legal-platform-v3` (אפשר להשאיר)
- **Framework Preset:** Next.js (מזוהה אוטומטית)
- **Root Directory:** `./` (השאר ברירת מחדל)
- **Build Settings:** השאר ברירת מחדל

### 6.4 משתני סביבה

לחצי על "Environment Variables" וגלגלי למטה:

הוסיפי שלוש שורות:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | ה-URL שלך מ-Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ה-anon key שלך |
| `ANTHROPIC_API_KEY` | השאירי ריק לעת עתה |

לכל אחד, וודאי שמסומן Production, Preview, Development.

### 6.5 פריסה

לחצי "Deploy".

המתיני 2-3 דקות.

### 6.6 בדיקה

לאחר הסיום:
1. תקבלי URL כמו `https://legal-platform-v3-abc123.vercel.app`
2. פתחי אותו בדפדפן
3. את אמורה לראות את אותו דף שראית מקומית: "מערכת מסמכים משפטיים - גרסה 3"

### 6.7 ✅ נקודת בדיקה

- [ ] הפרויקט מקושר ב-Vercel
- [ ] משתני הסביבה מוגדרים
- [ ] הפריסה הצליחה
- [ ] האתר באוויר וזמין דרך URL

---

## שלב 7: הגדרת זרימת עבודה אוטומטית (2 דקות)

ברגע שה-repo מקושר ל-Vercel, כל push ל-`main` יוצר פריסה חדשה אוטומטית. זה כבר עובד. את לא צריכה לעשות שום דבר נוסף.

מעכשיו זרימת העבודה היא:
1. עורכים קוד ב-Cursor
2. בודקים מקומית עם `npm run dev`
3. commit + push ל-GitHub
4. Vercel מפרסם אוטומטית

---

## שלב 8: יצירת הסכמה של מסד הנתונים (10 דקות)

עכשיו שיש לנו תשתית, ניצור את הטבלאות ב-Supabase.

### 8.1 פתיחת ה-SQL Editor

1. כנסי ל-Supabase Dashboard של הפרויקט שלך
2. בתפריט הצדדי, בחרי "SQL Editor" (אייקון של מסד נתונים)
3. לחצי "New query"

### 8.2 הרצת ה-DDL

העתיקי את כל הסקריפט הבא והדביקי ב-SQL Editor:

```sql
-- ============================================
-- Legal Platform v3 - Initial Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: clients
-- ============================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_user_id ON clients(user_id);

-- ============================================
-- Table: persons
-- ============================================
CREATE TABLE persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  id_number TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  birth_date DATE,
  address TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_persons_client_id ON persons(client_id);

-- ============================================
-- Table: documents
-- ============================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'signed')),
  actors JSONB DEFAULT '[]'::jsonb,
  variables JSONB DEFAULT '{}'::jsonb,
  sections JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_documents_client_id ON documents(client_id);
CREATE INDEX idx_documents_user_id ON documents(user_id);

-- ============================================
-- Table: document_versions
-- ============================================
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  version_number INT NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

CREATE INDEX idx_versions_document_id ON document_versions(document_id);

-- ============================================
-- Table: section_templates
-- ============================================
CREATE TABLE section_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  document_types TEXT[] NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_actors TEXT[] DEFAULT '{}',
  legal_basis TEXT,
  is_required BOOLEAN DEFAULT FALSE,
  conflicts_with UUID[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_system BOOLEAN DEFAULT TRUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_category ON section_templates(category);
CREATE INDEX idx_templates_user_id ON section_templates(user_id);

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_templates ENABLE ROW LEVEL SECURITY;

-- Clients: users see only their own
CREATE POLICY "Users see own clients" ON clients
  FOR ALL USING (auth.uid() = user_id);

-- Persons: through client relationship
CREATE POLICY "Users see own persons" ON persons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = persons.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Documents: users see only their own
CREATE POLICY "Users see own documents" ON documents
  FOR ALL USING (auth.uid() = user_id);

-- Document versions: through document relationship
CREATE POLICY "Users see own versions" ON document_versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_versions.document_id
      AND documents.user_id = auth.uid()
    )
  );

-- Section templates: system templates visible to all, user templates only to owner
CREATE POLICY "Templates visibility" ON section_templates
  FOR SELECT USING (
    is_system = TRUE OR user_id = auth.uid()
  );

CREATE POLICY "Users manage own templates" ON section_templates
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- Trigger: auto-update updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Done
-- ============================================
```

לחצי "Run" (או Ctrl+Enter).

את אמורה לראות הודעה ירוקה "Success".

### 8.3 וידוא

1. בתפריט הצדדי, לחצי "Table Editor" (אייקון של טבלה)
2. את אמורה לראות חמש טבלאות: `clients`, `persons`, `documents`, `document_versions`, `section_templates`
3. לחצי על אחת מהן וודאי שהעמודות נכונות

### 8.4 ✅ נקודת בדיקה

- [ ] חמש הטבלאות קיימות ב-Supabase
- [ ] RLS פעיל על כולן (סמל מנעול ירוק על כל טבלה)

---

## שלב 9: אישור סופי וההתחלה (5 דקות)

### 9.1 חזרה ל-Cursor

ב-Cursor, פתחי את הצ'אט והעתיקי:

```
סיימתי את משימה 0.1. 

הגדרתי:
- פרויקט Supabase: legal-platform-v3
- GitHub repo: legal-platform-v3 (פרטי)
- Vercel project: פרוס אוטומטית מ-main
- חמש טבלאות ב-Supabase עם RLS

עכשיו בצע את משימה 0.2 ממסמך 03-cursor-tasks.md - אבל ה-DDL כבר רץ ב-Supabase, אז דלג על יצירת הטבלאות.

מה שעדיין צריך:
1. צור את הקובץ src/lib/db/supabase.ts עם client של Supabase שקורא את משתני הסביבה
2. צור את התיקייה supabase/migrations/ ובתוכה קובץ 001_initial_schema.sql עם ה-DDL כפי שרץ (לתיעוד)
3. ודא שהפרויקט עדיין נבנה בלי שגיאות
4. עשה commit ו-push

ספר לי מה עשית כשתסיים. אל תתחיל את המשימה הבאה.
```

### 9.2 ממשיכים

אחרי שהוא יסיים, את עוברת למשימה 0.3 (אימות) ממסמך 03-cursor-tasks.md, ואחר כך הלאה.

לכל משימה, השתמשי בפורמט מהמסמך:
- צרפי את שלושת מסמכי המקור לצ'אט
- העתיקי את גוף המשימה
- הוסיפי בסוף: "ספר לי מה עשית כשתסיים. אל תתחיל את המשימה הבאה לפני אישור."

---

## פתרון בעיות נפוצות

### "Permission denied" ב-git push

צרי Personal Access Token ב-https://github.com/settings/tokens עם הרשאת `repo`. השתמשי בו כסיסמה.

### "Module not found" אחרי npm install

```bash
rm -rf node_modules package-lock.json
npm install
```

### Vercel deployment fails

1. כנסי ל-Vercel → Project → Deployments → לחצי על הdeployment הכושל
2. ראי את ה-Build Logs בצד שמאל
3. תני ל-Cursor את השגיאה ובקשי לתקן

### Supabase connection error

ודאי ש-`.env.local` קיים ושהמפתחות נכונים. הריצי `npm run dev` מחדש אחרי שינוי.

### Cursor רושם קוד שלא ביקשת

עצרי אותו (Esc) ותגידי: "תחזור אחורה למה שביקשתי במשימה X. אל תוסיף דברים שלא ביקשתי."

---

## רשימת מעקב כללית

ככה תוכלי לעקוב היכן את עומדת:

- [ ] שלב 1: Supabase project נוצר
- [ ] שלב 2: GitHub repo נוצר (private)
- [ ] שלב 3: פרויקט Next.js מקומי הוקם דרך Cursor
- [ ] שלב 4: `.env.local` עם המפתחות
- [ ] שלב 5: קוד דחוף ל-GitHub
- [ ] שלב 6: Vercel מקושר ופרוס
- [ ] שלב 7: זרימת CI/CD פעילה
- [ ] שלב 8: סכמת DB ב-Supabase
- [ ] שלב 9: משימה 0.2 הושלמה

מכאן עוברים לפי 03-cursor-tasks.md, משימה אחר משימה.

---

## חשוב לזכור

**אבטחה:** אל תשתפי את `SUPABASE_SERVICE_KEY` או `ANTHROPIC_API_KEY` באף מקום ציבורי. הם רק ב-`.env.local` (לא נדחף ל-Git) וב-Vercel Environment Variables.

**גיבוי:** Supabase Free Tier לא עושה גיבויים אוטומטיים. אם הפרויקט יתפתח, שווה לשדרג לפלן Pro שעולה $25 לחודש וכולל גיבויים.

**Vercel limits:** התכנית החינמית כוללת 100GB bandwidth לחודש ו-100 deployments ביום. די והותר לפיתוח, ואפילו לשימוש מקצועי בהיקף קטן עד בינוני.

תהליך ההקמה הכולל יוצר תשתית סטנדרטית בעולם הפיתוח. אחרי שאת עוברת אותו פעם אחת, הפעם הבאה תהיה הרבה יותר מהירה.
