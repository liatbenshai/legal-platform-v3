'use client'

import { useMemo, useState } from 'react'
import {
  CATEGORY_LABELS,
  type LibrarySection,
} from '@/lib/sections/library'
import type { DocumentType } from '@/lib/types'

interface SectionLibraryProps {
  sections: LibrarySection[]
  selectedTemplateIds: string[]
  onAdd: (section: LibrarySection) => void
}

const CATEGORIES: Array<DocumentType | 'all'> = [
  'all',
  'poa-property',
  'poa-personal',
  'poa-medical',
]

export function SectionLibrary({
  sections,
  selectedTemplateIds,
  onAdd,
}: SectionLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [category, setCategory] = useState<DocumentType | 'all'>('all')

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return sections.filter((s) => {
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
  }, [sections, searchTerm, category])

  return (
    <aside className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-200 space-y-3">
        <h2 className="font-bold text-slate-800">ספריית סעיפים</h2>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="חיפוש..."
          className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value as DocumentType | 'all')
          }
          className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'כל הקטגוריות' : CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">
            לא נמצאו סעיפים
          </p>
        ) : (
          filtered.map((s) => {
            const isAdded = selectedTemplateIds.includes(s.sectionId)
            return (
              <div
                key={s.sectionId}
                className="border border-slate-200 rounded-lg p-3 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-slate-800 flex-1">
                    {s.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => onAdd(s)}
                    disabled={isAdded}
                    aria-label={isAdded ? 'כבר נוסף' : 'הוסף סעיף'}
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white text-lg leading-none disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    {isAdded ? '✓' : '+'}
                  </button>
                </div>
                {s.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                    {s.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {CATEGORY_LABELS[s.category]}
                  </span>
                  {s.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}
