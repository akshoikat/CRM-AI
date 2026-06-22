import api from './axios'

export const listAgents = () => api.get('/agents')
export const getAgent = (id) => api.get(`/agents/${id}`)
export const seedAgents = () => api.post('/agents/seed')
export const updateAgent = (id, data) => api.put(`/agents/${id}`, data)
export const setAgentStatus = (id, status) => api.patch(`/agents/${id}/status`, { status })
