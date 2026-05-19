-- ============================================================
-- Migration 005: Document actors → inline persons
-- ============================================================
-- ממירה את ה-actors של מסמכים: במקום הפניה ל-persons via personIds,
-- הנתונים של האנשים מועתקים inline ל-actors.persons.
--
-- אחרי המיגרציה:
-- - השדה personIds נעלם מ-actors
-- - השדה persons מכיל את הנתונים המלאים (firstName, lastName, וכו')
-- - אם הלקוח ישנה את פרטיו אחר כך, מסמכים ישנים לא ייפגעו
--
-- בטוח להרצה שוב: המיגרציה מזהה אם כבר רצה (כשאין personIds) ומדלגת.

WITH document_actors AS (
  -- שטח את ה-actors[] של כל מסמך, כל שורה היא actor אחד
  SELECT
    d.id AS doc_id,
    actor_arr.actor_value,
    actor_arr.actor_idx
  FROM documents d
  CROSS JOIN LATERAL jsonb_array_elements(d.actors) WITH ORDINALITY
    AS actor_arr(actor_value, actor_idx)
  WHERE d.actors IS NOT NULL
    AND jsonb_typeof(d.actors) = 'array'
),
converted_actors AS (
  -- לכל actor: אם יש בו personIds, נחליף ב-persons inline
  SELECT
    da.doc_id,
    da.actor_idx,
    CASE
      WHEN da.actor_value ? 'personIds' THEN
        (da.actor_value - 'personIds') || jsonb_build_object(
          'persons',
          COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'firstName', p.first_name,
                  'lastName',  p.last_name,
                  'idNumber',  p.id_number,
                  'gender',    p.gender,
                  'birthDate', p.birth_date,
                  'address',   p.address,
                  'city',      p.city,
                  'phone',     p.phone,
                  'email',     p.email
                )
                ORDER BY ord
              )
              FROM jsonb_array_elements_text(da.actor_value->'personIds')
                WITH ORDINALITY AS ids(person_id, ord)
              JOIN persons p ON p.id::text = ids.person_id
            ),
            '[]'::jsonb
          )
        )
      ELSE da.actor_value
    END AS new_actor
  FROM document_actors da
),
new_actors AS (
  -- מאחד את כל ה-actors המומרים בחזרה למערך, לפי האינדקס המקורי
  SELECT
    ca.doc_id,
    jsonb_agg(ca.new_actor ORDER BY ca.actor_idx) AS actors_json
  FROM converted_actors ca
  GROUP BY ca.doc_id
)
UPDATE documents d
SET actors = na.actors_json,
    updated_at = updated_at  -- שמירה על updated_at הקיים
FROM new_actors na
WHERE d.id = na.doc_id;
