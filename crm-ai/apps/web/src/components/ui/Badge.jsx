export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-[var(--bg-secondary)] text-[var(--text-muted)]',
    success: 'bg-[var(--success)]/10 text-[var(--success)]',
    warning: 'bg-[var(--warning)]/10 text-[var(--warning)]',
    danger: 'bg-[var(--danger)]/10 text-[var(--danger)]',
    accent: 'bg-[var(--accent)]/10 text-[var(--accent)]',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
