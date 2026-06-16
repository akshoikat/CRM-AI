import { useEffect, useReducer } from 'react'
import { CheckCircle2, XCircle, RefreshCw, Loader2, Palette, Server, Mail, MessageSquare, ShieldCheck } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useTheme } from '../../contexts/ThemeContext'
import { getSettings, testConnections } from '../../api/settings'

/* ---------- Theme card ---------- */

const themePreview = {
  navy: { primary: '#1e3a5f', accent: '#3b82f6', bg: '#ffffff', text: '#1e293b' },
  dark: { primary: '#1e293b', accent: '#60a5fa', bg: '#0f172a', text: '#f1f5f9' },
  light: { primary: '#6366f1', accent: '#6366f1', bg: '#ffffff', text: '#111827' },
}

function ThemeCard({ name, active, onClick }) {
  const preview = themePreview[name]
  return (
    <button
      onClick={onClick}
      className={`relative rounded-xl border-2 p-4 text-left transition-all cursor-pointer ${
        active ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20' : 'border-[var(--border)] hover:border-[var(--text-muted)]'
      }`}
    >
      {active && (
        <div className="absolute top-2 right-2">
          <CheckCircle2 size={18} className="text-[var(--primary)]" />
        </div>
      )}
      <div className="flex gap-2 mb-3">
        <div className="h-8 w-8 rounded-full" style={{ backgroundColor: preview.primary }} />
        <div className="h-8 w-8 rounded-full" style={{ backgroundColor: preview.accent }} />
      </div>
      <p className="text-sm font-medium text-[var(--text)] capitalize">{name}</p>
      <div className="mt-2 flex gap-1.5">
        <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: preview.bg, border: '1px solid var(--border)' }} />
        <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: preview.text, opacity: 0.2 }} />
      </div>
    </button>
  )
}

/* ---------- Service status icon ---------- */

function ServiceIcon({ type }) {
  if (type?.toLowerCase().includes('gmail') || type?.toLowerCase().includes('email')) return <Mail size={20} />
  if (type?.toLowerCase().includes('whatsapp')) return <MessageSquare size={20} />
  return <Server size={20} />
}

/* ---------- Settings page ---------- */

function settingsReducer(state, action) {
  switch (action.type) {
    case 'SET': return { ...state, data: action.payload, loading: false }
    case 'ERROR': return { ...state, loading: false, error: action.payload }
    case 'TEST_START': return { ...state, testing: true, testResult: null }
    case 'TEST_DONE': return { ...state, testing: false, testResult: action.payload }
    default: return state
  }
}

export default function Settings() {
  const { theme, setTheme, themes } = useTheme()
  const [{ data, loading, error, testing, testResult }, dispatch] = useReducer(settingsReducer, {
    data: null, loading: true, error: '', testing: false, testResult: null,
  })

  useEffect(() => {
    let cancelled = false
    getSettings()
      .then((res) => { if (!cancelled) dispatch({ type: 'SET', payload: res.data }) })
      .catch(() => { if (!cancelled) dispatch({ type: 'ERROR', payload: 'Failed to load settings' }) })
    return () => { cancelled = true }
  }, [])

  const handleTest = async () => {
    dispatch({ type: 'TEST_START' })
    try {
      const res = await testConnections()
      dispatch({ type: 'TEST_DONE', payload: res.data })
    } catch {
      dispatch({ type: 'TEST_DONE', payload: { error: 'Test request failed' } })
    }
  }

  /* Extract service statuses from API response */
  const services = (() => {
    if (!data) return []
    const raw = data.credentials || data.services || data || []
    if (Array.isArray(raw)) return raw
    return Object.entries(raw).map(([key, val]) => ({
      name: key,
      status: typeof val === 'object' ? val.status : val,
      details: typeof val === 'object' ? val : null,
    }))
  })()

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text)]">Settings</h2>
        <p className="text-sm text-[var(--text-muted)]">Manage credentials, connections, and appearance.</p>
      </div>

      {/* ---------- Theme ---------- */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Palette size={18} className="text-[var(--text-muted)]" />
          <h3 className="text-sm font-semibold text-[var(--text)]">Theme</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {themes.map((t) => (
            <ThemeCard key={t} name={t} active={theme === t} onClick={() => setTheme(t)} />
          ))}
        </div>
      </div>

      {/* ---------- Credential Statuses ---------- */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-[var(--text-muted)]" />
            <h3 className="text-sm font-semibold text-[var(--text)]">Service Credentials</h3>
          </div>
        </div>

        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-[var(--accent)]" />
            </div>
          ) : error ? (
            <p className="text-sm text-[var(--danger)]">{error}</p>
          ) : services.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No credential data available.</p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {services.map((s, i) => {
                const ok = s.status === 'ok' || s.status === 'connected' || s.status === true
                return (
                  <div key={s.name || i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <ServiceIcon type={s.name} />
                      <div>
                        <p className="text-sm font-medium text-[var(--text)]">{s.name}</p>
                        {s.details?.message && (
                          <p className="text-xs text-[var(--text-muted)]">{s.details.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={ok ? 'success' : 'danger'}>
                        {ok ? 'Connected' : 'Disconnected'}
                      </Badge>
                      {ok ? (
                        <CheckCircle2 size={16} className="text-[var(--success)]" />
                      ) : (
                        <XCircle size={16} className="text-[var(--danger)]" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ---------- Test Connections ---------- */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw size={18} className="text-[var(--text-muted)]" />
          <h3 className="text-sm font-semibold text-[var(--text)]">Test Connections</h3>
        </div>
        <Card>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Verify that all configured services are reachable and working.
          </p>
          <Button onClick={handleTest} disabled={testing}>
            {testing ? (
              <><Loader2 size={16} className="animate-spin" /> Testing...</>
            ) : (
              <><RefreshCw size={16} /> Run Connection Test</>
            )}
          </Button>
          {testResult && (
            <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
              <pre className="text-xs text-[var(--text)] whitespace-pre-wrap font-mono">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
