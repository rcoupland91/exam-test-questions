import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth.js';

const AuthContext = createContext(null);

const GUEST_ID_KEY = 'examforge_guest_id';

function getOrCreateGuestId() {
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [guestId, setGuestId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    // Always ensure a guestId exists in localStorage
    const id = getOrCreateGuestId();
    setGuestId(id);

    const token = localStorage.getItem('exam_token');
    const guestMode = localStorage.getItem('exam_guest_mode');

    if (token) {
      authApi.me()
        .then((res) => {
          setUser(res.data.user);
          setIsGuest(false);
        })
        .catch(() => {
          // Token invalid/expired — clear storage
          localStorage.removeItem('exam_token');
          localStorage.removeItem('exam_user');
          setUser(null);
          // Restore guest mode if it was set
          if (guestMode === 'true') {
            setIsGuest(true);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (guestMode === 'true') {
      setIsGuest(true);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  function login(token, userData) {
    localStorage.setItem('exam_token', token);
    localStorage.setItem('exam_user', JSON.stringify(userData));
    localStorage.removeItem('exam_guest_mode');
    setUser(userData);
    setIsGuest(false);
  }

  function logout() {
    localStorage.removeItem('exam_token');
    localStorage.removeItem('exam_user');
    localStorage.removeItem('exam_guest_mode');
    setUser(null);
    setIsGuest(false);
    // guestId is intentionally kept so session history remains accessible
  }

  function continueAsGuest() {
    localStorage.removeItem('exam_token');
    localStorage.removeItem('exam_user');
    localStorage.setItem('exam_guest_mode', 'true');
    setUser(null);
    setIsGuest(true);
  }

  return (
    <AuthContext.Provider value={{ user, loading, isGuest, guestId, login, logout, continueAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
