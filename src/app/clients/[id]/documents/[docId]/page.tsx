'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { DocumentPreview } from '@/components/editor/DocumentPreview'
import { SectionLibrary } from '@/components/editor/SectionLibrary'
import { SelectedSections } from '@/components/editor/SelectedSections'
import { getDocument, updateDocument } from '@/lib/db/documents'
import { getPersons } from '@/lib/db/persons'
import { createClient } from '@/lib/db/supabase'
import { getTemplates } from '@/lib/db/templates'
import { renderDocument } from '@/lib/engine/renderer'
import { sectionLibrary, type LibrarySection } from '@/lib/sections/library'
import { useUser } from '@/lib/hooks/useUser'
import type {
  ActorRole,
  Document,
  DocumentSection,
  DocumentType,
  Person,
  SectionTemplate,
} from '@/lib/types'

function templateToLibrarySection(t: SectionTemplate): LibrarySection {
  return {
    sectionId: t.id,
    category: t.category,
    documentTypes: t.documentTypes,
    title: t.title,
    description: t.description,
    variants: t.variants,
    requiredActors: t.requiredActors,
    legalBasis: t.legalBasis,
    isRequired: t.isRequired,
    conflictsWith: t.conflictsWith,
    tags: t.tags,
  }
}

const ALL_DOMAINS: DocumentType[] = [
  'poa-property',
  'poa-personal',
  'poa-medical',
]

function parseDomains(variables: Record<string, string>): DocumentType[] {
  const raw = variables['domains']
  if (!raw) return ALL_DOMAINS
  const parsed = raw
    .split(',')
    .map((d) => d.trim())
    .filter((d): d is DocumentType =>
      (ALL_DOMAINS as string[]).includes(d)
    )
  return parsed.length > 0 ? parsed : ALL_DOMAINS
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const ACTOR_ROLE_LABELS: Partial<Record<ActorRole, string>> = {
  ממנה: 'ממנה',
  מיופה: 'מיופי כוח',
}

function describeGender(persons: Person[]): string {
  if (persons.length === 0) return ''
  if (persons.length > 1) {
    const allFemale = persons.every((p) => p.gender === 'female')
    return allFemale ? 'נקבות (רבות)' : 'רבים'
  }
  return persons[0].gender === 'female' ? 'נקבה' : 'זכר'
}

function makeNewSection(
  templateSection: LibrarySection,
  order: number
): DocumentSection {
  const variant = templateSection.variants[0]
  return {
    id: crypto.randomUUID(),
    order,
    templateId: templateSection.sectionId,
    title: templateSection.title,
    content: variant.content,
    variant: variant.id,
    level: 'main',
  }
}

export default function DocumentEditorPage() {
  const params = useParams<{ id: string; docId: string }>()
  const { user } = useUser()
  const clientId = params.id
  const docId = params.docId

  const [supabase] = useState(() => createClient())

  const [document, setDocument] = useState<Document | null>(null)
  const [persons, setPersons] = useState<Person[]>([])
  const [userSections, setUserSections] = useState<LibrarySection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingDocRef = useRef<Document | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)
    Promise.all([getDocument(supabase, docId), getPersons(supabase, clientId)])
      .then(([d, p]) => {
        if (cancelled) return
        if (!d) {
          setError('המסמך לא נמצא')
        } else {
          setDocument(d)
          setPersons(p)
        }
        setIsLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('שגיאה בטעינת המסמך')
        setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [supabase, docId, clientId])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    getTemplates(supabase, { isSystem: false, userId: user.id })
      .then((templates) => {
        if (cancelled) return
        setUserSections(templates.map(templateToLibrarySection))
      })
      .catch(() => {
        // user sections are optional; failure here doesn't block the editor
      })
    return () => {
      cancelled = true
    }
  }, [supabase, user])

  const scheduleSave = useCallback(
    (next: Document) => {
      pendingDocRef.current = next
      setSaveStatus('saving')
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(async () => {
        const toSave = pendingDocRef.current
        if (!toSave) return
        try {
          await updateDocument(supabase, toSave.id, {
            title: toSave.title,
            status: toSave.status,
            actors: toSave.actors,
            variables: toSave.variables,
            sections: toSave.sections,
          })
          setSaveStatus('saved')
        } catch {
          setSaveStatus('error')
        }
      }, 1500)
    },
    [supabase]
  )

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const rendered = useMemo(() => {
    if (!document) return []
    return renderDocument({ document, persons })
  }, [document, persons])

  const selectedTemplateIds = useMemo(
    () =>
      document
        ? (document.sections
            .map((s) => s.templateId)
            .filter(Boolean) as string[])
        : [],
    [document]
  )

  const allowedDomains = useMemo(
    () => (document ? parseDomains(document.variables) : ALL_DOMAINS),
    [document]
  )

  const availableSections = useMemo(
    () =>
      [...sectionLibrary, ...userSections].filter((s) =>
        s.documentTypes.some((t) => allowedDomains.includes(t))
      ),
    [allowedDomains, userSections]
  )

  function applyChange(updater: (doc: Document) => Document) {
    if (!document) return
    const next = updater(document)
    setDocument(next)
    scheduleSave(next)
  }

  function handleAdd(template: LibrarySection) {
    applyChange((doc) => ({
      ...doc,
      sections: [...doc.sections, makeNewSection(template, doc.sections.length)],
    }))
  }

  function handleRemove(sectionId: string) {
    applyChange((doc) => ({
      ...doc,
      sections: doc.sections
        .filter((s) => s.id !== sectionId)
        .map((s, idx) => ({ ...s, order: idx })),
    }))
  }

  function handleMove(sectionId: string, delta: -1 | 1) {
    applyChange((doc) => {
      const sorted = [...doc.sections].sort((a, b) => a.order - b.order)
      const idx = sorted.findIndex((s) => s.id === sectionId)
      if (idx < 0) return doc
      const swapIdx = idx + delta
      if (swapIdx < 0 || swapIdx >= sorted.length) return doc
      const next = [...sorted]
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return {
        ...doc,
        sections: next.map((s, i) => ({ ...s, order: i })),
      }
    })
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-16 text-center text-slate-500">
          טוען מסמך...
        </div>
      </main>
    )
  }

  if (error || !document) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="text-slate-700 text-lg font-medium mb-4">
            {error ?? 'מסמך לא נמצא'}
          </p>
          <Link
            href={`/clients/${clientId}`}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← חזרה לתיק
          </Link>
        </div>
      </main>
    )
  }

  const actorSummaries = document.actors.map((a) => {
    const linkedPersons = a.personIds
      .map((id) => persons.find((p) => p.id === id))
      .filter((p): p is Person => p !== undefined)
    const names = linkedPersons
      .map((p) => `${p.firstName} ${p.lastName}`)
      .join(' ו-')
    const genderHint = describeGender(linkedPersons)
    return {
      role: a.role,
      label: ACTOR_ROLE_LABELS[a.role] ?? a.role,
      names: names || '(לא נבחר)',
      genderHint,
    }
  })

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-800 truncate">
              {document.title}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-0.5">
              {actorSummaries.map((a) => (
                <span key={a.role}>
                  <strong className="text-slate-700">{a.label}:</strong>{' '}
                  {a.names}
                  {a.genderHint && (
                    <span className="text-slate-400"> ({a.genderHint})</span>
                  )}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <SaveIndicator status={saveStatus} />
            <Link
              href={`/clients/${clientId}`}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              ← לתיק
            </Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pb-2 text-xs text-slate-400">
          לעריכת מגדר של ממנה או מיופה — עברו לתיק הלקוח וערכו את האדם המתאים.
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_1fr] gap-4 h-[calc(100vh-180px)]">
          <SectionLibrary
            sections={availableSections}
            selectedTemplateIds={selectedTemplateIds}
            onAdd={handleAdd}
          />
          <SelectedSections
            sections={document.sections}
            onRemove={handleRemove}
            onMoveUp={(id) => handleMove(id, -1)}
            onMoveDown={(id) => handleMove(id, 1)}
          />
          <DocumentPreview title={document.title} rendered={rendered} />
        </div>
      </div>
    </main>
  )
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null
  const config = {
    saving: { text: 'שומר...', className: 'text-slate-500' },
    saved: { text: 'נשמר ✓', className: 'text-emerald-600' },
    error: { text: 'שגיאת שמירה', className: 'text-red-600' },
  } as const
  const { text, className } = config[status]
  return <span className={`text-xs font-medium ${className}`}>{text}</span>
}
