import api from './axios'

export const listRemindersByProject = (projectId) => api.get(`/projects/${projectId}/reminders`)
export const createReminder = (data) => api.post('/reminders', data)
export const updateReminder = (id, data) => api.put(`/reminders/${id}`, data)
export const deleteReminder = (id) => api.delete(`/reminders/${id}`)
