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
