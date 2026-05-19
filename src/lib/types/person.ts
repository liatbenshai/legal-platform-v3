export type Gender = 'male' | 'female'
export type PersonRole = 'primary' | 'partner' | 'contact'

export interface Person {
  id: string
  clientId: string
  role: PersonRole
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
