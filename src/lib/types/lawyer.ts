import type { Gender } from './person'

export interface LawyerProfile {
  userId: string
  fullName: string
  gender: Gender
  idNumber: string
  licenseNumber: string
  barAssociation: string
  firmName: string
  address: string
  city: string
  phone: string
  email: string
  createdAt: Date
  updatedAt: Date
}

export const EMPTY_LAWYER_PROFILE: Omit<LawyerProfile, 'userId' | 'createdAt' | 'updatedAt'> = {
  fullName: '',
  gender: 'female',
  idNumber: '',
  licenseNumber: '',
  barAssociation: '',
  firmName: '',
  address: '',
  city: '',
  phone: '',
  email: '',
}
