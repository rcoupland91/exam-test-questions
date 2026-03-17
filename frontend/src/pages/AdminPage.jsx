import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/admin.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [settingLoading, setSettingLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchAll();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  async function fetchAll() {
    try {
      const [usersRes, settingsRes] = await Promise.all([adminApi.getUsers(), adminApi.getSettings()]);
      setUsers(usersRes.data.users);
      setSettings(settingsRes.data.settings);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleSetting(key, currentValue) {
    setSettingLoading(true);
    const newValue = currentValue === '1' ? '0' : '1';
    try {
      await adminApi.updateSetting(key, newValue);
      setSettings(prev => ({ ...prev, [key]: newValue }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update setting');
    } finally {
      setSettingLoading(false);
    }
  }

  async function handleToggleActive(u) {
    setActionLoading(`active-${u.id}`);
    try {
      const res = await adminApi.updateUser(u.id, { is_active: u.is_active === 1 ? 0 : 1 });
      setUsers((prev) => prev.map((x) => x.id === u.id ? res.data.user : x));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleToggleRole(u) {
    setActionLoading(`role-${u.id}`);
    try {
      const newRole = u.role === 'admin' ? 'user' : 'admin';
      const res = await adminApi.updateUser(u.id, { role: newRole });
      setUsers((prev) => prev.map((x) => x.id === u.id ? res.data.user : x));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id) {
    setActionLoading(`delete-${id}`);
    try {
      await adminApi.deleteUser(id);
      setUsers((prev) => prev.filter((x) => x.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="text-red-500 dark:text-red-400 text-5xl mb-4">403</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h1>
        <p className="text-gray-500 dark:text-gray-400">You need admin privileges to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <span className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{users.length} user{users.length !== 1 ? 's' : ''} registered</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete User</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Are you sure you want to permanently delete <strong className="text-gray-900 dark:text-white">{deleteConfirm.username}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={actionLoading === `delete-${deleteConfirm.id}`}
                className="flex-1 px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading === `delete-${deleteConfirm.id}` ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Site Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Site Settings</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">New user registrations</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">When disabled, the registration page returns an error for new sign-ups</p>
          </div>
          <button
            onClick={() => handleToggleSetting('registrations_enabled', settings.registrations_enabled)}
            disabled={settingLoading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 ${
              settings.registrations_enabled === '1' ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              settings.registrations_enabled === '1' ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Username</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">2FA</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sessions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {users.map((u) => {
                const isSelf = u.id === user?.id;
                return (
                  <tr
                    key={u.id}
                    className={`transition-colors ${isSelf ? 'opacity-60 bg-gray-50 dark:bg-gray-700/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {u.username}
                      {isSelf && <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'admin'
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.is_active === 1
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active === 1 ? 'bg-green-500' : 'bg-red-500'}`} />
                        {u.is_active === 1 ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${
                        u.totp_enabled === 1
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {u.totp_enabled === 1 ? 'Enabled' : 'Off'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.session_count}</td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className="text-xs text-gray-400 dark:text-gray-500">N/A</span>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleToggleActive(u)}
                            disabled={!!actionLoading}
                            className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors disabled:opacity-50 ${
                              u.is_active === 1
                                ? 'border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                : 'border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                            }`}
                          >
                            {actionLoading === `active-${u.id}` ? '...' : (u.is_active === 1 ? 'Disable' : 'Enable')}
                          </button>

                          <button
                            onClick={() => handleToggleRole(u)}
                            disabled={!!actionLoading}
                            className="px-2.5 py-1 text-xs font-medium rounded-md border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === `role-${u.id}` ? '...' : (u.role === 'admin' ? 'Demote' : 'Promote')}
                          </button>

                          <button
                            onClick={() => setDeleteConfirm(u)}
                            disabled={!!actionLoading}
                            className="px-2.5 py-1 text-xs font-medium rounded-md border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
