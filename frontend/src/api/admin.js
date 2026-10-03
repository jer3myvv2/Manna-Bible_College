/** Admin API calls (JWT added automatically by the client interceptor). */
import client from './client';

const data = (request) => request.then((response) => response.data);

export const login = (username, password) => data(client.post('/admin/login', { username, password }));

// Password recovery (no token needed)
export const forgotPassword = (identifier) => data(client.post('/admin/forgot-password', { identifier }));
export const checkResetToken = (token) => data(client.post('/admin/reset-password/check', { token }));
export const resetPassword = (token, password) => data(client.post('/admin/reset-password', { token, password }));
export const getStats = () => data(client.get('/admin/stats'));

// Applications
export const getApplications = (params) => data(client.get('/admin/applications', { params }));
export const updateApplication = (id, payload) => data(client.patch(`/admin/applications/${id}`, payload));

/** Download the filtered applications as CSV (uses the token, so it can't be a plain link). */
export async function exportApplications(params) {
  const response = await client.get('/admin/applications/export', { params, responseType: 'blob' });
  const disposition = response.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^";]+)"?/);
  const filename = match ? match[1] : 'manna-applications.csv';
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Messages
export const getMessages = () => data(client.get('/admin/messages'));
export const updateMessage = (id, payload) => data(client.patch(`/admin/messages/${id}`, payload));
export const deleteMessage = (id) => data(client.delete(`/admin/messages/${id}`));

// Programmes, modules and units
export const getProgrammes = () => data(client.get('/admin/programmes'));
export const getProgramme = (id) => data(client.get(`/admin/programmes/${id}`));
export const createProgramme = (payload) => data(client.post('/admin/programmes', payload));
export const updateProgramme = (id, payload) => data(client.patch(`/admin/programmes/${id}`, payload));
export const deleteProgramme = (id) => data(client.delete(`/admin/programmes/${id}`));

export const createModule = (programmeId, payload) =>
  data(client.post(`/admin/programmes/${programmeId}/modules`, payload));
export const updateModule = (id, payload) => data(client.patch(`/admin/modules/${id}`, payload));
export const deleteModule = (id) => data(client.delete(`/admin/modules/${id}`));

export const createUnit = (moduleId, payload) => data(client.post(`/admin/modules/${moduleId}/units`, payload));
export const updateUnit = (id, payload) => data(client.patch(`/admin/units/${id}`, payload));
export const deleteUnit = (id) => data(client.delete(`/admin/units/${id}`));

// Electives
export const getElectives = () => data(client.get('/admin/electives'));
export const createElective = (payload) => data(client.post('/admin/electives', payload));
export const updateElective = (id, payload) => data(client.patch(`/admin/electives/${id}`, payload));
export const deleteElective = (id) => data(client.delete(`/admin/electives/${id}`));

// Announcements
export const getAnnouncements = () => data(client.get('/admin/announcements'));
export const createAnnouncement = (payload) => data(client.post('/admin/announcements', payload));
export const updateAnnouncement = (id, payload) => data(client.patch(`/admin/announcements/${id}`, payload));
export const deleteAnnouncement = (id) => data(client.delete(`/admin/announcements/${id}`));

// Levels
export const getLevels = () => data(client.get('/admin/levels'));
export const updateLevel = (id, payload) => data(client.patch(`/admin/levels/${id}`, payload));
