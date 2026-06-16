import api from './axios'

export const listAssignments = (params) => api.get('/assignments', { params })
export const createAssignment = (data) => api.post('/assignments', data)
export const updateAssignment = (id, data) => api.put(`/assignments/${id}`, data)
export const deleteAssignment = (id) => api.delete(`/assignments/${id}`)
