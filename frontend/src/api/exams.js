import client from './client.js';

export const examsApi = {
  list: () => client.get('/api/exams'),
  get: (examId) => client.get(`/api/exams/${examId}`),
};
