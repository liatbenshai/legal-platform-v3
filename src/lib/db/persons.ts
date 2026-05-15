import type { SupabaseClient } from '@supabase/supabase-js'
import type { Gender, Person } from '@/lib/types'

interface PersonRow {
  id: string
  client_id: string
  first_name: string
  last_name: string
  id_number: string
  gender: Gender
  birth_date: string | null
  address: string
  city: string
  phone: string | null
  email: string | null
  created_at: string
}

export type PersonInput = Omit<Person, 'id' | 'clientId'>

function mapRow(row: PersonRow): Person {
  return {
    id: row.id,
    clientId: row.client_id,
    firstName: row.first_name,
    lastName: row.last_name,
    idNumber: row.id_number,
    gender: row.gender,
    birthDate: row.birth_date ? new Date(row.birth_date) : undefined,
    address: row.address,
    city: row.city,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
  }
}

function toColumns(data: PersonInput): Record<string, unknown> {
  return {
    first_name: data.firstName,
    last_name: data.lastName,
    id_number: data.idNumber,
    gender: data.gender,
    birth_date: data.birthDate
      ? data.birthDate.toISOString().slice(0, 10)
      : null,
    address: data.address,
    city: data.city,
    phone: data.phone ?? null,
    email: data.email ?? null,
  }
}

export async function getPersons(
  supabase: SupabaseClient,
  clientId: string
): Promise<Person[]> {
  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return ((data ?? []) as PersonRow[]).map(mapRow)
}

export async function getPerson(
  supabase: SupabaseClient,
  id: string
): Promise<Person | null> {
  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? mapRow(data as PersonRow) : null
}

export async function createPerson(
  supabase: SupabaseClient,
  clientId: string,
  data: PersonInput
): Promise<Person> {
  const { data: row, error } = await supabase
    .from('persons')
    .insert({ client_id: clientId, ...toColumns(data) })
    .select()
    .single()
  if (error) throw error
  return mapRow(row as PersonRow)
}

export async function updatePerson(
  supabase: SupabaseClient,
  id: string,
  data: PersonInput
): Promise<Person> {
  const { data: row, error } = await supabase
    .from('persons')
    .update(toColumns(data))
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return mapRow(row as PersonRow)
}

export async function deletePerson(
  supabase: SupabaseClient,
  id: string
): Promise<boolean> {
  const { error } = await supabase.from('persons').delete().eq('id', id)
  if (error) throw error
  return true
}
