'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { SectionEditor } from '@/components/library/SectionEditor'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TopNav } from '@/components/layout/TopNav'
import { deleteUserTemplate, getTemplates } from '@/lib/db/templates'
import { createClient } from '@/lib/db/supabase'
import { useHiddenSections } from '@/lib/hooks/useHiddenSections'
import { useUser } from '@/lib/hooks/useUser'
import {
  CATEGORY_LABELS,
  sectionLibrary,
  type LibrarySection,
} from '@/lib/sections/library'
import type { DocumentType, SectionTemplate } from '@/lib/types'

interface UnifiedSection {
  id: string
  dbId?: string
  title: string
  description: string
  category: DocumentType
  tags: string[]
  variants: Array<{ id: string; label: string; content: string }>
  isSystem: boolean
}

function systemToUnified(s: LibrarySection): UnifiedSection {
  return {
    id: `system-${s.sectionId}`,
    title: s.title,
    description: s.description,
    category: s.category,
    tags: s.tags,
    variants: s.variants,
    isSystem: true,
  }
}

function userToUnified(t: SectionTemplate): UnifiedSection {
  return {
    id: `user-${t.id}`,
    dbId: t.id,
    title: t.title,
    description: t.description,
    category: t.category,
    tags: t.tags,
    variants: t.variants,
    isSystem: false,
  }
}

const CATEGORIES: Array<DocumentType | 'all'> = [
  'all',
  'poa-property',
  'poa-personal',
  'poa-medical',
  'fee-agreement',
  'will-individual',
  'will-mutual',
]

export default function LibraryPage() {
  const { user, loading: userLoading } = useUser()

  const [userSections, setUserSections] = useState<UnifiedSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState('')
  const [category, setCategory] = useState<DocumentType | 'all'>('all')
  const [showSystem, setShowSystem] = useState(true)
  const [showUser, setShowUser] = useState(true)
  const [showHidden, setShowHidden] = useState(false)
  const { hiddenIds, hide, unhide, isHidden } = useHiddenSections()

  const [editorOpen, setEditorOpen] = useState(false)
  const [previewSection, setPreviewSection] = useState<UnifiedSection | null>(
    null
  )
  const [sectionToDelete, setSectionToDelete] = useState<UnifiedSection | null>(
    null
  )
  const [isDeleting, setIsDeleting] = useState(false)

  const loadUserSections = useCallback(async () => {
    if (!user) {
      setUserSections([])
      return
    }
    try {
      const supabase = createClient()
      const templates = await getTemplates(supabase, {
        isSystem: false,
        userId: user.id,
      })
      setUserSections(templates.map(userToUnified))
      setError(null)
    } catch {
      setError('שגיאה בטעינת הסעיפים האישיים')
    }
  }, [user])

  useEffect(() => {
    if (userLoading) return
    if (!user) {
      Promise.resolve().then(() => {
        setUserSections([])
        setIsLoading(false)
      })
      return
    }

    let cancelled = false
    const supabase = createClient()
    getTemplates(supabase, { isSystem: false, userId: user.id })
      .then((templates) => {
        if (cancelled) return
        setUserSections(templates.map(userToUnified))
        setError(null)
        setIsLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError('שגיאה בטעינת הסעיפים האישיים')
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, userLoading])

  async function handleDelete() {
    if (!sectionToDelete?.dbId) return
    setIsDeleting(true)
    try {
      const supabase = createClient()
      await deleteUserTemplate(supabase, sectionToDelete.dbId)
      setSectionToDelete(null)
      await loadUserSections()
    } catch {
      setError('שגיאה במחיקת הסעיף')
    } finally {
      setIsDeleting(false)
    }
  }

  const systemSections = useMemo(
    () => sectionLibrary.map(systemToUnified),
    []
  )

  const allSections = useMemo(() => {
    const list: UnifiedSection[] = []
    if (showSystem) list.push(...systemSections)
    if (showUser) list.push(...userSections)
    return list
  }, [systemSections, userSections, showSystem, showUser])

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return allSections.filter((s) => {
      if (category !== 'all' && s.category !== category) return false
      if (s.isSystem) {
        const sectionId = s.id.replace(/^system-/, '')
        const hidden = isHidden(sectionId)
        if (hidden && !showHidden) return false
      }
      if (!term) return true
      const haystack = [
        s.title,
        s.description,
        ...s.tags,
        ...s.variants.map((v) => v.content),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [allSections, searchTerm, category, isHidden, showHidden])

  const inputStyle: React.CSSProperties = {
    padding: '9px 12px',
    fontSize: 13,
    backgroundColor: '#fff',
    border: '0.5px solid var(--border-hover)',
    borderRadius: 4,
    color: 'var(--text-primary)',
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      <TopNav />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div style={{ marginBottom: 22 }}>
          <h1
            style={{
              margin: '0 0 4px',
              fontSize: 22,
              fontWeight: 500,
              color: 'var(--text-primary)',
            }}
          >
            ספריית סעיפים
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--text-secondary)',
            }}
          >
            סעיפים מוכנים מראש לשילוב במסמכים, ותבניות מותאמות אישית.
          </p>
        </div>
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש בכותרת, תיאור, תגיות, תוכן..."
              className="flex-1 w-full"
              style={inputStyle}
            />
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as DocumentType | 'all')
              }
              className="w-full lg:w-auto"
              style={inputStyle}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'כל הקטגוריות' : CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            <div className="flex gap-3" style={{ fontSize: 13 }}>
              <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showSystem}
                  onChange={(e) => setShowSystem(e.target.checked)}
                  style={{ width: 14, height: 14 }}
                />
                <span>מערכת</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showUser}
                  onChange={(e) => setShowUser(e.target.checked)}
                  style={{ width: 14, height: 14 }}
                />
                <span>שלי</span>
              </label>
              <label
                className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title={`כרגע ${hiddenIds.size} סעיפי מערכת מוסתרים`}
              >
                <input
                  type="checkbox"
                  checked={showHidden}
                  onChange={(e) => setShowHidden(e.target.checked)}
                  style={{ width: 14, height: 14 }}
                />
                <span>הצג מוסתרים ({hiddenIds.size})</span>
              </label>
            </div>
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              disabled={!user}
              style={{
                padding: '9px 18px',
                fontSize: 13,
                fontWeight: 500,
                backgroundColor: 'var(--color-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                whiteSpace: 'nowrap',
                cursor: !user ? 'not-allowed' : 'pointer',
                opacity: !user ? 0.5 : 1,
              }}
            >
              + סעיף חדש
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              marginBottom: 20,
              padding: '12px 16px',
              backgroundColor: '#FEE2E2',
              border: '0.5px solid #FCA5A5',
              color: '#991B1B',
              borderRadius: 4,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <div
            className="text-center py-12"
            style={{ color: 'var(--text-muted)', fontSize: 13 }}
          >
            טוען סעיפים...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: 'var(--text-primary)',
                margin: '0 0 8px',
              }}
            >
              לא נמצאו סעיפים
            </p>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              נסי לשנות את הסינון או צרי סעיף חדש.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="relative"
                style={{
                  backgroundColor: '#fff',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  transition: 'border-color 120ms',
                }}
              >
                <button
                  type="button"
                  onClick={() => setPreviewSection(s)}
                  className="text-right w-full"
                  style={{
                    padding: 16,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    className="flex items-start justify-between gap-2 mb-2"
                    style={{ paddingLeft: 28 }}
                  >
                    <h3
                      className="doc-title flex-1"
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: 'var(--color-primary)',
                        margin: 0,
                      }}
                    >
                      {s.title}
                    </h3>
                    <span
                      style={{
                        fontSize: 10,
                        padding: '2px 6px',
                        borderRadius: 3,
                        flexShrink: 0,
                        backgroundColor: s.isSystem ? '#F3F4F6' : '#FEF3C7',
                        color: s.isSystem ? '#6B7280' : '#92660A',
                      }}
                    >
                      {s.isSystem ? 'מערכת' : 'שלי'}
                    </span>
                  </div>
                  {s.description && (
                    <p
                      className="line-clamp-2"
                      style={{
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        margin: '0 0 12px',
                      }}
                    >
                      {s.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    <span
                      style={{
                        fontSize: 10,
                        padding: '2px 6px',
                        borderRadius: 3,
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {CATEGORY_LABELS[s.category]}
                    </span>
                    {s.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 3,
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
                {!s.isSystem && (
                  <button
                    type="button"
                    onClick={() => setSectionToDelete(s)}
                    aria-label={`מחק את ${s.title}`}
                    title="מחק סעיף"
                    className="absolute"
                    style={{
                      top: 12,
                      left: 12,
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 16,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                )}
                {s.isSystem && (() => {
                  const sectionId = s.id.replace(/^system-/, '')
                  const isCurrentlyHidden = isHidden(sectionId)
                  return (
                    <button
                      type="button"
                      onClick={() =>
                        isCurrentlyHidden ? unhide(sectionId) : hide(sectionId)
                      }
                      aria-label={
                        isCurrentlyHidden
                          ? `החזר את ${s.title}`
                          : `הסתר את ${s.title}`
                      }
                      title={isCurrentlyHidden ? 'החזר מהמוסתרים' : 'הסתר סעיף'}
                      className="absolute"
                      style={{
                        top: 12,
                        left: 12,
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isCurrentlyHidden
                          ? 'var(--color-accent)'
                          : 'var(--text-muted)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: 4,
                        fontSize: 14,
                        lineHeight: 1,
                      }}
                    >
                      {isCurrentlyHidden ? '↩' : '×'}
                    </button>
                  )
                })()}
                {s.isSystem && (() => {
                  const sectionId = s.id.replace(/^system-/, '')
                  return isHidden(sectionId) ? (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(244, 239, 230, 0.6)',
                        borderRadius: 8,
                        pointerEvents: 'none',
                      }}
                    />
                  ) : null
                })()}
              </div>
            ))}
          </div>
        )}
      </div>

      <SectionEditor
        open={editorOpen}
        userId={user?.id ?? null}
        onClose={() => setEditorOpen(false)}
        onSaved={() => {
          void loadUserSections()
        }}
      />

      <ConfirmDialog
        open={Boolean(sectionToDelete)}
        title="מחיקת סעיף"
        message={
          sectionToDelete
            ? `האם את/ה בטוח/ה שברצונך למחוק את "${sectionToDelete.title}"? לא ניתן לשחזר.`
            : ''
        }
        confirmLabel="מחק"
        destructive
        isProcessing={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setSectionToDelete(null)}
      />

      {previewSection && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ backgroundColor: 'rgba(15, 42, 91, 0.4)' }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="max-w-3xl w-full my-8 relative"
            style={{
              backgroundColor: '#fff',
              borderRadius: 8,
              padding: 28,
            }}
          >
            <button
              type="button"
              onClick={() => setPreviewSection(null)}
              aria-label="סגירה"
              className="absolute top-3 left-3"
              style={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              ×
            </button>
            <div className="flex items-start gap-3 mb-3">
              <h2
                className="doc-title flex-1"
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  color: 'var(--color-primary)',
                  margin: 0,
                }}
              >
                {previewSection.title}
              </h2>
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 3,
                  backgroundColor: previewSection.isSystem
                    ? '#F3F4F6'
                    : '#FEF3C7',
                  color: previewSection.isSystem ? '#6B7280' : '#92660A',
                }}
              >
                {previewSection.isSystem ? 'מערכת' : 'שלי'}
              </span>
            </div>
            {previewSection.description && (
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  marginBottom: 16,
                }}
              >
                {previewSection.description}
              </p>
            )}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  marginBottom: 8,
                }}
              >
                תוכן (עם placeholders):
              </div>
              {previewSection.variants.map((v) => (
                <div
                  key={v.id}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '0.5px solid var(--border-default)',
                    borderRadius: 4,
                    padding: 14,
                    marginBottom: 8,
                  }}
                >
                  {previewSection.variants.length > 1 && (
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: 'var(--text-secondary)',
                        marginBottom: 6,
                      }}
                    >
                      {v.label}
                    </div>
                  )}
                  <pre
                    className="whitespace-pre-wrap"
                    style={{
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      fontFamily: 'inherit',
                      margin: 0,
                    }}
                  >
                    {v.content}
                  </pre>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 3,
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                }}
              >
                {CATEGORY_LABELS[previewSection.category]}
              </span>
              {previewSection.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 3,
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
