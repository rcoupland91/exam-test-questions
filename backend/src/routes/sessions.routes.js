import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helper: check session ownership for the current request
function ownsSession(session, req) {
  if (req.user && session.user_id === req.user.id) return true;
  if (req.guestId && session.guest_id === req.guestId) return true;
  return false;
}

// POST /api/sessions
router.post('/', optionalAuth, (req, res, next) => {
  try {
    const db = getDb();
    const { exam_id, mode = 'practice', question_count } = req.body;

    if (!req.user && !req.guestId) {
      return res.status(401).json({ error: 'Authentication or guest ID required' });
    }

    if (!exam_id) {
      return res.status(400).json({ error: 'exam_id is required' });
    }

    const exam = db.prepare('SELECT * FROM exams WHERE id = ? OR slug = ?').get(exam_id, exam_id);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Get all questions for the exam
    let questions = db.prepare('SELECT id FROM questions WHERE exam_id = ?').all(exam.id);
    if (questions.length === 0) {
      return res.status(400).json({ error: 'This exam has no questions' });
    }

    // Shuffle and optionally limit
    const shuffled = shuffle(questions.map(q => q.id));
    const isGuest = !req.user;
    const guestLimit = Math.max(1, Math.ceil(shuffled.length * 0.15));
    const maxAllowed = isGuest ? guestLimit : shuffled.length;
    const limit = question_count ? Math.min(parseInt(question_count), maxAllowed) : maxAllowed;
    const selectedIds = shuffled.slice(0, limit);

    const userId = req.user ? req.user.id : null;
    const guestId = req.user ? null : req.guestId;

    const result = db.prepare(`
      INSERT INTO sessions (user_id, guest_id, exam_id, mode, status, question_ids, total_questions)
      VALUES (?, ?, ?, ?, 'active', ?, ?)
    `).run(userId, guestId, exam.id, mode, JSON.stringify(selectedIds), selectedIds.length);

    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ session, guest_limited: isGuest });
  } catch (err) {
    next(err);
  }
});

// GET /api/sessions/:id/question
router.get('/:id/question', optionalAuth, (req, res, next) => {
  try {
    const db = getDb();
    const sessionId = req.params.id;

    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
    if (!session || !ownsSession(session, req)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status === 'completed') {
      return res.json({ status: 'completed', session_id: session.id });
    }

    const questionIds = JSON.parse(session.question_ids);

    // Find answered question IDs
    const answeredRows = db.prepare(
      'SELECT question_id FROM answers WHERE session_id = ?'
    ).all(sessionId);
    const answeredSet = new Set(answeredRows.map(r => r.question_id));

    // Find first unanswered question
    const nextId = questionIds.find(id => !answeredSet.has(id));

    if (!nextId) {
      // All answered — auto-complete session
      const correctCount = db.prepare(
        'SELECT SUM(is_correct) as cnt FROM answers WHERE session_id = ?'
      ).get(sessionId).cnt || 0;
      const score = (correctCount / session.total_questions) * 100;

      db.prepare(`
        UPDATE sessions SET status = 'completed', score = ?, completed_at = datetime('now') WHERE id = ?
      `).run(score, sessionId);

      return res.json({ status: 'completed', session_id: session.id });
    }

    const question = db.prepare(`
      SELECT q.id, q.body, q.choices, q.difficulty, q.tags,
             o.code as objective_code, o.title as objective_title
      FROM questions q
      LEFT JOIN objectives o ON q.objective_id = o.id
      WHERE q.id = ?
    `).get(nextId);

    const position = answeredSet.size + 1;

    res.json({
      question: {
        id: question.id,
        body: question.body,
        choices: JSON.parse(question.choices),
        difficulty: question.difficulty,
        tags: JSON.parse(question.tags || '[]'),
        objective: question.objective_code ? {
          code: question.objective_code,
          title: question.objective_title,
        } : null,
        position,
        total: session.total_questions,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/sessions/:id/answers
router.post('/:id/answers', optionalAuth, (req, res, next) => {
  try {
    const db = getDb();
    const sessionId = req.params.id;
    const { question_id, selected_key } = req.body;

    if (!question_id || !selected_key) {
      return res.status(400).json({ error: 'question_id and selected_key are required' });
    }

    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
    if (!session || !ownsSession(session, req)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status === 'completed') {
      return res.status(400).json({ error: 'Session is already completed' });
    }

    const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(question_id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Check if already answered
    const existing = db.prepare(
      'SELECT id FROM answers WHERE session_id = ? AND question_id = ?'
    ).get(sessionId, question_id);
    if (existing) {
      return res.status(409).json({ error: 'Question already answered in this session' });
    }

    const is_correct = selected_key === question.correct_key ? 1 : 0;

    db.prepare(`
      INSERT INTO answers (session_id, question_id, selected_key, is_correct)
      VALUES (?, ?, ?, ?)
    `).run(sessionId, question_id, selected_key, is_correct);

    // Check if session complete
    const answeredCount = db.prepare(
      'SELECT COUNT(*) as cnt FROM answers WHERE session_id = ?'
    ).get(sessionId).cnt;

    let sessionProgress = {
      answered: answeredCount,
      total: session.total_questions,
      completed: false,
    };

    if (answeredCount >= session.total_questions) {
      const correctCount = db.prepare(
        'SELECT SUM(is_correct) as cnt FROM answers WHERE session_id = ?'
      ).get(sessionId).cnt || 0;
      const score = (correctCount / session.total_questions) * 100;

      db.prepare(`
        UPDATE sessions SET status = 'completed', score = ?, completed_at = datetime('now') WHERE id = ?
      `).run(score, sessionId);

      sessionProgress.completed = true;
      sessionProgress.score = Math.round(score * 10) / 10;
    }

    res.json({
      result: {
        is_correct: is_correct === 1,
        correct_key: question.correct_key,
        explanation: question.explanation,
        session_progress: sessionProgress,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/sessions/:id/summary
router.get('/:id/summary', optionalAuth, (req, res, next) => {
  try {
    const db = getDb();
    const sessionId = req.params.id;

    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
    if (!session || !ownsSession(session, req)) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const exam = db.prepare('SELECT * FROM exams WHERE id = ?').get(session.exam_id);

    const answers = db.prepare(`
      SELECT a.*, q.body, q.choices, q.correct_key, q.explanation, q.difficulty,
             o.code as objective_code, o.title as objective_title
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      LEFT JOIN objectives o ON q.objective_id = o.id
      WHERE a.session_id = ?
      ORDER BY a.answered_at
    `).all(sessionId);

    // Compute objective breakdown
    const objectiveMap = {};
    for (const a of answers) {
      const code = a.objective_code || 'unknown';
      if (!objectiveMap[code]) {
        objectiveMap[code] = {
          code,
          title: a.objective_title || 'Unknown',
          total: 0,
          correct: 0,
        };
      }
      objectiveMap[code].total++;
      if (a.is_correct) objectiveMap[code].correct++;
    }

    const objective_breakdown = Object.values(objectiveMap).map(obj => ({
      ...obj,
      accuracy: Math.round((obj.correct / obj.total) * 100),
    }));

    const passed = session.score !== null && session.score >= exam.passing_score;

    res.json({
      session: {
        ...session,
        question_ids: JSON.parse(session.question_ids),
      },
      exam,
      passed,
      answers: answers.map(a => ({
        ...a,
        choices: JSON.parse(a.choices),
        is_correct: a.is_correct === 1,
      })),
      objective_breakdown,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/sessions
router.get('/', optionalAuth, (req, res, next) => {
  try {
    const db = getDb();
    const { exam_id } = req.query;

    if (!req.user && !req.guestId) {
      return res.status(401).json({ error: 'Authentication or guest ID required' });
    }

    let query;
    let params;

    if (req.user) {
      query = 'SELECT s.*, e.title as exam_title, e.slug as exam_slug FROM sessions s JOIN exams e ON s.exam_id = e.id WHERE s.user_id = ?';
      params = [req.user.id];
    } else {
      query = 'SELECT s.*, e.title as exam_title, e.slug as exam_slug FROM sessions s JOIN exams e ON s.exam_id = e.id WHERE s.guest_id = ?';
      params = [req.guestId];
    }

    if (exam_id) {
      query += ' AND s.exam_id = ?';
      params.push(exam_id);
    }

    query += ' ORDER BY s.started_at DESC';

    const sessions = db.prepare(query).all(...params);

    res.json({ sessions });
  } catch (err) {
    next(err);
  }
});

export default router;
