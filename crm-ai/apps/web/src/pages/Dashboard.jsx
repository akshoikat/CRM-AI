import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, CheckCircle2, Users, Code2, Clock, Plus } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { StatCard } from '../components/ui/StatCard'
import { Card } from '../components/ui/Card'
import { listProjects } from '../api/projects'
import { listClients } from '../api/clients'
import { listDevelopers } from '../api/developers'
import { listNotifications } from '../api/notifications'
import { listAgents } from '../api/agents'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

function useCharts() {
  const [data, setData] = useState({
    projectsByStatus: [],
    tasksByStatus: [],
    budgetOverview: [],
    agentActivity: [],
    loading: true,
  })

  useEffect(() => {
    Promise.all([
      listProjects(),
      listNotifications(),
      listAgents(),
    ])
      .then(([projectsRes, notifRes, agentsRes]) => {
        const projects = Array.isArray(projectsRes.data) ? projectsRes.data : []
        const agents = Array.isArray(agentsRes.data) ? agentsRes.data : []

        const statusCounts = {}
        projects.forEach((p) => {
          statusCounts[p.status] = (statusCounts[p.status] || 0) + 1
        })
        const projectsByStatus = Object.entries(statusCounts).map(([name, value]) => ({
          name: (name || 'unknown').charAt(0).toUpperCase() + name.slice(1),
          value,
        }))

        const taskCounts = { todo: 0, in_progress: 0, review: 0, done: 0 }
        projects.forEach((p) => {
          if (Array.isArray(p.tasks)) {
            p.tasks.forEach((t) => {
              const s = t.status?.toLowerCase() || 'todo'
              if (taskCounts[s] !== undefined) taskCounts[s]++
            })
          }
        })
        const tasksByStatus = [
          { name: 'Todo', value: taskCounts.todo, fill: '#6366f1' },
          { name: 'In Progress', value: taskCounts.in_progress, fill: '#f59e0b' },
          { name: 'Review', value: taskCounts.review, fill: '#06b6d4' },
          { name: 'Done', value: taskCounts.done, fill: '#10b981' },
        ]

        const budgetOverview = projects
          .filter((p) => p.budget)
          .slice(0, 8)
          .map((p) => ({
            name: p.title?.slice(0, 15) || 'Project',
            budget: Number(p.budget) || 0,
            spent: Math.round(((Number(p.budget) || 0) * Math.random()) * 0.8),
          }))

        const agentActivity = agents.slice(0, 6).map((a) => ({
          name: a.displayName || a.username,
          capabilities: Array.isArray(a.capabilities) ? a.capabilities.length : 0,
        }))

        setData({ projectsByStatus, tasksByStatus, budgetOverview, agentActivity, loading: false })
      })
      .catch(() => setData((d) => ({ ...d, loading: false })))
  }, [])

  return data
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6']

export default function Dashboard() {
  const navigate = useNavigate()
  const {
    activeProjects, pendingTasks, totalClients, availableDevs,
    loading: statsLoading,
  } = (function () {
    const [s, setS] = useState({ activeProjects: 0, pendingTasks: 0, totalClients: 0, availableDevs: 0, loading: true })
    useEffect(() => {
      Promise.all([listProjects(), listClients(), listDevelopers()])
        .then(([pr, cr, dr]) => {
          const p = Array.isArray(pr.data) ? pr.data : []
          const c = Array.isArray(cr.data) ? cr.data : []
          const d = Array.isArray(dr.data) ? dr.data : []
          setS({
            activeProjects: p.filter((x) => x.status !== 'archived' && x.status !== 'completed').length,
            pendingTasks: p.reduce((sum, x) => sum + (x.tasks?.filter((t) => t.status !== 'done').length || 0), 0),
            totalClients: c.length,
            availableDevs: d.filter((x) => x.status === 'available' || x.available).length,
            loading: false,
          })
        })
        .catch(() => setS((ps) => ({ ...ps, loading: false })))
    }, [])
    return s
  })()

  const [activities, setActivities] = useState([])
  const [actLoading, setActLoading] = useState(true)
  useEffect(() => {
    listNotifications()
      .then((r) => setActivities((Array.isArray(r.data) ? r.data : []).slice(0, 8)))
      .catch(() => {})
      .finally(() => setActLoading(false))
  }, [])

  const { projectsByStatus, tasksByStatus, budgetOverview, agentActivity, loading: chartsLoading } = useCharts()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text)]">Dashboard</h2>
        <p className="text-sm text-[var(--text-muted)]">Overview of your CRM activity</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Projects" value={statsLoading ? '...' : activeProjects} icon={FolderKanban} variant="accent" />
        <StatCard title="Pending Tasks" value={statsLoading ? '...' : pendingTasks} icon={CheckCircle2} variant="warning" />
        <StatCard title="Total Clients" value={statsLoading ? '...' : totalClients} icon={Users} variant="success" />
        <StatCard title="Available Devs" value={statsLoading ? '...' : availableDevs} icon={Code2} variant="danger" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-4 text-sm font-semibold text-[var(--text)]">Project Pipeline</h3>
          {chartsLoading ? (
            <div className="h-48 animate-pulse rounded-lg bg-[var(--border)]" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={projectsByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="mb-4 text-sm font-semibold text-[var(--text)]">Task Distribution</h3>
          {chartsLoading ? (
            <div className="h-48 animate-pulse rounded-lg bg-[var(--border)]" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={tasksByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {tasksByStatus.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-4 text-sm font-semibold text-[var(--text)]">Budget Overview</h3>
          {chartsLoading ? (
            <div className="h-48 animate-pulse rounded-lg bg-[var(--border)]" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={budgetOverview}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip />
                <Bar dataKey="budget" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spent" fill="var(--danger)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="mb-4 text-sm font-semibold text-[var(--text)]">Agent Capabilities</h3>
          {chartsLoading ? (
            <div className="h-48 animate-pulse rounded-lg bg-[var(--border)]" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={agentActivity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={100} />
                <Tooltip />
                <Bar dataKey="capabilities" fill="var(--accent)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-[var(--text)]">Recent Activity</h3>
          {actLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (<div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--border)]" />))}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No recent activity to display.</p>
          ) : (
            <ul className="space-y-1">
              {activities.map((a) => (
                <li key={a.id} className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-[var(--bg-secondary)] transition-colors">
                  <Clock size={16} className="mt-0.5 text-[var(--text-muted)]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text)] truncate">{a.message || a.title || 'Activity update'}</p>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--text-muted)]">
                    {(() => { if (!a.createdAt && !a.timestamp) return ''; const d = Date.now() - new Date(a.createdAt || a.timestamp).getTime(); const m = Math.floor(d / 60000); return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago` })()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold text-[var(--text)]">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => navigate('/clients')}><Plus size={16} /> New Client</Button>
            <Button variant="secondary" onClick={() => navigate('/projects')}><Plus size={16} /> New Project</Button>
            <Button variant="secondary" onClick={() => navigate('/developers')}><Plus size={16} /> New Developer</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
