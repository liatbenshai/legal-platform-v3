import type { SupabaseClient } from '@supabase/supabase-js'
import type { InflectedWord } from '@/lib/engine/dictionary'

export interface UserDictionaryEntry extends InflectedWord {
  id: string
  word: string
}

interface UserDictionaryRow {
  id: string
  user_id: string
  word: string
  male: string
  female: string
  plural: string
  plural_female: string | null
  created_at: string
  updated_at: string
}

function mapRow(row: UserDictionaryRow): UserDictionaryEntry {
  return {
    id: row.id,
    word: row.word,
    male: row.male,
    female: row.female,
    plural: row.plural,
    plural_female: row.plural_female ?? undefined,
  }
}

export async function getUserDictionaryEntries(
  supabase: SupabaseClient,
  userId: string
): Promise<UserDictionaryEntry[]> {
  const { data, error } = await supabase
    .from('user_dictionary_entries')
    .select('*')
    .eq('user_id', userId)
    .order('word', { ascending: true })
  if (error) throw error
  return ((data ?? []) as UserDictionaryRow[]).map(mapRow)
}

export interface DictionaryEntryInput {
  word: string
  male: string
  female: string
  plural: string
  plural_female?: string
}

export async function createUserDictionaryEntry(
  supabase: SupabaseClient,
  userId: string,
  data: DictionaryEntryInput
): Promise<UserDictionaryEntry> {
  const { data: row, error } = await supabase
    .from('user_dictionary_entries')
    .insert({
      user_id: userId,
      word: data.word,
      male: data.male,
      female: data.female,
      plural: data.plural,
      plural_female: data.plural_female ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return mapRow(row as UserDictionaryRow)
}

export async function deleteUserDictionaryEntry(
  supabase: SupabaseClient,
  id: string
): Promise<boolean> {
  const { error } = await supabase
    .from('user_dictionary_entries')
    .delete()
    .eq('id', id)
  if (error) throw error
  return true
}

export function mergeDictionaries(
  staticDict: Record<string, InflectedWord>,
  userEntries: UserDictionaryEntry[]
): Record<string, InflectedWord> {
  const merged: Record<string, InflectedWord> = { ...staticDict }
  for (const entry of userEntries) {
    merged[entry.word] = {
      male: entry.male,
      female: entry.female,
      plural: entry.plural,
      ...(entry.plural_female !== undefined && {
        plural_female: entry.plural_female,
      }),
    }
  }
  return merged
}
