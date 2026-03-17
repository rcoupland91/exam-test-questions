import React from 'react';

export default function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round(((current - 1) / total) * 100) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
        <span>Progress</span>
        <span className="font-medium">
          {current} <span className="text-gray-400 dark:text-gray-500">/ {total}</span>
        </span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
