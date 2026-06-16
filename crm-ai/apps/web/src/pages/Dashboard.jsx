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

function useStats() {
  const [stats, setStats] = useState({
    activeProjects: 0,
    pendingTasks: 0,
    totalClients: 0,
    availableDevs: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      listProjects(),
      listClients(),
      listDevelopers(),
    ])
      .then(([projectsRes, clientsRes, devsRes]) => {
        const projects = Array.isArray(projectsRes.data) ? projectsRes.data : []
        const clients = Array.isArray(clientsRes.data) ? clientsRes.data : []
        const devs = Array.isArray(devsRes.data) ? devsRes.data : []

        const active = projects.filter((p) => p.status !== 'archived' && p.status !== 'completed')
        const pendingTaskCount = projects.reduce(
          (sum, p) => sum + (p.tasks?.filter((t) => t.status !== 'done').length || 0), 0
        )
        const available = devs.filter((d) => d.status === 'available' || d.available)

        setStats({
          activeProjects: active.length,
          pendingTasks: pendingTaskCount,
          totalClients: clients.length,
          availableDevs: available.length,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { ...stats, loading }
}

function useRecentActivity() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listNotifications()
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : []
        setActivities(list.slice(0, 8))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { activities, loading }
}

const activityIcons = {
  project_created: FolderKanban,
  task_assigned: CheckCircle2,
  client_added: Users,
  developer_assigned: Code2,
}

const activityColors = {
  project_created: 'text-[var(--accent)]',
  task_assigned: 'text-[var(--warning)]',
  client_added: 'text-[var(--success)]',
  developer_assigned: 'text-[var(--danger)]',
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { activeProjects, pendingTasks, totalClients, availableDevs, loading: statsLoading } = useStats()
  const { activities, loading: activityLoading } = useRecentActivity()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text)]">Dashboard</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Overview of your CRM activity
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Projects"
          value={statsLoading ? '...' : activeProjects}
          icon={FolderKanban}
          variant="accent"
        />
        <StatCard
          title="Pending Tasks"
          value={statsLoading ? '...' : pendingTasks}
          icon={CheckCircle2}
          variant="warning"
        />
        <StatCard
          title="Total Clients"
          value={statsLoading ? '...' : totalClients}
          icon={Users}
          variant="success"
        />
        <StatCard
          title="Available Devs"
          value={statsLoading ? '...' : availableDevs}
          icon={Code2}
          variant="danger"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-[var(--text)]">
            Recent Activity
          </h3>
          {activityLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--border)]" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              No recent activity to display.
            </p>
          ) : (
            <ul className="space-y-1">
              {activities.map((a) => {
                const Icon = activityIcons[a.type] || Clock
                const color = activityColors[a.type] || 'text-[var(--text-muted)]'
                return (
                  <li key={a.id} className="flex items-start gap-3 rounded-lg px-3 py-2 hover:bg-[var(--bg-secondary)] transition-colors">
                    <div className={`mt-0.5 ${color}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text)] truncate">
                        {a.message || a.title || 'Activity update'}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-[var(--text-muted)]">
                      {timeAgo(a.createdAt || a.timestamp)}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-semibold text-[var(--text)]">
            Quick Actions
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => navigate('/clients')}>
              <Plus size={16} /> New Client
            </Button>
            <Button variant="secondary" onClick={() => navigate('/projects')}>
              <Plus size={16} /> New Project
            </Button>
            <Button variant="secondary" onClick={() => navigate('/developers')}>
              <Plus size={16} /> New Developer
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
