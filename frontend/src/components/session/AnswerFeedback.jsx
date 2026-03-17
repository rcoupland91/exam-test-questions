import React from 'react';

export default function AnswerFeedback({ result }) {
  const { is_correct, explanation, session_progress } = result;

  return (
    <div className={`rounded-xl border-l-4 p-5 ${
      is_correct
        ? 'border-l-green-500 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
        : 'border-l-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        {is_correct ? (
          <>
            <span className="text-green-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="font-semibold text-green-700 dark:text-green-300">Correct!</span>
          </>
        ) : (
          <>
            <span className="text-red-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </span>
            <span className="font-semibold text-red-700 dark:text-red-300">Incorrect</span>
          </>
        )}

        {session_progress && (
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
            {session_progress.answered} / {session_progress.total} answered
          </span>
        )}
      </div>

      <div className={`text-sm leading-relaxed ${
        is_correct
          ? 'text-green-800 dark:text-green-200'
          : 'text-red-800 dark:text-red-200'
      }`}>
        <p className="font-medium mb-1">Explanation:</p>
        <p className="whitespace-pre-wrap">{explanation}</p>
      </div>
    </div>
  );
}
