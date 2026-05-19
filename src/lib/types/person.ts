export type Gender = 'male' | 'female'
export type PersonRole = 'primary' | 'partner' | 'contact'

/**
 * EmbeddedPerson: נתוני אדם המאוחסנים inline בתוך מסמך.
 * אין id/clientId/role — האדם הוא נתון של המסמך, לא של הלקוח.
 * משמש בתוך DocumentActor.persons (החליף את personIds).
 */
export interface EmbeddedPerson {
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

/**
 * Person: רשומה בטבלת persons בבסיס הנתונים.
 * משמשת לפרטי הלקוח הראשי, בן/בת זוג, ואנשי קשר נוספים.
 * Person extends EmbeddedPerson — אפשר להעביר Person למקום בו מצופה EmbeddedPerson.
 */
export interface Person extends EmbeddedPerson {
  id: string
  clientId: string
  role: PersonRole
}
