export interface InflectedWord {
  male: string
  female: string
  plural: string
  plural_female?: string
}

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
  'מבקש': { male: 'מבקש', female: 'מבקשת', plural: 'מבקשים' },
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

export function hasWord(word: string): boolean {
  return Object.prototype.hasOwnProperty.call(dictionary, word)
}
