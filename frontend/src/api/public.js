/** Public API calls. Every function resolves with the response body. */
import client from './client';

const data = (request) => request.then((response) => response.data);

export const getInfo = () => data(client.get('/info'));
export const getProgrammes = (params = {}) => data(client.get('/programmes', { params }));
export const getProgramme = (slug) => data(client.get(`/programmes/${encodeURIComponent(slug)}`));
export const getLevels = () => data(client.get('/levels'));
export const getElectives = (params = {}) => data(client.get('/electives', { params }));
export const getAnnouncements = () => data(client.get('/announcements'));
export const submitApplication = (payload) => data(client.post('/applications', payload));
export const submitContact = (payload) => data(client.post('/contact', payload));
