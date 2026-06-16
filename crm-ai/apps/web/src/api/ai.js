import api from './axios'

export const chatWithAI = (projectId, message) => api.post('/ai/chat', { projectId, message })
export const rebuildMemory = (projectId) => api.post('/ai/rebuild-memory', { projectId })
export const processReminders = () => api.post('/ai/process-reminders')
