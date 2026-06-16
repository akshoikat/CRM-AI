import api from './axios'

export const listProjects = () => api.get('/projects')
export const getProject = (id) => api.get(`/projects/${id}`)
export const listProjectsByClient = (clientId) => api.get(`/clients/${clientId}/projects`)
export const createProject = (data) => api.post('/projects', data)
export const updateProject = (id, data) => api.put(`/projects/${id}`, data)
export const updateProjectStatus = (id, status) => api.patch(`/projects/${id}/status`, { status })
