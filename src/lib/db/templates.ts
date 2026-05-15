import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ActorRole,
  DocumentType,
  SectionTemplate,
  SectionVariant,
} from '@/lib/types'

interface SectionTemplateRow {
  id: string
  category: DocumentType
  document_types: DocumentType[]
  title: string
  description: string | null
  variants: SectionVariant[]
  required_actors: ActorRole[] | null
  legal_basis: string | null
  is_required: boolean
  conflicts_with: string[] | null
  tags: string[] | null
  is_system: boolean
  user_id: string | null
  usage_count: number | null
}

export interface TemplateFilters {
  documentType?: DocumentType
  category?: DocumentType
  tags?: string[]
  isSystem?: boolean
  userId?: string
}

export type TemplateInput = Omit<
  SectionTemplate,
  'id' | 'isSystem' | 'userId' | 'usageCount'
>

function mapRow(row: SectionTemplateRow): SectionTemplate {
  return {
    id: row.id,
    category: row.category,
    documentTypes: row.document_types,
    title: row.title,
    description: row.description ?? '',
    variants: row.variants,
    requiredActors: row.required_actors ?? [],
    legalBasis: row.legal_basis ?? '',
    isRequired: row.is_required,
    conflictsWith: row.conflicts_with ?? [],
    tags: row.tags ?? [],
    isSystem: row.is_system,
    userId: row.user_id ?? undefined,
    usageCount: row.usage_count ?? 0,
  }
}

function toColumns(data: TemplateInput): Record<string, unknown> {
  return {
    category: data.category,
    document_types: data.documentTypes,
    title: data.title,
    description: data.description,
    variants: data.variants,
    required_actors: data.requiredActors,
    legal_basis: data.legalBasis,
    is_required: data.isRequired,
    conflicts_with: data.conflictsWith,
    tags: data.tags,
  }
}

export async function getTemplates(
  supabase: SupabaseClient,
  filters?: TemplateFilters
): Promise<SectionTemplate[]> {
  let query = supabase.from('section_templates').select('*')

  if (filters?.documentType) {
    query = query.contains('document_types', [filters.documentType])
  }
  if (filters?.category) {
    query = query.eq('category', filters.category)
  }
  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags)
  }
  if (filters?.isSystem !== undefined) {
    query = query.eq('is_system', filters.isSystem)
  }
  if (filters?.userId) {
    query = query.eq('user_id', filters.userId)
  }

  const { data, error } = await query.order('title', { ascending: true })
  if (error) throw error
  return ((data ?? []) as SectionTemplateRow[]).map(mapRow)
}

export async function getTemplate(
  supabase: SupabaseClient,
  id: string
): Promise<SectionTemplate | null> {
  const { data, error } = await supabase
    .from('section_templates')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? mapRow(data as SectionTemplateRow) : null
}

export async function createUserTemplate(
  supabase: SupabaseClient,
  userId: string,
  data: TemplateInput
): Promise<SectionTemplate> {
  const { data: row, error } = await supabase
    .from('section_templates')
    .insert({
      ...toColumns(data),
      is_system: false,
      user_id: userId,
      usage_count: 0,
    })
    .select()
    .single()
  if (error) throw error
  return mapRow(row as SectionTemplateRow)
}

export async function updateUserTemplate(
  supabase: SupabaseClient,
  id: string,
  data: TemplateInput
): Promise<SectionTemplate> {
  const { data: row, error } = await supabase
    .from('section_templates')
    .update(toColumns(data))
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return mapRow(row as SectionTemplateRow)
}

export async function deleteUserTemplate(
  supabase: SupabaseClient,
  id: string
): Promise<boolean> {
  const { error } = await supabase
    .from('section_templates')
    .delete()
    .eq('id', id)
  if (error) throw error
  return true
}
