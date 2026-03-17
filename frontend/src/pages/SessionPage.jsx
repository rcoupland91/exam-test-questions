import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { sessionsApi } from '../api/sessions.js';
import { useAuth } from '../context/AuthContext.jsx';
import QuestionCard from '../components/session/QuestionCard.jsx';
import AnswerFeedback from '../components/session/AnswerFeedback.jsx';
import ProgressBar from '../components/session/ProgressBar.jsx';
import SessionSummary from '../components/session/SessionSummary.jsx';

// State machine states
const STATE = {
  LOADING: 'loading',
  QUESTION: 'question',
  SUBMITTED: 'submitted',
  SUMMARY: 'summary',
};

export default function SessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isGuest } = useAuth();
  const guestLimited = location.state?.guestLimited ?? false;

  const [pageState, setPageState] = useState(STATE.LOADING);
  const [question, setQuestion] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [result, setResult] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadQuestion = useCallback(async () => {
    setPageState(STATE.LOADING);
    setSelectedKey(null);
    setResult(null);
    setError('');

    try {
      const res = await sessionsApi.getQuestion(sessionId);
      if (res.data.status === 'completed') {
        // Load summary
        const summaryRes = await sessionsApi.getSummary(sessionId);
        setSummary(summaryRes.data);
        setPageState(STATE.SUMMARY);
      } else {
        setQuestion(res.data.question);
        setPageState(STATE.QUESTION);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load question.');
      setPageState(STATE.QUESTION); // stay in question state to show error
    }
  }, [sessionId]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  async function handleSubmit() {
    if (!selectedKey) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await sessionsApi.submitAnswer(sessionId, {
        question_id: question.id,
        selected_key: selectedKey,
      });
      setResult(res.data.result);
      setPageState(STATE.SUBMITTED);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit answer.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNext() {
    if (result?.session_progress?.completed) {
      // Load summary directly
      setPageState(STATE.LOADING);
      try {
        const summaryRes = await sessionsApi.getSummary(sessionId);
        setSummary(summaryRes.data);
        setPageState(STATE.SUMMARY);
      } catch {
        setError('Failed to load summary.');
      }
    } else {
      loadQuestion();
    }
  }

  // Loading state
  if (pageState === STATE.LOADING) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Summary state
  if (pageState === STATE.SUMMARY && summary) {
    return (
      <div className="space-y-4 px-4 md:px-0">
        {isGuest && (
          <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold text-indigo-900 dark:text-indigo-200 text-sm">Save your progress permanently</p>
              <p className="text-indigo-700 dark:text-indigo-300 text-sm mt-0.5">
                Create a free account to track scores over time, see trends, and identify weak areas.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link to="/register" className="btn-primary text-sm px-4 py-2">
                Create account
              </Link>
              <Link to="/login" className="btn-secondary text-sm px-4 py-2">
                Sign in
              </Link>
            </div>
          </div>
        )}
        <SessionSummary
          summary={summary}
          onBack={() => navigate(`/exams/${summary.exam.slug}`)}
          onRetry={() => navigate(`/exams/${summary.exam.slug}`)}
        />
      </div>
    );
  }

  // Question / submitted states
  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 md:px-0">
      {/* Guest preview banner */}
      {guestLimited && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-semibold">Preview mode:</span> you're seeing a sample of questions.{' '}
            <Link to="/register" className="underline font-medium">Sign up free</Link> for the full exam.
          </p>
        </div>
      )}

      {/* Progress */}
      {question && (
        <ProgressBar
          current={question.position}
          total={question.total}
        />
      )}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Question card */}
      {question && (
        <QuestionCard
          question={question}
          selectedKey={selectedKey}
          onSelect={pageState === STATE.QUESTION ? setSelectedKey : undefined}
          submitted={pageState === STATE.SUBMITTED}
          correctKey={result?.correct_key}
        />
      )}

      {/* Feedback after submission */}
      {pageState === STATE.SUBMITTED && result && (
        <AnswerFeedback result={result} />
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary text-sm"
        >
          Exit Session
        </button>

        {pageState === STATE.QUESTION && (
          <button
            onClick={handleSubmit}
            disabled={!selectedKey || submitting}
            className="btn-primary"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </span>
            ) : 'Submit Answer'}
          </button>
        )}

        {pageState === STATE.SUBMITTED && (
          <button onClick={handleNext} className="btn-primary">
            {result?.session_progress?.completed ? 'View Results' : 'Next Question'}
          </button>
        )}
      </div>
    </div>
  );
}
