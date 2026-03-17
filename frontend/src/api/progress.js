import client from './client.js';

export const progressApi = {
  get: () => client.get('/api/progress'),
};
