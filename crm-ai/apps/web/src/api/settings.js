import api from './axios'

export const getSettings = () => api.get('/settings')
export const testConnections = () => api.post('/settings/test')
export const getEnvVars = () => api.get('/settings/env')
