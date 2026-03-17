import React from 'react';
import { Link } from 'react-router-dom';

function DifficultyBadge({ score, passing }) {
  if (score === null || score === undefined) return null;
  const passed = score >= passing;
  return (
    <span className={`badge ${passed ? 'badge-green' : 'badge-red'}`}>
      {passed ? 'Passing' : 'Failing'}
    </span>
  );
}

export default function ExamCard({ exam }) {
  const {
    id, slug, title, vendor, version,
    question_count, passing_score, user_stats
  } = exam;

  const hasAttempted = (user_stats?.total_sessions ?? 0) > 0;
  const isTerraform = slug === 'terraform-associate-004' || vendor === 'HashiCorp';

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 rounded-xl shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {vendor && <span className="badge badge-purple">{vendor}</span>}
            {version && <span className="badge badge-blue">{version}</span>}
            {hasAttempted && (
              <DifficultyBadge score={user_stats?.best_score} passing={passing_score} />
            )}
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white leading-snug">{title}</h3>
        </div>
        <div className="flex-shrink-0">
          {isTerraform ? (
            <img src="/terraform-badge.svg" className="w-10 h-auto" alt="Terraform" />
          ) : (
            <span className="text-2xl">📋</span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
        <span>{question_count} questions</span>
        <span>Pass: {passing_score}%</span>
        {hasAttempted && (
          <span>{user_stats?.total_sessions} attempt{user_stats?.total_sessions !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Best score bar */}
      {hasAttempted && user_stats?.best_score != null && (
        <div>
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Best score</span>
            <span className="font-medium">{Math.round(user_stats.best_score)}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                user_stats.best_score >= passing_score ? 'bg-green-400' : 'bg-red-400'
              }`}
              style={{ width: `${user_stats.best_score}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto pt-2">
        <Link
          to={`/exams/${slug}`}
          className="btn-primary flex-1 text-center text-sm"
        >
          {hasAttempted ? 'Practice Again' : 'Start Practicing'}
        </Link>
        <Link
          to={`/exams/${slug}`}
          className="btn-secondary text-sm px-3"
          title="View details"
        >
          Details
        </Link>
      </div>
    </div>
  );
}
