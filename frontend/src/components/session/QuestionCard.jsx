import React from 'react';

function renderBody(body) {
  // Split on triple-backtick code blocks
  if (!body.includes('```')) {
    return <p className="text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">{body}</p>;
  }

  const parts = body.split(/(```[\w]*\n[\s\S]*?```)/);
  return (
    <div className="space-y-3">
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const code = part.replace(/^```[\w]*\n/, '').replace(/```$/, '');
          return (
            <pre
              key={i}
              className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-lg p-4 overflow-x-auto text-sm font-mono leading-relaxed"
            >
              <code>{code}</code>
            </pre>
          );
        }
        return part.trim() ? (
          <p key={i} className="text-gray-900 dark:text-white leading-relaxed">{part.trim()}</p>
        ) : null;
      })}
    </div>
  );
}

export default function QuestionCard({ question, selectedKey, onSelect, submitted, correctKey }) {
  const { body, choices, objective, position, total, difficulty } = question;

  function getChoiceStyle(key) {
    if (!submitted) {
      const isSelected = key === selectedKey;
      return `flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
          : 'border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-indigo-400 dark:hover:border-indigo-400'
      } ${onSelect ? 'cursor-pointer' : 'cursor-default'}`;
    }

    // After submission
    if (key === correctKey) {
      return 'flex items-start gap-3 p-4 rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-900/30 cursor-default';
    }
    if (key === selectedKey && key !== correctKey) {
      return 'flex items-start gap-3 p-4 rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-900/30 cursor-default';
    }
    return 'flex items-start gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 cursor-default opacity-60';
  }

  function getKeyStyle(key) {
    if (!submitted) {
      return key === selectedKey
        ? 'w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0'
        : 'w-7 h-7 rounded-full border-2 border-gray-300 dark:border-gray-500 text-gray-500 dark:text-gray-400 flex items-center justify-center text-xs font-bold flex-shrink-0';
    }
    if (key === correctKey) {
      return 'w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0';
    }
    if (key === selectedKey && key !== correctKey) {
      return 'w-7 h-7 rounded-full bg-red-400 text-white flex items-center justify-center text-xs font-bold flex-shrink-0';
    }
    return 'w-7 h-7 rounded-full border-2 border-gray-200 dark:border-gray-600 text-gray-400 flex items-center justify-center text-xs font-bold flex-shrink-0';
  }

  const difficultyColor = {
    easy: 'badge-green',
    medium: 'badge-yellow',
    hard: 'badge-red',
  }[difficulty] || 'badge-blue';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      {/* Question header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Question {position} of {total}
          </span>
          {objective && (
            <span className="badge badge-purple text-xs">
              Obj. {objective.code}: {objective.title}
            </span>
          )}
          <span className={`badge ${difficultyColor} text-xs capitalize`}>
            {difficulty}
          </span>
        </div>
      </div>

      {/* Question body */}
      <div className="text-base">
        {renderBody(body)}
      </div>

      {/* Choices */}
      <div className="space-y-3">
        {choices.map(({ key, text }) => (
          <div
            key={key}
            className={getChoiceStyle(key)}
            onClick={() => onSelect && !submitted && onSelect(key)}
            role={onSelect && !submitted ? 'radio' : undefined}
            aria-checked={key === selectedKey}
            tabIndex={onSelect && !submitted ? 0 : undefined}
            onKeyDown={e => {
              if ((e.key === 'Enter' || e.key === ' ') && onSelect && !submitted) {
                onSelect(key);
              }
            }}
          >
            <div className={getKeyStyle(key)}>{key}</div>
            <span className={`text-sm leading-relaxed pt-0.5 ${
              submitted && key === correctKey
                ? 'text-green-900 dark:text-green-100'
                : submitted && key === selectedKey && key !== correctKey
                ? 'text-red-900 dark:text-red-100'
                : 'text-gray-900 dark:text-white'
            }`}>{text}</span>
            {submitted && key === correctKey && (
              <span className="ml-auto flex-shrink-0 text-green-500">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </span>
            )}
            {submitted && key === selectedKey && key !== correctKey && (
              <span className="ml-auto flex-shrink-0 text-red-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
