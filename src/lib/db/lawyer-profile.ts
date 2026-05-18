import type { SupabaseClient } from '@supabase/supabase-js'
import type { Gender, LawyerProfile } from '@/lib/types'

interface LawyerProfileRow {
  user_id: string
  full_name: string
  gender: Gender
  id_number: string
  license_number: string
  bar_association: string
  firm_name: string
  address: string
  city: string
  phone: string
  email: string
  created_at: string
  updated_at: string
}

function mapRow(row: LawyerProfileRow): LawyerProfile {
  return {
    userId: row.user_id,
    fullName: row.full_name,
    gender: row.gender,
    idNumber: row.id_number,
    licenseNumber: row.license_number,
    barAssociation: row.bar_association,
    firmName: row.firm_name,
    address: row.address,
    city: row.city,
    phone: row.phone,
    email: row.email,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export async function getLawyerProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<LawyerProfile | null> {
  const { data, error } = await supabase
    .from('lawyer_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return mapRow(data as LawyerProfileRow)
}

export interface LawyerProfileInput {
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
}

export async function upsertLawyerProfile(
  supabase: SupabaseClient,
  userId: string,
  data: LawyerProfileInput
): Promise<LawyerProfile> {
  const { data: row, error } = await supabase
    .from('lawyer_profiles')
    .upsert(
      {
        user_id: userId,
        full_name: data.fullName,
        gender: data.gender,
        id_number: data.idNumber,
        license_number: data.licenseNumber,
        bar_association: data.barAssociation,
        firm_name: data.firmName,
        address: data.address,
        city: data.city,
        phone: data.phone,
        email: data.email,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()
  if (error) throw error
  return mapRow(row as LawyerProfileRow)
}
