import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examsApi } from '../api/exams.js';
import { sessionsApi } from '../api/sessions.js';
import ObjectiveAccuracyBar from '../components/dashboard/ObjectiveAccuracyBar.jsx';

export default function ExamDetailPage() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [questionCount, setQuestionCount] = useState(20);

  useEffect(() => {
    examsApi.get(examId)
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load exam details.'))
      .finally(() => setLoading(false));
  }, [examId]);

  async function startSession() {
    setStarting(true);
    setError('');
    try {
      const res = await sessionsApi.create({
        exam_id: data.exam.id,
        mode: 'practice',
        question_count: questionCount,
      });
      navigate(`/sessions/${res.data.session.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start session.');
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !data) {
    return <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-700 dark:text-red-400">{error}</div>;
  }

  const { exam, objectives, user_stats } = data;

  return (
    <div className="max-w-4xl space-y-6 md:space-y-8 px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-purple">{exam.vendor}</span>
            <span className="badge badge-blue">{exam.version}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{exam.title}</h1>
          {exam.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm max-w-2xl">{exam.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-center">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 min-w-[80px]">
            <div className="text-xl font-bold text-gray-900 dark:text-white">{user_stats.total_sessions}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Sessions</div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 min-w-[80px]">
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {user_stats.best_score !== null ? `${Math.round(user_stats.best_score)}%` : '—'}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Best Score</div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 min-w-[80px]">
            <div className="text-xl font-bold text-gray-900 dark:text-white">{exam.passing_score}%</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Passing</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      {/* Start session */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Start Practice Session</h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="questionCount">Number of questions</label>
            <select
              id="questionCount"
              value={questionCount}
              onChange={e => setQuestionCount(Number(e.target.value))}
              className="block w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value={10}>10 questions</option>
              <option value={20}>20 questions</option>
              <option value={30}>30 questions</option>
              <option value={50}>50 questions</option>
              <option value={9999}>All questions</option>
            </select>
          </div>
          <div className="flex-1 flex items-end">
            <button
              onClick={startSession}
              disabled={starting}
              className="btn-primary"
            >
              {starting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Starting...
                </span>
              ) : 'Start Session'}
            </button>
          </div>
        </div>
      </div>

      {/* Objectives */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Exam Objectives</h2>
        <div className="space-y-4">
          {objectives.map(obj => {
            const acc = user_stats.objective_accuracy?.[obj.code];
            return (
              <div key={obj.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mr-2">
                      Objective {obj.code}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{obj.title}</span>
                  </div>
                  {acc?.accuracy !== null && acc?.accuracy !== undefined && (
                    <span className={`text-xs font-medium ${
                      acc.accuracy >= 80 ? 'text-green-600 dark:text-green-400' :
                      acc.accuracy >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {acc.accuracy}% ({acc.correct}/{acc.total})
                    </span>
                  )}
                </div>
                {acc?.total > 0 ? (
                  <ObjectiveAccuracyBar accuracy={acc.accuracy} />
                ) : (
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
