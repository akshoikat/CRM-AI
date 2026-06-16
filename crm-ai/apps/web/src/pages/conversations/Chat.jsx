import { useState, useEffect, useRef, useReducer } from 'react'
import { Search, Send, MessageSquare, Loader2 } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { listProjects } from '../../api/projects'
import { listConversations, sendMessage as sendMessageApi } from '../../api/conversations'

/* ---------- Project sidebar item ---------- */

function ProjectItem({ project, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors cursor-pointer ${
        active
          ? 'bg-[var(--primary)] text-white'
          : 'text-[var(--text)] hover:bg-[var(--bg-secondary)]'
      }`}
    >
      <p className="text-sm font-medium truncate">{project.name}</p>
      <p className={`text-xs mt-0.5 ${active ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
        {project.client?.name || 'No client'}
      </p>
    </button>
  )
}

/* ---------- Message bubble ---------- */

function MessageBubble({ message }) {
  const text = message.message || message.content || ''
  const sender = message.sender?.name || message.senderName || 'User'
  const time = message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''

  return (
    <div className="flex items-start gap-3">
      <div className="h-8 w-8 shrink-0 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-sm font-medium">
        {sender.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-[var(--text)]">{sender}</span>
          {time && <span className="text-xs text-[var(--text-muted)]">{time}</span>}
        </div>
        <p className="mt-1 text-sm text-[var(--text)] whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  )
}

/* ---------- Reducer for selected project's messages ---------- */

function messagesReducer(state, action) {
  switch (action.type) {
    case 'SET':
      return { messages: action.payload, loading: false, error: '' }
    case 'APPEND': {
      const exists = state.messages.some((m) => m.id === action.payload.id)
      if (exists) return state
      return { ...state, messages: [...state.messages, action.payload] }
    }
    case 'ERROR':
      return { ...state, loading: false, error: action.payload }
    default:
      return state
  }
}

/* ---------- Projects reducer ---------- */

function projectsReducer(state, action) {
  switch (action.type) {
    case 'SET':
      return { projects: action.payload, loading: false }
    case 'ERROR':
      return { projects: [], loading: false }
    default:
      return state
  }
}

/* ---------- Main component ---------- */

export default function Chat() {
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  const [{ projects, loading: projLoading }, projDispatch] = useReducer(projectsReducer, { projects: [], loading: true })
  const [{ messages, loading: msgLoading, error: msgError }, msgDispatch] = useReducer(messagesReducer, { messages: [], loading: false, error: '' })

  const [sendText, setSendText] = useState('')
  const [sending, setSending] = useState(false)

  /* Fetch projects on mount */
  useEffect(() => {
    let cancelled = false
    listProjects()
      .then((res) => { if (!cancelled) projDispatch({ type: 'SET', payload: Array.isArray(res.data) ? res.data : [] }) })
      .catch(() => { if (!cancelled) projDispatch({ type: 'ERROR' }) })
    return () => { cancelled = true }
  }, [])

  /* Fetch messages when project changes */
  useEffect(() => {
    if (!selectedId) return
    let cancelled = false
    msgDispatch({ type: 'SET', payload: [] }) /* clear while loading */
    listConversations(selectedId)
      .then((res) => { if (!cancelled) msgDispatch({ type: 'SET', payload: Array.isArray(res.data) ? res.data : [] }) })
      .catch(() => { if (!cancelled) msgDispatch({ type: 'ERROR', payload: 'Failed to load messages' }) })
    return () => { cancelled = true }
  }, [selectedId])

  /* Auto scroll to bottom on new messages */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  /* Send message */
  const handleSend = async () => {
    if (!sendText.trim() || !selectedId || sending) return
    setSending(true)
    try {
      const res = await sendMessageApi({ projectId: selectedId, message: sendText.trim() })
      if (res.data) {
        msgDispatch({ type: 'APPEND', payload: res.data })
      }
      setSendText('')
      inputRef.current?.focus()
    } catch {
      /* ignore — could show toast here */
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const filteredProjects = projects.filter((p) =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase())
  )

  /* ---------- Selected project detail ---------- */
  const selectedProject = projects.find((p) => p.id === selectedId)

  return (
    <div className="flex flex-col md:flex-row h-full gap-0">
      {/* ---------- Left sidebar ---------- */}
      <div className="w-full md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-[var(--border)] bg-[var(--bg)] flex flex-col max-md:max-h-48">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--text)]">Projects</h2>
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-1.5">
            <Search size={14} className="text-[var(--text-muted)] shrink-0" />
            <input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {projLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-[var(--border)]" />)}
            </div>
          ) : filteredProjects.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">No projects found.</p>
          ) : (
            filteredProjects.map((p) => (
              <ProjectItem
                key={p.id}
                project={p}
                active={p.id === selectedId}
                onClick={() => setSelectedId(p.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ---------- Right chat panel ---------- */}
      <div className="flex-1 flex flex-col bg-[var(--bg-secondary)]">
        {!selectedId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={40} className="mx-auto text-[var(--text-muted)]" />
              <p className="mt-3 text-sm text-[var(--text-muted)]">Select a project to start chatting</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                AI-powered conversations per project
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--bg)] px-6 py-3">
              <div className="h-9 w-9 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-sm font-medium">
                {selectedProject?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text)]">{selectedProject?.name}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {selectedProject?.client?.name && `${selectedProject.client.name} · `}
                  {selectedProject?.status && <Badge variant="default">{selectedProject.status}</Badge>}
                </p>
              </div>
            </div>

            {/* Messages area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {msgLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-[var(--accent)]" />
                </div>
              ) : msgError ? (
                <p className="text-sm text-[var(--danger)] text-center py-12">{msgError}</p>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare size={32} className="mx-auto text-[var(--text-muted)]" />
                  <p className="mt-2 text-sm text-[var(--text-muted)]">No messages yet. Send one to get started!</p>
                </div>
              ) : (
                messages.map((m, i) => (
                  <MessageBubble key={m.id || i} message={m} />
                ))
              )}
            </div>

            {/* Input bar */}
            <div className="border-t border-[var(--border)] bg-[var(--bg)] px-6 py-4">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  placeholder="Type your message... (AI will process the response)"
                  value={sendText}
                  onChange={(e) => setSendText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={!sendText.trim() || sending}
                  className="inline-flex items-center justify-center rounded-lg bg-[var(--primary)] px-4 text-white hover:bg-[var(--primary-light)] disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                Messages are processed by AI. Press Enter to send.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
