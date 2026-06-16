import { useState, useEffect, useReducer } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, CheckCircle2, Circle, Trash2, Send, Calendar, User, Loader2, Brain, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { getProject } from '../../api/projects'
import {
  listRequirementsByProject, createRequirement, updateRequirementStatus, deleteRequirement,
} from '../../api/requirements'
import {
  listTasksByProject, createTask, deleteTask,
} from '../../api/tasks'
import {
  listConversations, sendMessage,
} from '../../api/conversations'
import {
  listRemindersByProject, createReminder, deleteReminder,
} from '../../api/reminders'
import {
  listAssignments, createAssignment, deleteAssignment,
} from '../../api/assignments'
import { listAvailableDevelopers } from '../../api/developers'
import { getProjectMemory } from '../../api/memory'
import { rebuildMemory } from '../../api/ai'

/* ---------- Helpers ---------- */

function statusVariant(s) {
  if (s === 'done' || s === 'completed') return 'success'
  if (s === 'in_progress' || s === 'active') return 'accent'
  if (s === 'pending') return 'warning'
  return 'default'
}

function reducer() {
  return (state, action) => {
    switch (action.type) {
      case 'SET': return { ...state, data: action.payload, loading: false, error: '' }
      case 'ERROR': return { ...state, loading: false, error: action.payload }
      default: return state
    }
  }
}

function useFetch(fn, deps) {
  const [state, dispatch] = useReducer(reducer(), { data: null, loading: true, error: '' })
  useEffect(() => {
    let cancelled = false
    fn()
      .then((res) => { if (!cancelled) dispatch({ type: 'SET', payload: res.data }) })
      .catch((err) => { if (!cancelled) dispatch({ type: 'ERROR', payload: err.response?.data?.message || 'Failed to load' }) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString()
}

/* ---------- Tab: Requirements ---------- */

function RequirementsTab({ projectId }) {
  const { data: reqs, loading, error } = useFetch(() => listRequirementsByProject(projectId), [projectId])
  const [text, setText] = useState('')
  const [adding, setAdding] = useState(false)

  const add = async () => {
    if (!text.trim()) return
    setAdding(true)
    await createRequirement({ projectId, title: text.trim() })
    setText('')
    setAdding(false)
    window.location.reload()
  }

  const toggle = async (id, current) => {
    await updateRequirementStatus(id, current === 'done' ? 'pending' : 'done')
    window.location.reload()
  }

  const remove = async (id) => {
    if (!confirm('Delete this requirement?')) return
    await deleteRequirement(id)
    window.location.reload()
  }

  if (loading) return <p className="text-sm text-[var(--text-muted)]">Loading...</p>
  if (error) return <p className="text-sm text-[var(--danger)]">{error}</p>

  const list = Array.isArray(reqs) ? reqs : []

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          placeholder="Add a requirement..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <Button size="sm" onClick={add} disabled={adding || !text.trim()}>
          <Plus size={16} /> Add
        </Button>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No requirements yet.</p>
      ) : (
        <ul className="space-y-1">
          {list.map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2">
              <button onClick={() => toggle(r.id, r.status)} className="cursor-pointer text-[var(--text-muted)] hover:text-[var(--success)]">
                {r.status === 'done' ? <CheckCircle2 size={18} className="text-[var(--success)]" /> : <Circle size={18} />}
              </button>
              <span className={`flex-1 text-sm ${r.status === 'done' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}`}>
                {r.title}
              </span>
              <Badge variant={statusVariant(r.status)}>{r.status || 'pending'}</Badge>
              <button onClick={() => remove(r.id)} className="cursor-pointer text-[var(--text-muted)] hover:text-[var(--danger)]">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ---------- Tab: Tasks ---------- */

function TasksTab({ projectId }) {
  const { data: tasks, loading, error } = useFetch(() => listTasksByProject(projectId), [projectId])
  const [title, setTitle] = useState('')
  const [adding, setAdding] = useState(false)

  const add = async () => {
    if (!title.trim()) return
    setAdding(true)
    await createTask({ projectId, title: title.trim() })
    setTitle('')
    setAdding(false)
    window.location.reload()
  }

  const remove = async (id) => {
    if (!confirm('Delete this task?')) return
    await deleteTask(id)
    window.location.reload()
  }

  if (loading) return <p className="text-sm text-[var(--text-muted)]">Loading...</p>
  if (error) return <p className="text-sm text-[var(--danger)]">{error}</p>

  const list = Array.isArray(tasks) ? tasks : []

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          placeholder="Add a task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <Button size="sm" onClick={add} disabled={adding || !title.trim()}>
          <Plus size={16} /> Add
        </Button>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No tasks yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-medium text-[var(--text-muted)]">
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Assignee</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-3 py-2 text-[var(--text)]">{t.title}</td>
                  <td className="px-3 py-2"><Badge variant={statusVariant(t.status)}>{t.status || 'pending'}</Badge></td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{t.assignee?.name || '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => remove(t.id)} className="cursor-pointer text-[var(--text-muted)] hover:text-[var(--danger)]">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ---------- Tab: Conversations ---------- */

function ConversationsTab({ projectId }) {
  const { data: msgs, loading, error } = useFetch(() => listConversations(projectId), [projectId])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  const send = async () => {
    if (!text.trim()) return
    setSending(true)
    await sendMessage({ projectId, message: text.trim() })
    setText('')
    setSending(false)
    window.location.reload()
  }

  const messages = Array.isArray(msgs) ? msgs : []

  return (
    <div className="flex flex-col gap-4">
      <div className="max-h-80 min-h-[200px] space-y-2 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading...</p>
        ) : error ? (
          <p className="text-sm text-[var(--danger)]">{error}</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No messages yet. Start a conversation!</p>
        ) : (
          messages.map((m, i) => (
            <div key={m.id || i} className="rounded-lg bg-[var(--bg)] px-3 py-2 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <User size={12} /> {m.sender?.name || 'User'}
              </div>
              <p className="mt-1 text-sm text-[var(--text)]">{m.message || m.content}</p>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <input
          placeholder="Type your message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <Button size="sm" onClick={send} disabled={sending || !text.trim()}>
          <Send size={16} /> Send
        </Button>
      </div>
    </div>
  )
}

/* ---------- Tab: Reminders ---------- */

function RemindersTab({ projectId }) {
  const { data: reminders, loading, error } = useFetch(() => listRemindersByProject(projectId), [projectId])
  const [text, setText] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [adding, setAdding] = useState(false)

  const add = async () => {
    if (!text.trim()) return
    setAdding(true)
    await createReminder({ projectId, title: text.trim(), dueDate: dueDate || undefined })
    setText('')
    setDueDate('')
    setAdding(false)
    window.location.reload()
  }

  const remove = async (id) => {
    if (!confirm('Delete this reminder?')) return
    await deleteReminder(id)
    window.location.reload()
  }

  if (loading) return <p className="text-sm text-[var(--text-muted)]">Loading...</p>
  if (error) return <p className="text-sm text-[var(--danger)]">{error}</p>

  const list = Array.isArray(reminders) ? reminders : []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          placeholder="Reminder title..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 min-w-[180px] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <Button size="sm" onClick={add} disabled={adding || !text.trim()}>
          <Plus size={16} /> Add
        </Button>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No reminders yet.</p>
      ) : (
        <ul className="space-y-1">
          {list.map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2">
              <Calendar size={16} className="text-[var(--accent)] shrink-0" />
              <span className="flex-1 text-sm text-[var(--text)]">{r.title}</span>
              <span className="text-xs text-[var(--text-muted)]">{formatDate(r.dueDate)}</span>
              <button onClick={() => remove(r.id)} className="cursor-pointer text-[var(--text-muted)] hover:text-[var(--danger)]">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ---------- Tab: Assignments ---------- */

function AssignmentsTab({ projectId }) {
  const { data: assignments, loading, error } = useFetch(() => listAssignments({ projectId }), [projectId])
  const { data: devs } = useFetch(() => listAvailableDevelopers(), [])
  const [selectedDev, setSelectedDev] = useState('')
  const [role, setRole] = useState('')
  const [adding, setAdding] = useState(false)

  const add = async () => {
    if (!selectedDev) return
    setAdding(true)
    await createAssignment({ projectId, developerId: selectedDev, role: role || undefined })
    setSelectedDev('')
    setRole('')
    setAdding(false)
    window.location.reload()
  }

  const remove = async (id) => {
    if (!confirm('Remove this assignment?')) return
    await deleteAssignment(id)
    window.location.reload()
  }

  if (loading) return <p className="text-sm text-[var(--text-muted)]">Loading...</p>
  if (error) return <p className="text-sm text-[var(--danger)]">{error}</p>

  const list = Array.isArray(assignments) ? assignments : []
  const developers = Array.isArray(devs) ? devs : []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select
          value={selectedDev}
          onChange={(e) => setSelectedDev(e.target.value)}
          className="flex-1 min-w-[160px] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          <option value="">Select developer...</option>
          {developers.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <input
          placeholder="Role (optional)"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="min-w-[120px] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <Button size="sm" onClick={add} disabled={adding || !selectedDev}>
          <Plus size={16} /> Assign
        </Button>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No assignments yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs font-medium text-[var(--text-muted)]">
                <th className="px-3 py-2">Developer</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-3 py-2">
                    <span className="flex items-center gap-2 text-[var(--text)]">
                      <User size={14} className="text-[var(--text-muted)]" /> {a.developer?.name || a.developerId}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[var(--text-muted)]">{a.role || '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => remove(a.id)} className="cursor-pointer text-[var(--text-muted)] hover:text-[var(--danger)]">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ---------- Tab: Memory ---------- */

function MemoryTab({ projectId }) {
  const { data: memory, loading, error } = useFetch(() => getProjectMemory(projectId), [projectId])
  const [rebuilding, setRebuilding] = useState(false)

  const handleRebuild = async () => {
    setRebuilding(true)
    try {
      await rebuildMemory(projectId)
      window.location.reload()
    } catch {
      setRebuilding(false)
    }
  }

  if (loading) return <p className="text-sm text-[var(--text-muted)]">Loading...</p>
  if (error) return <p className="text-sm text-[var(--danger)]">{error}</p>

  const mem = memory || {}

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={18} className="text-[var(--accent)]" />
          <span className="text-sm font-medium text-[var(--text)]">AI Project Memory</span>
        </div>
        <Button size="sm" variant="ghost" onClick={handleRebuild} disabled={rebuilding}>
          <RefreshCw size={14} className={rebuilding ? 'animate-spin' : ''} /> {rebuilding ? 'Rebuilding...' : 'Rebuild'}
        </Button>
      </div>

      {!mem.summary && !mem.nextAction && !mem.risks?.length ? (
        <p className="text-sm text-[var(--text-muted)]">No memory built yet. Click &quot;Rebuild&quot; to generate one.</p>
      ) : (
        <div className="space-y-4">
          {mem.summary && (
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Summary</p>
              <p className="text-sm text-[var(--text)]">{mem.summary}</p>
            </div>
          )}
          {mem.lastTopics?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Recent Topics</p>
              <div className="flex flex-wrap gap-1">
                {mem.lastTopics.map((t) => (
                  <Badge key={t} variant="default">{t}</Badge>
                ))}
              </div>
            </div>
          )}
          {mem.risks?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] mb-1 flex items-center gap-1">
                <AlertTriangle size={12} className="text-[var(--warning)]" /> Risks
              </p>
              <ul className="space-y-1">
                {mem.risks.map((r, i) => (
                  <li key={i} className="text-sm text-[var(--warning)]">• {r}</li>
                ))}
              </ul>
            </div>
          )}
          {mem.nextAction && (
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Next Action</p>
              <p className="text-sm font-medium text-[var(--accent)]">{mem.nextAction}</p>
            </div>
          )}
          {mem.pendingItems?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Pending Items</p>
              <ul className="space-y-0.5">
                {mem.pendingItems.map((p, i) => (
                  <li key={i} className="text-sm text-[var(--text)]">• {p}</li>
                ))}
              </ul>
            </div>
          )}
          {mem.lastRequirement && (
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Last Requirement</p>
              <p className="text-sm text-[var(--text)]">{mem.lastRequirement}</p>
            </div>
          )}
          {mem.lastDiscussion && (
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Last Discussion</p>
              <p className="text-sm text-[var(--text)] italic">&quot;{mem.lastDiscussion}&quot;</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ---------- Main Page ---------- */

const TABS = ['Requirements', 'Tasks', 'Conversations', 'Reminders', 'Assignments', 'Memory']

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState(TABS[0])
  const { data: project, loading, error } = useFetch(() => getProject(id), [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/projects')}><ArrowLeft size={16} /> Back to Projects</Button>
        <p className="text-sm text-[var(--danger)]">{error}</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/projects')}><ArrowLeft size={16} /> Back to Projects</Button>
        <p className="text-sm text-[var(--text-muted)]">Project not found.</p>
      </div>
    )
  }

  const p = project

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/projects')}><ArrowLeft size={16} /></Button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-[var(--text)]">{p.name}</h2>
            <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            {p.client?.name && `Client: ${p.client.name} · `}
            Budget: {p.budget ? `$${p.budget}` : 'N/A'}
            {p.deadline && ` · Deadline: ${formatDate(p.deadline)}`}
          </p>
        </div>
      </div>

      <div className="border-b border-[var(--border)]">
        <div className="flex gap-0">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                tab === t
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <Card>
        {tab === 'Requirements' && <RequirementsTab projectId={id} />}
        {tab === 'Tasks' && <TasksTab projectId={id} />}
        {tab === 'Conversations' && <ConversationsTab projectId={id} />}
        {tab === 'Reminders' && <RemindersTab projectId={id} />}
        {tab === 'Assignments' && <AssignmentsTab projectId={id} />}
        {tab === 'Memory' && <MemoryTab projectId={id} />}
      </Card>
    </div>
  )
}
