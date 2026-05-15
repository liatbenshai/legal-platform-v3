'use client'

import type { DocumentSection } from '@/lib/types'

interface SelectedSectionsProps {
  sections: DocumentSection[]
  onRemove: (sectionId: string) => void
  onMoveUp: (sectionId: string) => void
  onMoveDown: (sectionId: string) => void
}

export function SelectedSections({
  sections,
  onRemove,
  onMoveUp,
  onMoveDown,
}: SelectedSectionsProps) {
  const sorted = [...sections].sort((a, b) => a.order - b.order)

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <h2 className="font-bold text-slate-800">
          סעיפים נבחרים ({sorted.length})
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-12 px-4">
            בחר/י סעיפים מהספרייה משמאל כדי להתחיל לבנות את המסמך.
          </p>
        ) : (
          sorted.map((s, index) => {
            const isFirst = index === 0
            const isLast = index === sorted.length - 1
            return (
              <div
                key={s.id}
                className="border border-slate-200 rounded-lg p-3 bg-slate-50"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-slate-200 text-slate-700 rounded-full text-xs font-medium">
                      {index + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-800 truncate">
                      {s.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(s.id)}
                    aria-label="הסר סעיף"
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => onMoveUp(s.id)}
                    disabled={isFirst}
                    aria-label="הזז למעלה"
                    className="flex-1 text-xs py-1 border border-slate-300 rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveDown(s.id)}
                    disabled={isLast}
                    aria-label="הזז למטה"
                    className="flex-1 text-xs py-1 border border-slate-300 rounded hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ↓
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
