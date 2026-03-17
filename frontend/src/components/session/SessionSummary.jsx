import React, { useState } from 'react';

function ScoreRing({ score, passing }) {
  const passed = score >= passing;
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
          className="dark:stroke-gray-700"
        />
        <circle
          cx="70" cy="70" r={radius}
          fill="none"
          stroke={passed ? '#22c55e' : '#ef4444'}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-bold ${passed ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
          {Math.round(score)}%
        </span>
        <span className={`text-xs font-semibold ${passed ? 'text-green-500 dark:text-green-400' : 'text-red-400'}`}>
          {passed ? 'PASSED' : 'FAILED'}
        </span>
      </div>
    </div>
  );
}

export default function SessionSummary({ summary, onBack, onRetry }) {
  const { session, exam, passed, answers, objective_breakdown } = summary;
  const [showAnswers, setShowAnswers] = useState(false);

  const correctCount = answers.filter(a => a.is_correct).length;
  const score = session.score !== null ? Math.round(session.score * 10) / 10 : 0;

  function formatDuration() {
    if (!session.completed_at || !session.started_at) return null;
    const ms = new Date(session.completed_at) - new Date(session.started_at);
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
  }

  const duration = formatDuration();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Score summary card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">Session Complete</h1>

        <div className="flex flex-col sm:flex-row items-center gap-8">
          <ScoreRing score={score} passing={exam.passing_score} />

          <div className="flex-1 space-y-3 w-full">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{correctCount}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Correct</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{answers.length - correctCount}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Incorrect</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{answers.length}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{exam.passing_score}%</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Passing</div>
              </div>
            </div>
            {duration && (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">Time: {duration}</p>
            )}
          </div>
        </div>
      </div>

      {/* Objective breakdown */}
      {objective_breakdown.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Objective Breakdown</h2>
          <div className="space-y-3">
            {objective_breakdown.sort((a, b) => a.code.localeCompare(b.code)).map(obj => (
              <div key={obj.code}>
                <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                  <div>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mr-2">Obj. {obj.code}</span>
                    <span className="text-sm text-gray-900 dark:text-white">{obj.title}</span>
                  </div>
                  <span className={`text-xs font-semibold ${
                    obj.accuracy >= 80 ? 'text-green-600 dark:text-green-400' :
                    obj.accuracy >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {obj.accuracy}% ({obj.correct}/{obj.total})
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      obj.accuracy >= 80 ? 'bg-green-400' :
                      obj.accuracy >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${obj.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review answers toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <button
          onClick={() => setShowAnswers(!showAnswers)}
          className="w-full flex items-center justify-between text-left"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Review Answers</h2>
          <span className="text-gray-400 dark:text-gray-500">
            <svg
              className={`w-5 h-5 transition-transform ${showAnswers ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {showAnswers && (
          <div className="mt-4 space-y-4">
            {answers.map((answer, idx) => (
              <div
                key={answer.id}
                className={`p-4 rounded-xl border ${
                  answer.is_correct
                    ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                    : 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 mt-0.5">Q{idx + 1}</span>
                  {answer.objective_code && (
                    <span className="badge badge-purple text-xs">Obj. {answer.objective_code}</span>
                  )}
                  {answer.is_correct ? (
                    <span className="badge badge-green text-xs ml-auto">Correct</span>
                  ) : (
                    <span className="badge badge-red text-xs ml-auto">Incorrect</span>
                  )}
                </div>
                <p className="text-sm text-gray-900 dark:text-white mb-2 line-clamp-2">{answer.body}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Your answer: <span className="font-medium">{answer.selected_key}</span>
                  {!answer.is_correct && (
                    <> · Correct: <span className="font-medium text-green-700 dark:text-green-400">{answer.correct_key}</span></>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex-1">
          Back to Exam
        </button>
        <button onClick={onRetry} className="btn-primary flex-1">
          Practice Again
        </button>
      </div>
    </div>
  );
}
