import api from './axios'

export const listConversations = (projectId) => api.get('/conversations', { params: { projectId } })
export const sendMessage = (data) => api.post('/conversations/message', data)
