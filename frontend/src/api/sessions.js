import client from './client.js';

export const sessionsApi = {
  create: (data) => client.post('/api/sessions', data),
  getQuestion: (sessionId) => client.get(`/api/sessions/${sessionId}/question`),
  submitAnswer: (sessionId, data) => client.post(`/api/sessions/${sessionId}/answers`, data),
  getSummary: (sessionId) => client.get(`/api/sessions/${sessionId}/summary`),
  list: (params) => client.get('/api/sessions', { params }),
};
