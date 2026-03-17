import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { progressApi } from '../api/progress.js';
import { useAuth } from '../context/AuthContext.jsx';
import ScoreHistoryChart from '../components/dashboard/ScoreHistoryChart.jsx';
import ObjectiveAccuracyBar from '../components/dashboard/ObjectiveAccuracyBar.jsx';
import WeakAreaList from '../components/dashboard/WeakAreaList.jsx';

export default function DashboardPage() {
  const { user, isGuest } = useAuth();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    progressApi.get()
      .then(res => setProgress(res.data))
      .catch(() => setError('Failed to load progress data.'))
      .finally(() => setLoading(false));
  }, [isGuest]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="flex items-center justify-center py-16 px-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-10 max-w-md w-full text-center space-y-6">
          <div className="text-5xl">📊</div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Track your progress</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              Create a free account to track your progress, see score history, and identify weak areas.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="btn-primary text-sm px-6 py-2.5">
              Create free account
            </Link>
            <Link to="/login" className="btn-secondary text-sm px-6 py-2.5">
              Sign in
            </Link>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            You can still browse exams and practice as a guest.{' '}
            <Link to="/exams" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium">
              Browse exams
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-700 dark:text-red-400">{error}</div>
    );
  }

  const { overall, recent_sessions, by_exam, weak_areas } = progress;

  return (
    <div className="space-y-6 md:space-y-8 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.username}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Track your progress and identify areas for improvement.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Sessions Completed"
          value={overall.completed_sessions}
          icon="🎯"
        />
        <StatCard
          label="Average Score"
          value={overall.avg_score !== null ? `${overall.avg_score}%` : '—'}
          icon="📊"
          highlight={overall.avg_score >= 70}
        />
        <StatCard
          label="Best Score"
          value={overall.best_score !== null ? `${Math.round(overall.best_score)}%` : '—'}
          icon="🏆"
        />
        <StatCard
          label="Total Sessions"
          value={overall.total_sessions}
          icon="📝"
        />
      </div>

      {/* Score history chart */}
      {recent_sessions.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Score History</h2>
          <ScoreHistoryChart sessions={recent_sessions} />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="text-4xl mb-3">📚</div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No sessions yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Start a practice session to see your score history.</p>
          <Link to="/exams" className="btn-primary">
            Browse Exams
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Per-exam breakdown */}
        {by_exam.filter(e => e.total_sessions > 0).length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance by Exam</h2>
            <div className="space-y-4">
              {by_exam.filter(e => e.total_sessions > 0).map(exam => (
                <div key={exam.exam_id}>
                  <div className="flex items-center justify-between mb-1">
                    <Link
                      to={`/exams/${exam.exam_slug}`}
                      className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 truncate max-w-[180px]"
                    >
                      {exam.exam_title}
                    </Link>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {exam.avg_score !== null ? `${exam.avg_score}% avg` : '—'}
                    </span>
                  </div>
                  <ObjectiveAccuracyBar
                    accuracy={exam.avg_score}
                    label={`${exam.total_sessions} session${exam.total_sessions !== 1 ? 's' : ''}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weak areas */}
        {weak_areas.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Areas to Improve</h2>
            <WeakAreaList weakAreas={weak_areas} />
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, highlight }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-5 ${
      highlight
        ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`text-2xl font-bold ${highlight ? 'text-green-700 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
        {value}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}
