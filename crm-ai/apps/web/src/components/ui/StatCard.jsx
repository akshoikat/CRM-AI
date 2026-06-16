export function StatCard({ title, value, icon: Icon, variant = 'accent' }) {
  const colors = {
    accent: 'bg-[var(--accent)]/10 text-[var(--accent)]',
    success: 'bg-[var(--success)]/10 text-[var(--success)]',
    warning: 'bg-[var(--warning)]/10 text-[var(--warning)]',
    danger: 'bg-[var(--danger)]/10 text-[var(--danger)]',
  }
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)]">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text)]">{value}</p>
        </div>
        {Icon && (
          <div className={`rounded-lg p-3 ${colors[variant]}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  )
}
