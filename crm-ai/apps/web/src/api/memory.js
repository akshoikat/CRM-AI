import api from './axios'

export const getProjectMemory = (projectId) => api.get(`/projects/${projectId}/memory`)
