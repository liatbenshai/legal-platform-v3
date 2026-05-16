'use client'

interface StepNavigationProps {
  onPrev: () => void
  onNext: () => void
  prevDisabled?: boolean
  nextDisabled?: boolean
  nextLabel?: string
}

export function StepNavigation({
  onPrev,
  onNext,
  prevDisabled = false,
  nextDisabled = false,
  nextLabel = 'הבא',
}: StepNavigationProps) {
  return (
    <div
      className="flex justify-between items-center"
      style={{
        borderTop: '1px solid var(--border-default)',
        paddingTop: 18,
      }}
    >
      <button
        type="button"
        onClick={onPrev}
        disabled={prevDisabled}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          fontSize: 13,
          cursor: prevDisabled ? 'not-allowed' : 'pointer',
          opacity: prevDisabled ? 0.4 : 1,
        }}
      >
        → הקודם
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        style={{
          backgroundColor: 'var(--color-primary)',
          color: '#fff',
          padding: '10px 18px',
          borderRadius: 4,
          fontSize: 13,
          fontWeight: 500,
          opacity: nextDisabled ? 0.5 : 1,
          cursor: nextDisabled ? 'not-allowed' : 'pointer',
        }}
      >
        {nextLabel} ←
      </button>
    </div>
  )
}
