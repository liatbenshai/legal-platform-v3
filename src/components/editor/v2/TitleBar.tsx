export function TitleBar() {
  return (
    <div
      className="flex items-center px-3.5 text-white"
      style={{
        height: 36,
        backgroundColor: 'var(--bg-titlebar)',
        paddingTop: 10,
        paddingBottom: 10,
      }}
    >
      <div className="flex gap-1.5 flex-shrink-0">
        <span
          className="rounded-full"
          style={{ width: 11, height: 11, backgroundColor: '#ED6A5E' }}
        />
        <span
          className="rounded-full"
          style={{ width: 11, height: 11, backgroundColor: '#F5BF4F' }}
        />
        <span
          className="rounded-full"
          style={{ width: 11, height: 11, backgroundColor: '#62C554' }}
        />
      </div>
      <div
        className="flex-1 text-center"
        style={{
          color: '#DCE5F3',
          fontSize: 12,
          letterSpacing: '0.3px',
        }}
      >
        משרד עורך דין · עורך מסמכים
      </div>
      <div style={{ width: 51 }} />
    </div>
  )
}
