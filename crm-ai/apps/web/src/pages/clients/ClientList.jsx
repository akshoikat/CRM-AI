import { useState, useEffect, useMemo, useReducer } from 'react'
import { Search, Plus, Archive, Pencil, Building2, Mail, Phone, AlertCircle } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { listClients, createClient, updateClient, archiveClient } from '../../api/clients'
import ClientForm from './ClientForm'

const initialClientsState = { clients: [], loading: true, error: '' }
function clientsReducer(state, action) {
  switch (action.type) {
    case 'FETCH_SUCCESS': return { clients: action.payload, loading: false, error: '' }
    case 'FETCH_ERROR': return { clients: [], loading: false, error: action.payload }
    default: return state
  }
}

export default function ClientList() {
  const [{ clients, loading, error }, dispatch] = useReducer(clientsReducer, initialClientsState)
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [fetchToken, setFetchToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    listClients()
      .then((res) => { if (!cancelled) dispatch({ type: 'FETCH_SUCCESS', payload: Array.isArray(res.data) ? res.data : [] }) })
      .catch(() => { if (!cancelled) dispatch({ type: 'FETCH_ERROR', payload: 'Failed to load clients' }) })
    return () => { cancelled = true }
  }, [fetchToken])

  const refetch = () => setFetchToken((k) => k + 1)

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch = !search || 
        [c.name, c.email, c.company, c.phone].some((f) =>
          f?.toLowerCase().includes(search.toLowerCase())
        )
      const matchesArchive = showArchived ? true : !c.archivedAt && c.status !== 'archived'
      return matchesSearch && matchesArchive
    })
  }, [clients, search, showArchived])

  const handleCreate = async (data) => {
    await createClient(data)
    setFormOpen(false)
    refetch()
  }

  const handleUpdate = async (data) => {
    await updateClient(editing.id, data)
    setEditing(null)
    refetch()
  }

  const handleArchive = async (id) => {
    if (!confirm('Archive this client?')) return
    await archiveClient(id)
    refetch()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text)]">Clients</h2>
          <p className="text-sm text-[var(--text-muted)]">
            {loading ? '...' : `${filtered.length} client${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus size={16} /> New Client
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <Search size={16} className="text-[var(--text-muted)] shrink-0" />
          <input
            placeholder="Search by name, email, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          <label className="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            Show archived
          </label>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--border)]" />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-6 text-sm text-[var(--danger)]">
            <AlertCircle size={16} /> {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--text-muted)]">
            {search ? 'No clients match your search.' : 'No clients yet. Create your first client!'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-medium text-[var(--text-muted)]">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const archived = c.archivedAt || c.status === 'archived'
                  return (
                    <tr key={c.id} className={`border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--bg-secondary)] ${archived ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-[var(--text-muted)] shrink-0" />
                          <span className="font-medium text-[var(--text)]">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {c.email ? (
                          <span className="flex items-center gap-1 text-[var(--text-muted)]">
                            <Mail size={14} /> {c.email}
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {c.phone ? (
                          <span className="flex items-center gap-1 text-[var(--text-muted)]">
                            <Phone size={14} /> {c.phone}
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{c.company || '—'}</td>
                      <td className="px-4 py-3">
                        {archived ? (
                          <Badge variant="danger">Archived</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditing(c)}
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </Button>
                          {!archived && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleArchive(c.id)}
                              title="Archive"
                              className="text-[var(--text-muted)] hover:text-[var(--danger)]"
                            >
                              <Archive size={15} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {formOpen && (
        <ClientForm
          client={null}
          onSubmit={handleCreate}
          onClose={() => setFormOpen(false)}
        />
      )}
      {editing && (
        <ClientForm
          client={editing}
          onSubmit={handleUpdate}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
