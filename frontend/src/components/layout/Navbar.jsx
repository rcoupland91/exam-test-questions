import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

export default function Navbar() {
  const { user, isGuest, isAdmin, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const navLinkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
    }`;

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/logo.svg" alt="ExamForge" className="w-8 h-8" />
            <span className="font-semibold text-gray-900 dark:text-gray-100 hidden sm:block">ExamForge</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
            <NavLink to="/exams" className={navLinkClass}>Exams</NavLink>
            {user && <NavLink to="/profile" className={navLinkClass}>Profile</NavLink>}
            {isAdmin && <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>}
          </div>

          {/* Right side: user menu + dark toggle + hamburger */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* User area (desktop) */}
            <div className="hidden sm:flex items-center gap-2">
              {isGuest ? (
                <>
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                    Guest
                  </span>
                  <Link to="/login" className="btn-secondary text-xs px-3 py-1.5">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary text-xs px-3 py-1.5">
                    Register
                  </Link>
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {user?.username}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {menuOpen && (
          <div className="md:hidden pb-3 pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
            <div className="flex flex-col gap-1">
              <NavLink
                to="/dashboard"
                className={navLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/exams"
                className={navLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                Exams
              </NavLink>
              {user && (
                <NavLink
                  to="/profile"
                  className={navLinkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  Profile
                </NavLink>
              )}
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={navLinkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  Admin
                </NavLink>
              )}

              {/* Mobile user actions */}
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                {isGuest ? (
                  <div className="flex gap-2 px-1">
                    <Link
                      to="/login"
                      className="btn-secondary text-sm flex-1 text-center"
                      onClick={() => setMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="btn-primary text-sm flex-1 text-center"
                      onClick={() => setMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{user?.username}</span>
                    <button
                      onClick={() => { handleLogout(); setMenuOpen(false); }}
                      className="btn-secondary text-sm px-3 py-1.5"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
