'use client'

import type { RenderedSection } from '@/lib/engine/renderer'

interface DocumentPreviewProps {
  title: string
  rendered: RenderedSection[]
}

export function DocumentPreview({ title, rendered }: DocumentPreviewProps) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <h2 className="font-bold text-slate-800">תצוגה מקדימה</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {rendered.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-12 px-4">
            התצוגה המקדימה תתעדכן כשתבחרי סעיפים.
          </p>
        ) : (
          <article className="max-w-prose mx-auto">
            <h1 className="text-2xl font-bold text-slate-800 mb-8 text-center border-b border-slate-200 pb-4">
              {title}
            </h1>
            {rendered.map((section, index) => (
              <div key={section.id} className="mb-6">
                <h2 className="text-base font-bold text-slate-800 mb-2">
                  {index + 1}. {section.title}
                </h2>
                <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {section.content}
                </div>
              </div>
            ))}
          </article>
        )}
      </div>
    </section>
  )
}
