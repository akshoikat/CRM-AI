import { useState, useEffect } from 'react'
import { Shield, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { listAgents, seedAgents } from '../../api/agents'
import api from '../../api/axios'

export default function AdminPanel() {
  const [agents, setAgents] = useState([])
  const [approvals, setApprovals] = useState([])
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [tab, setTab] = useState('agents')
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [fetchToken, setFetchToken] = useState(0)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      listAgents(),
      api.get('/approvals'),
      api.get('/approvals/stats/summary'),
    ])
      .then(([aRes, appRes, statsRes]) => {
        setAgents(Array.isArray(aRes.data) ? aRes.data : [])
        setApprovals(Array.isArray(appRes.data) ? appRes.data : [])
        setStats(statsRes.data || { pending: 0, approved: 0, rejected: 0 })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [fetchToken])

  const handleSeed = async () => {
    setSeeding(true)
    try { await seedAgents(); setFetchToken((k) => k + 1) } catch {}
    finally { setSeeding(false) }
  }

  const handleApprove = async (id) => {
    try {
      await api.patch(`/approvals/${id}/approve`, { approvedBy: 'admin' })
      setFetchToken((k) => k + 1)
    } catch {}
  }

  const handleReject = async (id) => {
    try {
      await api.patch(`/approvals/${id}/reject`, { approvedBy: 'admin' })
      setFetchToken((k) => k + 1)
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text)]">Admin Panel</h2>
          <p className="text-sm text-[var(--text-muted)]">Manage agents, approvals, and system configuration</p>
        </div>
        <Button onClick={handleSeed} disabled={seeding}>
          <RefreshCw size={16} className={seeding ? 'animate-spin' : ''} /> {seeding ? 'Seeding...' : 'Seed Agents'}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 text-center">
          <Clock size={20} className="mx-auto mb-1 text-amber-500" />
          <div className="text-2xl font-bold text-[var(--text)]">{stats.pending}</div>
          <div className="text-xs text-[var(--text-muted)]">Pending Approvals</div>
        </Card>
        <Card className="p-4 text-center">
          <CheckCircle size={20} className="mx-auto mb-1 text-emerald-500" />
          <div className="text-2xl font-bold text-[var(--text)]">{stats.approved}</div>
          <div className="text-xs text-[var(--text-muted)]">Approved</div>
        </Card>
        <Card className="p-4 text-center">
          <XCircle size={20} className="mx-auto mb-1 text-red-500" />
          <div className="text-2xl font-bold text-[var(--text)]">{stats.rejected}</div>
          <div className="text-xs text-[var(--text-muted)]">Rejected</div>
        </Card>
      </div>

      <div className="flex gap-2 border-b border-[var(--border)]">
        {['agents', 'approvals'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              tab === t
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {t === 'agents' ? 'Registered Agents' : 'Pending Approvals'}
          </button>
        ))}
      </div>

      {tab === 'agents' && (
        <Card className="p-0 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3].map((i) => (<div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--border)]" />))}</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-medium text-[var(--text-muted)]">
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Capabilities</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-[var(--primary)]" />
                        <div>
                          <div className="font-medium text-[var(--text)]">{a.displayName || a.username}</div>
                          <div className="text-xs text-[var(--text-muted)]">{a.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">v{a.version}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {(Array.isArray(a.capabilities) ? a.capabilities : []).length} skills
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={a.status === 'ACTIVE' ? 'success' : 'danger'}>{a.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {tab === 'approvals' && (
        <Card className="p-0 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3].map((i) => (<div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--border)]" />))}</div>
          ) : approvals.length === 0 ? (
            <div className="p-6 text-center text-sm text-[var(--text-muted)]">No pending approvals.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs font-medium text-[var(--text-muted)]">
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Requested By</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvals.filter((a) => a.status === 'PENDING').map((a) => (
                  <tr key={a.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)]">
                    <td className="px-4 py-3">
                      <span className="font-medium text-[var(--text)]">{a.type?.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{a.entityType} #{a.entityId?.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{a.requestedBy}</td>
                    <td className="px-4 py-3">
                      <Badge variant={a.status === 'PENDING' ? 'warning' : a.status === 'APPROVED' ? 'success' : 'danger'}>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleApprove(a.id)} title="Approve">
                          <CheckCircle size={16} className="text-emerald-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleReject(a.id)} title="Reject">
                          <XCircle size={16} className="text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  )
}
