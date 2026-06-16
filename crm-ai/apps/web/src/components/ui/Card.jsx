export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
