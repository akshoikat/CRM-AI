import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { Sun, Moon, Monitor } from 'lucide-react'

const themeIcons = { navy: Monitor, dark: Moon, light: Sun }

export function Navbar() {
  const { user } = useAuth()
  const { theme, setTheme, themes } = useTheme()
  const currentIdx = themes.indexOf(theme)
  const ThemeIcon = themeIcons[theme]

  const cycleTheme = () => {
    const next = (currentIdx + 1) % themes.length
    setTheme(themes[next])
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--bg)] px-6">
      <h1 className="text-sm font-medium text-[var(--text-muted)]">
        Welcome back, {user?.name || 'User'}
      </h1>
      <div className="flex items-center gap-3">
        <button
          onClick={cycleTheme}
          className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
          title={`Theme: ${theme}`}
        >
          <ThemeIcon size={18} />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-sm font-medium">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  )
}
