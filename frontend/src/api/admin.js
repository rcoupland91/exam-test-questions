import client from './client.js';

export const adminApi = {
  getUsers: () => client.get('/api/admin/users'),
  updateUser: (id, data) => client.patch(`/api/admin/users/${id}`, data),
  deleteUser: (id) => client.delete(`/api/admin/users/${id}`),
  getSettings: () => client.get('/api/admin/settings'),
  updateSetting: (key, value) => client.patch('/api/admin/settings', { key, value }),
};
