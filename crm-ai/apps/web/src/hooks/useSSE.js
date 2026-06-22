import { useEffect, useRef } from 'react'

export function useSSE(onEvent) {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent

  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL || '/api'
    const url = `${base}/events/stream`

    const source = new EventSource(url)

    source.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        onEventRef.current?.(e.type, data)
      } catch {}
    }

    const events = [
      'CLIENT_CREATED', 'PROJECT_CREATED', 'TASK_CREATED', 'TASK_COMPLETED',
      'DEVELOPER_ASSIGNED', 'CLIENT_MESSAGE_RECEIVED', 'CLIENT_MESSAGE_SENT',
      'DEADLINE_APPROACHING', 'REMINDER_TRIGGERED', 'MEMORY_UPDATED', 'AGENT_REGISTERED',
    ]

    events.forEach((name) => {
      source.addEventListener(name, (e) => {
        try {
          const data = JSON.parse(e.data)
          onEventRef.current?.(name, data)
        } catch {}
      })
    })

    source.onerror = () => {}

    return () => {
      source.close()
    }
  }, [])
}
