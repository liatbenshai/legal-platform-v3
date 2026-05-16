'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { SectionEditor } from '@/components/library/SectionEditor'
import { getTemplates } from '@/lib/db/templates'
import { createClient } from '@/lib/db/supabase'
import { useUser } from '@/lib/hooks/useUser'
import {
  CATEGORY_LABELS,
  sectionLibrary,
  type LibrarySection,
} from '@/lib/sections/library'
import type { DocumentType, SectionTemplate } from '@/lib/types'

interface UnifiedSection {
  id: string
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

  const [editorOpen, setEditorOpen] = useState(false)
  const [previewSection, setPreviewSection] = useState<UnifiedSection | null>(
    null
  )

  const loadUserSections = useCallback(async () => {
    if (!user) {
      setUserSections([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const templates = await getTemplates(supabase, {
        isSystem: false,
        userId: user.id,
      })
      setUserSections(templates.map(userToUnified))
    } catch {
      setError('שגיאה בטעינת הסעיפים האישיים')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (userLoading) return
    void loadUserSections()
  }, [userLoading, loadUserSections])

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
  }, [allSections, searchTerm, category])

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-slate-800">ספריית סעיפים</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              ← ללוח המחוונים
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חיפוש בכותרת, תיאור, תגיות, תוכן..."
              className="flex-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as DocumentType | 'all')
              }
              className="w-full lg:w-auto px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'all' ? 'כל הקטגוריות' : CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            <div className="flex gap-3 text-sm">
              <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showSystem}
                  onChange={(e) => setShowSystem(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>מערכת</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showUser}
                  onChange={(e) => setShowUser(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>שלי</span>
              </label>
            </div>
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              disabled={!user}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              + סעיף חדש
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
          >
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-slate-500">טוען סעיפים...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-700 text-lg font-medium">
              לא נמצאו סעיפים
            </p>
            <p className="text-slate-500 text-sm mt-2">
              נסה/י לשנות את הסינון או צור/י סעיף חדש.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setPreviewSection(s)}
                className="text-right bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-400 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-slate-800 flex-1">
                    {s.title}
                  </h3>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                      s.isSystem
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {s.isSystem ? 'מערכת' : 'שלי'}
                  </span>
                </div>
                {s.description && (
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                    {s.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
                    {CATEGORY_LABELS[s.category]}
                  </span>
                  {s.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
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

      {previewSection && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6 relative my-8">
            <button
              type="button"
              onClick={() => setPreviewSection(null)}
              aria-label="סגירה"
              className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full text-2xl leading-none"
            >
              ×
            </button>
            <div className="flex items-start gap-3 mb-4">
              <h2 className="text-xl font-bold text-slate-800 flex-1">
                {previewSection.title}
              </h2>
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  previewSection.isSystem
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {previewSection.isSystem ? 'מערכת' : 'שלי'}
              </span>
            </div>
            {previewSection.description && (
              <p className="text-sm text-slate-600 mb-4">
                {previewSection.description}
              </p>
            )}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                תוכן (עם placeholders):
              </h3>
              {previewSection.variants.map((v) => (
                <div
                  key={v.id}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-2"
                >
                  {previewSection.variants.length > 1 && (
                    <p className="text-xs font-medium text-slate-500 mb-2">
                      {v.label}
                    </p>
                  )}
                  <pre className="whitespace-pre-wrap text-sm text-slate-800 font-sans">
                    {v.content}
                  </pre>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                {CATEGORY_LABELS[previewSection.category]}
              </span>
              {previewSection.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded"
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
