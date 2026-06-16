import { useState, useEffect, useMemo, useReducer } from 'react'
import { Search, Plus, Pencil, Code2, Mail, Phone, Briefcase, AlertCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { listDevelopers, createDeveloper, updateDeveloper } from '../../api/developers'
import DeveloperForm from './DeveloperForm'

const initial = { developers: [], loading: true, error: '' }
function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_SUCCESS': return { developers: action.payload, loading: false, error: '' }
    case 'FETCH_ERROR': return { developers: [], loading: false, error: action.payload }
    default: return state
  }
}

export default function DeveloperList() {
  const [{ developers, loading, error }, dispatch] = useReducer(reducer, initial)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [fetchToken, setFetchToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    listDevelopers()
      .then((res) => { if (!cancelled) dispatch({ type: 'FETCH_SUCCESS', payload: Array.isArray(res.data) ? res.data : [] }) })
      .catch(() => { if (!cancelled) dispatch({ type: 'FETCH_ERROR', payload: 'Failed to load developers' }) })
    return () => { cancelled = true }
  }, [fetchToken])

  const refetch = () => setFetchToken((k) => k + 1)

  const filtered = useMemo(() => {
    return developers.filter((d) => {
      const matchSearch = !search ||
        [d.name, d.email, d.phone, d.role].some((f) => f?.toLowerCase().includes(search.toLowerCase()))
      const matchStatus = !statusFilter || d.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [developers, search, statusFilter])

  const handleCreate = async (data) => {
    await createDeveloper(data)
    setFormOpen(false)
    refetch()
  }

  const handleUpdate = async (data) => {
    await updateDeveloper(editing.id, data)
    setEditing(null)
    refetch()
  }

  const statuses = useMemo(() => {
    const s = new Set(developers.map((d) => d.status).filter(Boolean))
    return ['', ...s]
  }, [developers])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text)]">Developers</h2>
          <p className="text-sm text-[var(--text-muted)]">
            {loading ? '...' : `${filtered.length} developer${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus size={16} /> New Developer
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <Search size={16} className="text-[var(--text-muted)] shrink-0" />
          <input
            placeholder="Search by name, email, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[200px] flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <option value="">All statuses</option>
            {statuses.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--border)]" />)}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-6 text-sm text-[var(--danger)]">
            <AlertCircle size={16} /> {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-muted)]">
            {search || statusFilter ? 'No developers match your filters.' : 'No developers yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-medium text-[var(--text-muted)]">
                  <th className="px-4 py-3">Developer</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--bg-secondary)]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Code2 size={16} className="text-[var(--text-muted)] shrink-0" />
                        <span className="font-medium text-[var(--text)]">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {d.email ? (
                        <span className="flex items-center gap-1 text-[var(--text-muted)]">
                          <Mail size={14} /> {d.email}
                        </span>
                      ) : <span className="text-[var(--text-muted)]">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {d.phone ? (
                        <span className="flex items-center gap-1 text-[var(--text-muted)]">
                          <Phone size={14} /> {d.phone}
                        </span>
                      ) : <span className="text-[var(--text-muted)]">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-[var(--text-muted)]">
                        <Briefcase size={14} /> {d.role || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${d.status === 'available' ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`} />
                        <Badge variant={d.status === 'available' ? 'success' : 'danger'}>
                          {d.status || 'unknown'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(d)} title="Edit">
                        <Pencil size={15} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {formOpen && (
        <DeveloperForm developer={null} onSubmit={handleCreate} onClose={() => setFormOpen(false)} />
      )}
      {editing && (
        <DeveloperForm developer={editing} onSubmit={handleUpdate} onClose={() => setEditing(null)} />
      )}
    </div>
  )
}
