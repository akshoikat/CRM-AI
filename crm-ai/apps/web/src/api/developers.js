import api from './axios'

export const listDevelopers = () => api.get('/developers')
export const getDeveloper = (id) => api.get(`/developers/${id}`)
export const createDeveloper = (data) => api.post('/developers', data)
export const updateDeveloper = (id, data) => api.put(`/developers/${id}`, data)
export const listAvailableDevelopers = () => api.get('/developers/available')
