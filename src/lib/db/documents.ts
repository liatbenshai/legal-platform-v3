import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Document,
  DocumentActor,
  DocumentSection,
  DocumentStatus,
  DocumentType,
  DocumentVersion,
} from '@/lib/types'

interface DocumentRow {
  id: string
  client_id: string
  user_id: string
  type: DocumentType
  title: string
  status: DocumentStatus
  actors: DocumentActor[] | null
  variables: Record<string, string> | null
  sections: DocumentSection[] | null
  created_at: string
  updated_at: string
}

interface DocumentVersionRow {
  id: string
  document_id: string
  version_number: number
  snapshot: Document
  created_at: string
  created_by: string
}

export type DocumentInput = Pick<
  Document,
  'title' | 'status' | 'actors' | 'variables' | 'sections'
>

function mapRow(row: DocumentRow): Document {
  return {
    id: row.id,
    clientId: row.client_id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    status: row.status,
    actors: row.actors ?? [],
    variables: row.variables ?? {},
    sections: row.sections ?? [],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

function mapVersionRow(row: DocumentVersionRow): DocumentVersion {
  return {
    id: row.id,
    documentId: row.document_id,
    versionNumber: row.version_number,
    snapshot: row.snapshot,
    createdAt: new Date(row.created_at),
    createdBy: row.created_by,
  }
}

export async function getDocuments(
  supabase: SupabaseClient,
  clientId: string
): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('client_id', clientId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as DocumentRow[]).map(mapRow)
}

export async function getDocument(
  supabase: SupabaseClient,
  id: string
): Promise<Document | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? mapRow(data as DocumentRow) : null
}

export async function createDocument(
  supabase: SupabaseClient,
  clientId: string,
  userId: string,
  type: DocumentType,
  title: string
): Promise<Document> {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      client_id: clientId,
      user_id: userId,
      type,
      title,
      status: 'draft' as DocumentStatus,
      actors: [],
      variables: {},
      sections: [],
    })
    .select()
    .single()
  if (error) throw error
  return mapRow(data as DocumentRow)
}

export async function updateDocument(
  supabase: SupabaseClient,
  id: string,
  data: DocumentInput
): Promise<Document> {
  const { data: row, error } = await supabase
    .from('documents')
    .update({
      title: data.title,
      status: data.status,
      actors: data.actors,
      variables: data.variables,
      sections: data.sections,
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return mapRow(row as DocumentRow)
}

export async function deleteDocument(
  supabase: SupabaseClient,
  id: string
): Promise<boolean> {
  const { error } = await supabase.from('documents').delete().eq('id', id)
  if (error) throw error
  return true
}

export async function saveDocumentVersion(
  supabase: SupabaseClient,
  documentId: string,
  snapshot: Document,
  userId: string
): Promise<DocumentVersion> {
  const { data: latest, error: queryError } = await supabase
    .from('document_versions')
    .select('version_number')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false })
    .limit(1)
  if (queryError) throw queryError

  const previousNumber =
    (latest && latest.length > 0 ? (latest[0].version_number as number) : 0) ||
    0
  const nextVersion = previousNumber + 1

  const { data, error } = await supabase
    .from('document_versions')
    .insert({
      document_id: documentId,
      version_number: nextVersion,
      snapshot,
      created_by: userId,
    })
    .select()
    .single()
  if (error) throw error
  return mapVersionRow(data as DocumentVersionRow)
}
