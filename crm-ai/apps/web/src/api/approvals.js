import api from './axios'

export const listApprovals = () => api.get('/approvals')
export const getApproval = (id) => api.get(`/approvals/${id}`)
export const createApproval = (data) => api.post('/approvals', data)
export const approveApproval = (id, data) => api.patch(`/approvals/${id}/approve`, data)
export const rejectApproval = (id, data) => api.patch(`/approvals/${id}/reject`, data)
export const getApprovalStats = () => api.get('/approvals/stats/summary')
