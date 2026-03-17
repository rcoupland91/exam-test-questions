import React, { useState } from 'react';
import { authApi } from '../api/auth.js';
import { useAuth } from '../context/AuthContext.jsx';

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#0ea5e9', '#64748b',
];

function getToken() {
  return localStorage.getItem('exam_token') || sessionStorage.getItem('exam_token');
}

export default function ProfilePage() {
  const { user, login } = useAuth();

  // Username / avatar edit state
  const [editUsername, setEditUsername] = useState('');
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(user?.avatar_color || '#6366f1');
  const [colorLoading, setColorLoading] = useState(false);

  // 2FA setup state
  const [qrCode, setQrCode] = useState(null);
  const [manualSecret, setManualSecret] = useState('');
  const [setupCode, setSetupCode] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [activateLoading, setActivateLoading] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const totpEnabled = user?.totp_enabled === 1;
  const avatarColor = user?.avatar_color || '#6366f1';

  async function handleSaveUsername(e) {
    e.preventDefault();
    setUsernameLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await authApi.updateProfile({ username: editUsername });
      const token = getToken();
      login(token, res.data.user, !!localStorage.getItem('exam_token'));
      setMessage('Username updated.');
      setEditingUsername(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update username');
    } finally {
      setUsernameLoading(false);
    }
  }

  async function handleSaveColor(color) {
    setSelectedColor(color);
    setColorLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await authApi.updateProfile({ avatar_color: color });
      const token = getToken();
      login(token, res.data.user, !!localStorage.getItem('exam_token'));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update avatar');
    } finally {
      setColorLoading(false);
    }
  }

  async function handleSetup2fa() {
    setSetupLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await authApi.setup2fa();
      setQrCode(res.data.qr_code);
      setManualSecret(res.data.secret);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start 2FA setup');
    } finally {
      setSetupLoading(false);
    }
  }

  async function handleActivate2fa(e) {
    e.preventDefault();
    setActivateLoading(true);
    setError('');
    setMessage('');
    try {
      await authApi.verify2fa({ token: setupCode });
      // Refresh user info via /me
      const meRes = await authApi.me();
      const token = getToken();
      login(token, meRes.data.user, !!localStorage.getItem('exam_token'));
      setMessage('2FA has been enabled successfully.');
      setQrCode(null);
      setManualSecret('');
      setSetupCode('');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code. Please try again.');
    } finally {
      setActivateLoading(false);
    }
  }

  async function handleDisable2fa() {
    setDisableLoading(true);
    setError('');
    setMessage('');
    try {
      await authApi.disable2fa();
      const meRes = await authApi.me();
      const token = getToken();
      login(token, meRes.data.user, !!localStorage.getItem('exam_token'));
      setMessage('2FA has been disabled.');
      setConfirmDisable(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to disable 2FA');
    } finally {
      setDisableLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Profile</h1>

      {/* User info card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">

        {message && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg text-sm text-green-700 dark:text-green-400">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="shrink-0">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-sm transition-colors"
              style={{ backgroundColor: avatarColor }}
            >
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            {/* Color swatches */}
            <div className="flex flex-wrap gap-1.5 mt-3 max-w-[72px]">
              {AVATAR_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => handleSaveColor(color)}
                  disabled={colorLoading}
                  title={color}
                  className={`w-6 h-6 rounded-full transition-transform hover:scale-110 disabled:opacity-50 ${selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800' : ''}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {editingUsername ? (
                <form onSubmit={handleSaveUsername} className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value)}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    minLength={3}
                    required
                  />
                  <button type="submit" disabled={usernameLoading} className="btn-primary text-xs px-3 py-1.5">
                    {usernameLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={() => setEditingUsername(false)} className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{user?.username}</h2>
                  {user?.role === 'admin' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                      Admin
                    </span>
                  )}
                  <button
                    onClick={() => { setEditUsername(user?.username || ''); setEditingUsername(true); setError(''); setMessage(''); }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 capitalize">Role: {user?.role || 'user'}</p>
          </div>
        </div>
      </div>

      {/* 2FA card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Two-Factor Authentication</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Add an extra layer of security to your account using an authenticator app.
        </p>

        {totpEnabled ? (
          /* 2FA is enabled */
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                2FA Active
              </span>
            </div>

            {confirmDisable ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                  Are you sure you want to disable 2FA? Your account will be less secure.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDisable2fa}
                    disabled={disableLoading}
                    className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {disableLoading ? 'Disabling...' : 'Yes, disable 2FA'}
                  </button>
                  <button
                    onClick={() => setConfirmDisable(false)}
                    className="px-4 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDisable(true)}
                className="px-4 py-2 text-sm font-medium border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Disable 2FA
              </button>
            )}
          </div>
        ) : (
          /* 2FA is not enabled */
          <div>
            {!qrCode ? (
              <button
                onClick={handleSetup2fa}
                disabled={setupLoading}
                className="btn-primary px-4 py-2 text-sm"
              >
                {setupLoading ? 'Loading...' : 'Set up 2FA'}
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    Scan this QR code with your authenticator app (e.g. Google Authenticator, Authy):
                  </p>
                  <img
                    src={qrCode}
                    alt="2FA QR Code"
                    className="w-48 h-48 border border-gray-200 dark:border-gray-600 rounded-lg bg-white p-1"
                  />
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Or enter this key manually:</p>
                  <code className="block text-sm font-mono bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-lg break-all">
                    {manualSecret}
                  </code>
                </div>

                <form onSubmit={handleActivate2fa} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Enter the 6-digit code to activate
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      value={setupCode}
                      onChange={(e) => { setSetupCode(e.target.value); setError(''); }}
                      className="block w-40 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-center tracking-widest"
                      placeholder="000000"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={activateLoading || setupCode.length !== 6}
                      className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
                    >
                      {activateLoading ? 'Activating...' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setQrCode(null); setManualSecret(''); setSetupCode(''); setError(''); }}
                      className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
