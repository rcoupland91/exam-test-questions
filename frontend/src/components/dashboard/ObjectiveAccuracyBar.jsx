import React from 'react';

export default function ObjectiveAccuracyBar({ accuracy, label }) {
  const pct = accuracy !== null && accuracy !== undefined ? Math.max(0, Math.min(100, accuracy)) : 0;

  let barColor = 'bg-red-400';
  let textColor = 'text-red-600 dark:text-red-400';
  if (pct >= 80) {
    barColor = 'bg-green-400';
    textColor = 'text-green-600 dark:text-green-400';
  } else if (pct >= 60) {
    barColor = 'bg-yellow-400';
    textColor = 'text-yellow-600 dark:text-yellow-400';
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center gap-1 min-w-[60px]">
        {accuracy !== null && accuracy !== undefined ? (
          <span className={`text-xs font-semibold ${textColor}`}>{Math.round(pct)}%</span>
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-500">No data</span>
        )}
        {label && <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>}
      </div>
    </div>
  );
}
