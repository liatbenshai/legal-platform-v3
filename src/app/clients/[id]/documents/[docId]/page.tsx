'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { DocumentCanvas } from '@/components/editor/v2/DocumentCanvas'
import { DocumentHeader } from '@/components/editor/v2/DocumentHeader'
import { FormPanel } from '@/components/editor/v2/FormPanel'
import { StepNavigation } from '@/components/editor/v2/StepNavigation'
import { StepTabs, TABS, type TabId } from '@/components/editor/v2/StepTabs'
import { TitleBar } from '@/components/editor/v2/TitleBar'
import { AttorneysTab } from '@/components/editor/v2/tabs/AttorneysTab'
import { DetailsTab } from '@/components/editor/v2/tabs/DetailsTab'
import { DirectivesTab } from '@/components/editor/v2/tabs/DirectivesTab'
import { PowersTab } from '@/components/editor/v2/tabs/PowersTab'
import { PrincipalTab } from '@/components/editor/v2/tabs/PrincipalTab'
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
import { buildDetailsSections } from '@/lib/engine/details-sections'
import { dictionary as staticDictionary } from '@/lib/engine/dictionary'
import { extractPlaceholders, renderDocument } from '@/lib/engine/renderer'
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

const STEP_META: Record<TabId, { title: string; description: string }> = {
  principal: {
    title: 'פרטי הממנה',
    description: 'בחרי את האדם שיוצא ייפוי הכוח בשמו.',
  },
  attorneys: {
    title: 'מיופי הכוח',
    description: 'מי יקבל את הסמכויות לפעול בשם הממנה.',
  },
  powers: {
    title: 'סמכויות',
    description: 'באילו תחומים מיופה הכוח מוסמך לפעול.',
  },
  details: {
    title: 'פרטים',
    description: 'נכסים, רכוש פיננסי, רופאים והעדפות אישיות.',
  },
  directives: {
    title: 'הנחיות מקדימות',
    description: 'בחרי סעיפים שמפרטים איך לפעול במצבים שונים.',
  },
  signature: {
    title: 'חתימה ואישור',
    description: 'סקירה אחרונה לפני ייצוא ל-Word.',
  },
}

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

  const [activeTab, setActiveTab] = useState<TabId>('principal')

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

  const principalIds = getActorPersonIds(document, 'ממנה')
  const attorneyIds = getActorPersonIds(document, 'מיופה')

  const principal = useMemo(
    () => persons.find((p) => p.id === principalIds[0]) ?? null,
    [persons, principalIds]
  )

  const attorneys = useMemo(
    () =>
      attorneyIds
        .map((id) => persons.find((p) => p.id === id))
        .filter((p): p is Person => p !== undefined),
    [persons, attorneyIds]
  )

  // Auto-update title when principal is set (only if title is still default)
  useEffect(() => {
    if (!document || !principal) return
    const desiredTitle = `ייפוי כוח - ${principal.firstName} ${principal.lastName}`
    if (document.title === 'מסמך חדש' && document.title !== desiredTitle) {
      applyChange((doc) => ({ ...doc, title: desiredTitle }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [principal?.id])

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

  const customVariableKeys = useMemo(() => {
    if (!document) return [] as string[]
    const reserved = new Set(['domains', DETAILS_KEY])
    const found = new Set<string>()
    for (const section of document.sections) {
      for (const key of extractPlaceholders(section.content)) {
        if (key.includes('.')) continue
        if (reserved.has(key)) continue
        found.add(key)
      }
    }
    return Array.from(found).sort()
  }, [document])

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

  function handlePrincipalChange(ids: string[]) {
    applyChange((doc) => setActor(doc, 'ממנה', ids))
  }

  function handleAttorneysChange(ids: string[]) {
    applyChange((doc) => setActor(doc, 'מיופה', ids))
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
    const idx = TABS.findIndex((t) => t.id === activeTab)
    if (idx > 0) setActiveTab(TABS[idx - 1].id)
  }

  function handleNext() {
    const idx = TABS.findIndex((t) => t.id === activeTab)
    if (idx < TABS.length - 1) setActiveTab(TABS[idx + 1].id)
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
    if (principal) {
      lines.push(
        `הממנה: ${principal.firstName} ${principal.lastName}, ת.ז. ${principal.idNumber}`
      )
    } else {
      lines.push('הממנה: [טרם נבחר]')
    }
    if (attorneys.length > 0) {
      const role =
        attorneys.length > 1
          ? 'מיופי הכוח'
          : attorneys[0].gender === 'female'
            ? 'מיופת הכוח'
            : 'מיופה הכוח'
      const names = attorneys
        .map((a) => `${a.firstName} ${a.lastName} (ת.ז. ${a.idNumber})`)
        .join(', ')
      lines.push(`${role}: ${names}`)
    } else {
      lines.push('מיופי הכוח: [טרם נבחרו]')
    }
    return lines.join('\n')
  })()

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <TitleBar />
      <DocumentHeader
        documentType="ייפוי כוח מתמשך"
        documentName={document.title}
        clientName={client?.displayName ?? '—'}
        openedAt={document.createdAt}
        onExport={handleExport}
        isExporting={isExporting}
        canExport={hasContent}
      />
      <StepTabs activeId={activeTab} onChange={setActiveTab} />

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
        <FormPanel
          stepTitle={STEP_META[activeTab].title}
          stepDescription={STEP_META[activeTab].description}
        >
          {activeTab === 'principal' && (
            <PrincipalTab
              clientId={clientId}
              selectedIds={principalIds}
              onChange={handlePrincipalChange}
              onPersonCreated={handlePersonCreated}
              attorneyIds={attorneyIds}
              principal={principal}
            />
          )}
          {activeTab === 'attorneys' && (
            <AttorneysTab
              clientId={clientId}
              selectedIds={attorneyIds}
              onChange={handleAttorneysChange}
              onPersonCreated={handlePersonCreated}
              principalIds={principalIds}
              attorneys={attorneys}
            />
          )}
          {activeTab === 'powers' && (
            <PowersTab
              selectedDomains={allowedDomains}
              onToggle={handleDomainToggle}
            />
          )}
          {activeTab === 'details' && (
            <DetailsTab
              details={details}
              onChange={handleDetailsChange}
              customVariableKeys={customVariableKeys}
              variables={document.variables}
              onVariableChange={handleVariableChange}
            />
          )}
          {activeTab === 'directives' && (
            <DirectivesTab
              availableSections={availableSections}
              selectedSections={document.sections}
              onAdd={handleAddSection}
              onRemove={handleRemoveSection}
              onMoveUp={(id) => handleMoveSection(id, -1)}
              onMoveDown={(id) => handleMoveSection(id, 1)}
              allowedDomains={allowedDomains}
            />
          )}
          {activeTab === 'signature' && (
            <SignatureTab
              status={document.status}
              onStatusChange={handleStatusChange}
              principalName={
                principal ? `${principal.firstName} ${principal.lastName}` : null
              }
              attorneyNames={attorneys.map(
                (a) => `${a.firstName} ${a.lastName}`
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
                prevDisabled={activeTab === 'principal'}
              nextDisabled={activeTab === 'signature'}
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
