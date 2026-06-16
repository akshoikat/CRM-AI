import api from './axios'

export const listRequirementsByProject = (projectId) => api.get(`/projects/${projectId}/requirements`)
export const createRequirement = (data) => api.post('/requirements', data)
export const updateRequirement = (id, data) => api.put(`/requirements/${id}`, data)
export const updateRequirementStatus = (id, status) => api.patch(`/requirements/${id}/status`, { status })
export const deleteRequirement = (id) => api.delete(`/requirements/${id}`)
