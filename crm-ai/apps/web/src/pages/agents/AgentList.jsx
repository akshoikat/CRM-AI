import { useState, useEffect, useReducer } from 'react'
import { Bot, Cpu, Activity, CheckCircle, XCircle, Clock, RefreshCw, Shield, Layers } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { listAgents, seedAgents } from '../../api/agents'

const initial = { agents: [], loading: true, error: '' }
function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_SUCCESS': return { agents: action.payload, loading: false, error: '' }
    case 'FETCH_ERROR': return { agents: [], loading: false, error: action.payload }
    default: return state
  }
}

const statusIcon = {
  ACTIVE: <CheckCircle size={14} className="text-emerald-500" />,
  INACTIVE: <Clock size={14} className="text-amber-500" />,
  ERROR: <XCircle size={14} className="text-red-500" />,
}

const statusVariant = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
  ERROR: 'danger',
}

export default function AgentList() {
  const [{ agents, loading, error }, dispatch] = useReducer(reducer, initial)
  const [seeding, setSeeding] = useState(false)
  const [fetchToken, setFetchToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    listAgents()
      .then((res) => { if (!cancelled) dispatch({ type: 'FETCH_SUCCESS', payload: Array.isArray(res.data) ? res.data : [] }) })
      .catch(() => { if (!cancelled) dispatch({ type: 'FETCH_ERROR', payload: 'Failed to load agents' }) })
    return () => { cancelled = true }
  }, [fetchToken])

  const handleSeed = async () => {
    setSeeding(true)
    try {
      await seedAgents()
      setFetchToken((k) => k + 1)
    } catch {
      dispatch({ type: 'FETCH_ERROR', payload: 'Failed to seed agents' })
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text)]">Agent Registry</h2>
          <p className="text-sm text-[var(--text-muted)]">
            {loading ? '...' : `${agents.length} agent${agents.length !== 1 ? 's' : ''} registered`}
          </p>
        </div>
        <Button onClick={handleSeed} disabled={seeding}>
          <RefreshCw size={16} className={seeding ? 'animate-spin' : ''} /> {seeding ? 'Seeding...' : 'Seed Agents'}
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--border)]" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-6 text-center text-sm text-red-500">
          <XCircle size={20} className="mx-auto mb-2" /> {error}
        </Card>
      ) : agents.length === 0 ? (
        <Card className="p-8 text-center">
          <Bot size={40} className="mx-auto mb-3 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)] mb-4">
            No agents registered yet. Click &quot;Seed Agents&quot; to initialize the registry.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary)]/10">
                    <Cpu size={20} className="text-[var(--primary)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text)]">{agent.displayName}</h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {agent.id} &middot; v{agent.version}
                    </p>
                  </div>
                </div>
                <Badge variant={statusVariant[agent.status] || 'default'}>
                  <span className="flex items-center gap-1">
                    {statusIcon[agent.status]} {agent.status}
                  </span>
                </Badge>
              </div>

              {agent.description && (
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {agent.description}
                </p>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                  <Layers size={12} />
                  <span className="font-medium">Capabilities</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(agent.capabilities) ? agent.capabilities : []).map((cap) => (
                    <span
                      key={cap}
                      className="inline-block rounded-md bg-[var(--bg-secondary)] px-2 py-0.5 text-[11px] text-[var(--text)]"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {agent.permissions && (
                <div className="space-y-2 border-t border-[var(--border)] pt-3">
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <Shield size={12} />
                    <span className="font-medium">Permissions</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-emerald-600 font-medium">Allowed:</span>
                      {(agent.permissions.can || []).map((p) => (
                        <div key={p} className="flex items-center gap-1 text-[var(--text-muted)]">
                          <CheckCircle size={10} className="text-emerald-500 shrink-0" /> {p}
                        </div>
                      ))}
                    </div>
                    <div>
                      <span className="text-red-600 font-medium">Denied:</span>
                      {(agent.permissions.cannot || []).map((p) => (
                        <div key={p} className="flex items-center gap-1 text-[var(--text-muted)]">
                          <XCircle size={10} className="text-red-500 shrink-0" /> {p}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
