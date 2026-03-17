import React from 'react';

export default function WeakAreaList({ weakAreas }) {
  if (!weakAreas || weakAreas.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
        No weak areas identified yet. Complete more sessions to see recommendations.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {weakAreas.map((area, idx) => (
        <div
          key={idx}
          className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg"
        >
          <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-800/40 rounded-lg flex items-center justify-center">
            <span className="text-red-600 dark:text-red-400 text-sm font-bold">{Math.round(area.accuracy)}%</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {area.objective_title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {area.exam_title} · {area.correct}/{area.total_answered} correct
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
