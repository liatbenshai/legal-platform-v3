'use client'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  isProcessing?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'אישור',
  cancelLabel = 'ביטול',
  destructive = false,
  isProcessing = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  const confirmClasses = destructive
    ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
    : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2
          id="confirm-dialog-title"
          className="text-xl font-bold text-slate-800 mb-3"
        >
          {title}
        </h2>
        <p className="text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-5 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={`px-5 py-2 text-white font-medium rounded-lg transition-colors ${confirmClasses}`}
          >
            {isProcessing ? 'מבצע...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
