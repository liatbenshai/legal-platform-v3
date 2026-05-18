'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { DocumentCanvas } from '@/components/editor/v2/DocumentCanvas'
import { DocumentHeader } from '@/components/editor/v2/DocumentHeader'
import { FormPanel } from '@/components/editor/v2/FormPanel'
import { StepNavigation } from '@/components/editor/v2/StepNavigation'
import { StepTabs } from '@/components/editor/v2/StepTabs'
import { TitleBar } from '@/components/editor/v2/TitleBar'
import { ActorPickerTab } from '@/components/editor/v2/tabs/ActorPickerTab'
import { DetailsTab } from '@/components/editor/v2/tabs/DetailsTab'
import { DirectivesTab } from '@/components/editor/v2/tabs/DirectivesTab'
import { PowersTab } from '@/components/editor/v2/tabs/PowersTab'
import { SignatureTab } from '@/components/editor/v2/tabs/SignatureTab'
import { getClient } from '@/lib/db/clients'
import {
  getUserDictionaryEntries,
  mergeDictionaries,
  type UserDictionaryEntry,
} from '@/lib/db/dictionary'
import { getDocument, updateDocument } from '@/lib/db/documents'
import { getPersons } from '@/lib/db/persons'
import { createClient } from '@/lib/db/supabase'
import { getTemplates } from '@/lib/db/templates'
import {
  ACTOR_LABELS,
  getDocTypeConfig,
} from '@/lib/documents/type-config'
import { buildDetailsSections } from '@/lib/engine/details-sections'
import { dictionary as staticDictionary } from '@/lib/engine/dictionary'
import { renderDocument } from '@/lib/engine/renderer'
import { exportToWord } from '@/lib/export/word'
import { useUser } from '@/lib/hooks/useUser'
import {
  sectionLibrary,
  type LibrarySection,
} from '@/lib/sections/library'
import {
  EMPTY_DETAILS,
  type Client,
  type Document,
  type DocumentActor,
  type DocumentDetails,
  type DocumentSection,
  type DocumentStatus,
  type DocumentType,
  type Person,
  type SectionTemplate,
} from '@/lib/types'

const ALL_DOMAINS: DocumentType[] = [
  'poa-property',
  'poa-personal',
  'poa-medical',
]

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const DETAILS_KEY = '__details_json'

function parseDetails(variables: Record<string, string>): DocumentDetails {
  const raw = variables[DETAILS_KEY]
  if (!raw) return EMPTY_DETAILS
  try {
    const parsed = JSON.parse(raw) as Partial<DocumentDetails>
    return {
      ...EMPTY_DETAILS,
      ...parsed,
      bankAccounts: parsed.bankAccounts ?? [],
      properties: parsed.properties ?? [],
      financialAssets: parsed.financialAssets ?? [],
      doctors: parsed.doctors ?? [],
      dietaryPreferences: parsed.dietaryPreferences ?? '',
      specialRequests: parsed.specialRequests ?? '',
    }
  } catch {
    return EMPTY_DETAILS
  }
}

function parseDomains(variables: Record<string, string>): DocumentType[] {
  const raw = variables['domains']
  if (!raw) return ALL_DOMAINS
  const parsed = raw
    .split(',')
    .map((d) => d.trim())
    .filter((d): d is DocumentType => (ALL_DOMAINS as string[]).includes(d))
  return parsed.length > 0 ? parsed : ALL_DOMAINS
}

function getActorPersonIds(
  doc: Document | null,
  role: DocumentActor['role']
): string[] {
  if (!doc) return []
  return doc.actors.find((a) => a.role === role)?.personIds ?? []
}

function setActor(
  doc: Document,
  role: DocumentActor['role'],
  personIds: string[]
): Document {
  const others = doc.actors.filter((a) => a.role !== role)
  if (personIds.length === 0) {
    return { ...doc, actors: others }
  }
  return { ...doc, actors: [...others, { role, personIds }] }
}

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

function makeNewSection(
  template: LibrarySection,
  order: number
): DocumentSection {
  const variant = template.variants[0]
  return {
    id: crypto.randomUUID(),
    order,
    templateId: template.sectionId,
    title: template.title,
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

  const [client, setClient] = useState<Client | null>(null)
  const [document, setDocument] = useState<Document | null>(null)
  const [persons, setPersons] = useState<Person[]>([])
  const [userSections, setUserSections] = useState<LibrarySection[]>([])
  const [userDictionary, setUserDictionary] = useState<UserDictionaryEntry[]>(
    []
  )

  const [activeTab, setActiveTab] = useState<string>('')

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingDocRef = useRef<Document | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)
    Promise.all([
      getDocument(supabase, docId),
      getPersons(supabase, clientId),
      getClient(supabase, clientId),
    ])
      .then(([d, p, c]) => {
        if (cancelled) return
        if (!d) {
          setError('המסמך לא נמצא')
        } else {
          setDocument(d)
          setPersons(p)
          setClient(c)
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
      .catch(() => undefined)
    getUserDictionaryEntries(supabase, user.id)
      .then((entries) => {
        if (cancelled) return
        setUserDictionary(entries)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [supabase, user])

  const mergedDictionary = useMemo(
    () => mergeDictionaries(staticDictionary, userDictionary),
    [userDictionary]
  )

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

  const applyChange = useCallback(
    (updater: (doc: Document) => Document) => {
      setDocument((curr) => {
        if (!curr) return curr
        const next = updater(curr)
        scheduleSave(next)
        return next
      })
    },
    [scheduleSave]
  )

  const docConfig = useMemo(
    () => (document ? getDocTypeConfig(document.type) : null),
    [document]
  )

  // Initialize activeTab to first tab id of the doc type
  useEffect(() => {
    if (!activeTab && docConfig && docConfig.tabs.length > 0) {
      setActiveTab(docConfig.tabs[0].id)
    }
  }, [activeTab, docConfig])

  const actorTabs = useMemo(
    () =>
      (docConfig?.tabs ?? []).filter(
        (t): t is (typeof t) & { actorRole: NonNullable<typeof t.actorRole> } =>
          t.kind === 'actor' && Boolean(t.actorRole)
      ),
    [docConfig]
  )

  function getPersonsForRole(role: DocumentActor['role']): Person[] {
    if (!document) return []
    return getActorPersonIds(document, role)
      .map((id) => persons.find((p) => p.id === id))
      .filter((p): p is Person => p !== undefined)
  }

  const primaryActorRole = actorTabs[0]?.actorRole
  const primaryActor = primaryActorRole
    ? getPersonsForRole(primaryActorRole)[0] ?? null
    : null

  // Auto-update title when primary actor is set (only if title is still default)
  useEffect(() => {
    if (!document || !primaryActor || !docConfig) return
    const desiredTitle = docConfig.defaultTitle(primaryActor)
    if (document.title === 'מסמך חדש' && document.title !== desiredTitle) {
      applyChange((doc) => ({ ...doc, title: desiredTitle }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryActor?.id])

  const allowedDomains = useMemo(
    () => (document ? parseDomains(document.variables) : ALL_DOMAINS),
    [document]
  )

  const details = useMemo(
    () => (document ? parseDetails(document.variables) : EMPTY_DETAILS),
    [document]
  )

  function handleDetailsChange(next: DocumentDetails) {
    applyChange((doc) => ({
      ...doc,
      variables: {
        ...doc.variables,
        [DETAILS_KEY]: JSON.stringify(next),
      },
    }))
  }

  function handleVariableChange(key: string, value: string) {
    applyChange((doc) => ({
      ...doc,
      variables: { ...doc.variables, [key]: value },
    }))
  }

  const availableSections = useMemo(
    () =>
      [...sectionLibrary, ...userSections].filter((s) =>
        s.documentTypes.some((t) => allowedDomains.includes(t))
      ),
    [allowedDomains, userSections]
  )

  const rendered = useMemo(() => {
    if (!document) return []
    const fromTemplates = renderDocument({
      document,
      persons,
      dictionary: mergedDictionary,
    })
    const fromDetails = buildDetailsSections(details)
    return [...fromDetails, ...fromTemplates]
  }, [document, persons, mergedDictionary, details])

  function handlePersonCreated(p: Person) {
    setPersons((curr) => [...curr, p])
  }

  function handleActorChange(role: DocumentActor['role'], ids: string[]) {
    applyChange((doc) => setActor(doc, role, ids))
  }

  function handleDomainToggle(domain: DocumentType) {
    applyChange((doc) => {
      const current = parseDomains(doc.variables)
      const next = current.includes(domain)
        ? current.filter((d) => d !== domain)
        : [...current, domain]
      return {
        ...doc,
        variables: { ...doc.variables, domains: next.join(',') },
      }
    })
  }

  function handleAddSection(template: LibrarySection) {
    applyChange((doc) => ({
      ...doc,
      sections: [
        ...doc.sections,
        makeNewSection(template, doc.sections.length),
      ],
    }))
  }

  function handleRemoveSection(sectionId: string) {
    applyChange((doc) => ({
      ...doc,
      sections: doc.sections
        .filter((s) => s.id !== sectionId)
        .map((s, idx) => ({ ...s, order: idx })),
    }))
  }

  function handleSectionContentChange(sectionId: string, content: string) {
    applyChange((doc) => ({
      ...doc,
      sections: doc.sections.map((s) =>
        s.id === sectionId ? { ...s, content } : s
      ),
    }))
  }

  function handleMoveSection(sectionId: string, delta: -1 | 1) {
    applyChange((doc) => {
      const sorted = [...doc.sections].sort((a, b) => a.order - b.order)
      const idx = sorted.findIndex((s) => s.id === sectionId)
      if (idx < 0) return doc
      const swap = idx + delta
      if (swap < 0 || swap >= sorted.length) return doc
      const next = [...sorted]
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return { ...doc, sections: next.map((s, i) => ({ ...s, order: i })) }
    })
  }

  function handleStatusChange(status: DocumentStatus) {
    applyChange((doc) => ({ ...doc, status }))
  }

  const hasContent = useMemo(
    () => document !== null && (document.sections.length > 0 || rendered.length > 0),
    [document, rendered]
  )

  async function handleExport() {
    if (!document) return
    if (!hasContent) {
      setExportError('המסמך ריק. בחרי לפחות סעיף אחד או הזיני פרטים.')
      return
    }
    setIsExporting(true)
    setExportError(null)
    try {
      await exportToWord({
        document,
        persons,
        dictionary: mergedDictionary,
        details,
      })
    } catch {
      setExportError('שגיאה בייצוא. נסי שוב.')
    } finally {
      setIsExporting(false)
    }
  }

  function handlePrev() {
    const tabs = docConfig?.tabs ?? []
    const idx = tabs.findIndex((t) => t.id === activeTab)
    if (idx > 0) setActiveTab(tabs[idx - 1].id)
  }

  function handleNext() {
    const tabs = docConfig?.tabs ?? []
    const idx = tabs.findIndex((t) => t.id === activeTab)
    if (idx < tabs.length - 1) setActiveTab(tabs[idx + 1].id)
  }

  if (isLoading) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <div style={{ color: 'var(--text-muted)' }}>טוען מסמך...</div>
      </main>
    )
  }

  if (error || !document) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <div className="text-center">
          <p style={{ color: 'var(--text-primary)', marginBottom: 12 }}>
            {error ?? 'מסמך לא נמצא'}
          </p>
          <a
            href={`/clients/${clientId}`}
            style={{ color: 'var(--color-primary)', fontSize: 13 }}
          >
            ← חזרה לתיק
          </a>
        </div>
      </main>
    )
  }

  const partiesSummary = (() => {
    const lines: string[] = []
    for (const tab of actorTabs) {
      const role = tab.actorRole
      const labels = ACTOR_LABELS[role]
      const list = getPersonsForRole(role)
      if (list.length === 0) {
        lines.push(`${labels.male}: [טרם נבחר]`)
        continue
      }
      const roleText = !tab.multiple
        ? list[0].gender === 'female'
          ? labels.female
          : labels.male
        : list.length > 1
          ? labels.plural
          : list[0].gender === 'female'
            ? labels.female
            : labels.male
      const names = list
        .map((p) => `${p.firstName} ${p.lastName} (ת.ז. ${p.idNumber})`)
        .join(', ')
      lines.push(`${roleText}: ${names}`)
    }
    return lines.join('\n')
  })()

  const activeTabSpec = docConfig?.tabs.find((t) => t.id === activeTab)
  const stepTitle = activeTabSpec?.label ?? ''
  const stepDescription = activeTabSpec?.description ?? ''
  const firstTabId = docConfig?.tabs[0]?.id
  const lastTabId = docConfig?.tabs[docConfig.tabs.length - 1]?.id

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <TitleBar />
      <DocumentHeader
        documentType={docConfig?.label ?? 'מסמך'}
        documentName={document.title}
        clientName={client?.displayName ?? '—'}
        openedAt={document.createdAt}
        onExport={handleExport}
        isExporting={isExporting}
        canExport={hasContent}
      />
      <StepTabs
        tabs={(docConfig?.tabs ?? []).map((t) => ({ id: t.id, label: t.label }))}
        activeId={activeTab}
        onChange={setActiveTab}
      />

      {exportError && (
        <div
          className="px-8 py-2"
          style={{
            backgroundColor: '#FEE2E2',
            color: '#991B1B',
            fontSize: 12,
          }}
          role="alert"
        >
          {exportError}
        </div>
      )}

      <div
        className="flex-1 grid overflow-hidden"
        style={{ gridTemplateColumns: '30% 70%' }}
      >
        <FormPanel stepTitle={stepTitle} stepDescription={stepDescription}>
          {activeTabSpec?.kind === 'actor' && activeTabSpec.actorRole && (
            <ActorPickerTab
              clientId={clientId}
              label={activeTabSpec.label}
              multiple={Boolean(activeTabSpec.multiple)}
              selectedIds={getActorPersonIds(document, activeTabSpec.actorRole)}
              selectedPersons={getPersonsForRole(activeTabSpec.actorRole)}
              excludeIds={actorTabs
                .filter((t) => t.actorRole !== activeTabSpec.actorRole)
                .flatMap((t) =>
                  t.actorRole ? getActorPersonIds(document, t.actorRole) : []
                )}
              onChange={(ids) =>
                handleActorChange(activeTabSpec.actorRole!, ids)
              }
              onPersonCreated={handlePersonCreated}
              roleSingularMale={ACTOR_LABELS[activeTabSpec.actorRole].male}
              roleSingularFemale={
                ACTOR_LABELS[activeTabSpec.actorRole].female
              }
              rolePlural={ACTOR_LABELS[activeTabSpec.actorRole].plural}
              isLawyerRole={activeTabSpec.actorRole === 'עורך_דין'}
            />
          )}
          {activeTabSpec?.kind === 'powers' && (
            <PowersTab
              selectedDomains={allowedDomains}
              onToggle={handleDomainToggle}
            />
          )}
          {activeTabSpec?.kind === 'details' && (
            <DetailsTab
              details={details}
              onChange={handleDetailsChange}
            />
          )}
          {activeTabSpec?.kind === 'directives' && (
            <DirectivesTab
              availableSections={availableSections}
              selectedSections={document.sections}
              onAdd={handleAddSection}
              onRemove={handleRemoveSection}
              onMoveUp={(id) => handleMoveSection(id, -1)}
              onMoveDown={(id) => handleMoveSection(id, 1)}
              onContentChange={handleSectionContentChange}
              onVariableChange={handleVariableChange}
              variables={document.variables}
              allowedDomains={allowedDomains}
            />
          )}
          {activeTabSpec?.kind === 'signature' && (
            <SignatureTab
              status={document.status}
              onStatusChange={handleStatusChange}
              principalName={
                primaryActor
                  ? `${primaryActor.firstName} ${primaryActor.lastName}`
                  : null
              }
              attorneyNames={actorTabs
                .slice(1)
                .flatMap((t) =>
                  t.actorRole
                    ? getPersonsForRole(t.actorRole).map(
                        (p) => `${p.firstName} ${p.lastName}`
                      )
                    : []
                )}
              sectionsCount={document.sections.length}
              onExport={handleExport}
              isExporting={isExporting}
            />
          )}

          <div style={{ marginTop: 24 }}>
            <StepNavigation
              onPrev={handlePrev}
              onNext={handleNext}
              prevDisabled={activeTab === firstTabId}
              nextDisabled={activeTab === lastTabId}
            />
          </div>
        </FormPanel>

        <DocumentCanvas
          documentTitle={document.title}
          rendered={rendered}
          partiesSummary={partiesSummary}
          saveStatus={saveStatus}
        />
      </div>
    </main>
  )
}
