import client from './client.js';

export const authApi = {
  register: (data) => client.post('/api/auth/register', data),
  login: (data) => client.post('/api/auth/login', data),
  me: () => client.get('/api/auth/me'),
  setup2fa: () => client.post('/api/auth/2fa/setup'),
  verify2fa: (data) => client.post('/api/auth/2fa/verify', data),
  disable2fa: () => client.delete('/api/auth/2fa'),
  validate2fa: (data) => client.post('/api/auth/2fa/validate', data),
  updateProfile: (data) => client.patch('/api/auth/profile', data),
};
