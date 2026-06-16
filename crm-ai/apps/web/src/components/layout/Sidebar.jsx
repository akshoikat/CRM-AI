import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, FolderKanban, Code2, MessageSquare, Settings,
  ChevronLeft, ChevronRight, LogOut, Menu, X,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/clients', label: 'Clients', icon: Users },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/developers', label: 'Developers', icon: Code2 },
  { to: '/conversations', label: 'Conversations', icon: MessageSquare },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { logout } = useAuth()

  const linkClass = (to) => {
    const active = location.pathname === to
    return `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? 'bg-[var(--primary)] text-white'
        : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]'
    }`
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-[var(--border)] bg-[var(--bg)] transition-all duration-300 ${
          collapsed ? 'md:w-16' : 'md:w-60'
        } ${
          mobileOpen
            ? 'fixed inset-y-0 left-0 z-40 w-60 translate-x-0'
            : 'fixed inset-y-0 left-0 z-40 w-60 -translate-x-full md:relative md:translate-x-0'
        }`}
      >
        <div className="flex h-14 items-center border-b border-[var(--border)] px-4">
          {(!collapsed || mobileOpen) && (
            <span className="text-lg font-bold text-[var(--primary)]">CRM</span>
          )}
          <button
            onClick={() => { setCollapsed(!collapsed); setMobileOpen(false) }}
            className="ml-auto hidden md:block rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] cursor-pointer"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto md:hidden rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={linkClass(to)}
            >
              <Icon size={20} />
              {(!collapsed || mobileOpen) && <span>{label}</span>}
            </Link>
          ))}
        </nav>

        <div className="border-t border-[var(--border)] p-2">
          <button
            onClick={() => { logout(); setMobileOpen(false) }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--danger)] transition-colors cursor-pointer"
          >
            <LogOut size={20} />
            {(!collapsed || mobileOpen) && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile floating action button */}
      {!mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed bottom-4 left-4 z-20 flex md:hidden h-12 w-12 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-lg cursor-pointer"
        >
          <Menu size={22} />
        </button>
      )}
    </>
  )
}
