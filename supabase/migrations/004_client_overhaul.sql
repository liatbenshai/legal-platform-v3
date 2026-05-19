-- ============================================================
-- Migration 004: Client model overhaul
-- ============================================================
-- מעבירה את המודל מ"שם תיק + רשימת אנשים נפרדת" לתיק עם אדם ראשי
-- ובן/בת זוג אופציונלי. אנשי קשר נוספים נשארים כפי שהם.
--
-- שינויים:
--   1. persons.role  — חדש: 'primary' | 'partner' | 'contact'
--      האדם הוותיק ביותר בכל תיק הופך ל-'primary'.
--   2. clients.planned_doc_types  — מערך טקסטים של סוגי מסמכים מתוכננים
--      ("בא לעשות צוואה + ייפוי כוח", רק לתזכורת ויזואלית).
--
-- בטוח להרצה: ALTER ... ADD COLUMN IF NOT EXISTS לא נוגע בנתונים קיימים.

-- ------------------------------------------------------------
-- 1. הוספת role ל-persons
-- ------------------------------------------------------------
ALTER TABLE persons
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'contact'
  CHECK (role IN ('primary', 'partner', 'contact'));

-- מיגרציית נתונים: לקוחות קיימים — האדם הראשון (לפי created_at) הופך ל-primary
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY client_id ORDER BY created_at ASC
         ) AS rn
  FROM persons
)
UPDATE persons p
SET role = 'primary'
FROM ranked r
WHERE p.id = r.id
  AND r.rn = 1
  AND p.role = 'contact';

-- אילוץ: לכל תיק רק 'primary' אחד ורק 'partner' אחד
-- (מימוש באמצעות אינדקס ייחודי חלקי)
CREATE UNIQUE INDEX IF NOT EXISTS persons_one_primary_per_client
  ON persons (client_id)
  WHERE role = 'primary';

CREATE UNIQUE INDEX IF NOT EXISTS persons_one_partner_per_client
  ON persons (client_id)
  WHERE role = 'partner';

CREATE INDEX IF NOT EXISTS persons_client_role_idx
  ON persons (client_id, role);

-- ------------------------------------------------------------
-- 2. הוספת planned_doc_types ל-clients
-- ------------------------------------------------------------
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS planned_doc_types text[] NOT NULL DEFAULT '{}';
