'use client'

interface NewClientModalProps {
  open: boolean
  onClose: () => void
}

export function NewClientModal({ open, onClose }: NewClientModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-client-title"
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="סגירה"
          className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full text-2xl leading-none"
        >
          ×
        </button>

        <h2
          id="new-client-title"
          className="text-2xl font-bold text-slate-800 mb-2 text-center"
        >
          לקוח חדש
        </h2>
        <p className="text-slate-500 text-center text-sm mb-6">
          טופס יצירת תיק לקוח חדש
        </p>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="display-name"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              שם התיק
            </label>
            <input
              id="display-name"
              type="text"
              placeholder="לדוגמה: משפחת כהן"
              disabled
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-400"
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              הערות (אופציונלי)
            </label>
            <textarea
              id="notes"
              rows={3}
              placeholder="הערות פנימיות על התיק"
              disabled
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-400 resize-none"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            הטופס יוטמע בשלב הבא. כרגע ניתן רק לסגור את החלון.
          </div>
        </div>
      </div>
    </div>
  )
}
