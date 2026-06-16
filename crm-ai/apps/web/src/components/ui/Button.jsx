export function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer'
  const variants = {
    primary: 'bg-[var(--primary)] text-white hover:bg-[var(--primary-light)] focus:ring-[var(--primary)]',
    secondary: 'bg-[var(--bg-secondary)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--border)]',
    danger: 'bg-[var(--danger)] text-white hover:opacity-90 focus:ring-[var(--danger)]',
    ghost: 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)]',
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
