import { useState, useEffect, useMemo, useReducer } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FolderKanban, Calendar, DollarSign, AlertCircle } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { listProjects } from '../../api/projects'

const badgeVariant = (status) => {
  switch (status) {
    case 'active': return 'success'
    case 'pending': return 'warning'
    case 'completed': return 'accent'
    case 'archived': return 'danger'
    default: return 'default'
  }
}

const initial = { projects: [], loading: true, error: '' }
function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_SUCCESS': return { projects: action.payload, loading: false, error: '' }
    case 'FETCH_ERROR': return { projects: [], loading: false, error: action.payload }
    default: return state
  }
}

function formatCurrency(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString()
}

export default function ProjectList() {
  const navigate = useNavigate()
  const [{ projects, loading, error }, dispatch] = useReducer(reducer, initial)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    let cancelled = false
    listProjects()
      .then((res) => { if (!cancelled) dispatch({ type: 'FETCH_SUCCESS', payload: Array.isArray(res.data) ? res.data : [] }) })
      .catch(() => { if (!cancelled) dispatch({ type: 'FETCH_ERROR', payload: 'Failed to load projects' }) })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.client?.name?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !statusFilter || p.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [projects, search, statusFilter])

  const statuses = useMemo(() => {
    const s = new Set(projects.map((p) => p.status).filter(Boolean))
    return ['', ...s]
  }, [projects])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text)]">Projects</h2>
          <p className="text-sm text-[var(--text-muted)]">
            {loading ? '...' : `${filtered.length} project${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <Search size={16} className="text-[var(--text-muted)] shrink-0" />
          <input
            placeholder="Search by project or client name..."
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
            {search || statusFilter ? 'No projects match your filters.' : 'No projects yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-medium text-[var(--text-muted)]">
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Budget</th>
                  <th className="px-4 py-3">Deadline</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="cursor-pointer border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--bg-secondary)]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FolderKanban size={16} className="text-[var(--text-muted)] shrink-0" />
                        <span className="font-medium text-[var(--text)]">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{p.client?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={badgeVariant(p.status)}>{p.status || 'unknown'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-[var(--text-muted)]">
                        <DollarSign size={14} /> {formatCurrency(p.budget)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-[var(--text-muted)]">
                        <Calendar size={14} /> {formatDate(p.deadline)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
