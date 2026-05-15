import type { SupabaseClient } from '@supabase/supabase-js'
import type { Client } from '@/lib/types'

interface ClientRow {
  id: string
  user_id: string
  display_name: string
  notes: string | null
  created_at: string
  updated_at: string
}

function mapRow(row: ClientRow): Client {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    notes: row.notes ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export async function getClients(
  supabase: SupabaseClient,
  userId: string
): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as ClientRow[]).map(mapRow)
}

export async function getClient(
  supabase: SupabaseClient,
  id: string
): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? mapRow(data as ClientRow) : null
}

export async function createClient(
  supabase: SupabaseClient,
  userId: string,
  displayName: string,
  notes?: string
): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      user_id: userId,
      display_name: displayName,
      notes: notes ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return mapRow(data as ClientRow)
}

export async function updateClient(
  supabase: SupabaseClient,
  id: string,
  displayName: string,
  notes: string | undefined
): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update({
      display_name: displayName,
      notes: notes ?? null,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return mapRow(data as ClientRow)
}

export async function deleteClient(
  supabase: SupabaseClient,
  id: string
): Promise<boolean> {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
  return true
}
