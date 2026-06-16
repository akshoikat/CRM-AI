import api from './axios'

export const listNotifications = () => api.get('/notifications')
export const listNotificationsByReceiver = (receiverId) => api.get(`/notifications/${receiverId}`)
export const createNotification = (data) => api.post('/notifications', data)
export const updateNotification = (id, data) => api.put(`/notifications/${id}`, data)
export const deleteNotification = (id) => api.delete(`/notifications/${id}`)
