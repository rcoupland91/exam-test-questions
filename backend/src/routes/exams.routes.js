import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/exams
router.get('/', optionalAuth, (req, res, next) => {
  try {
    const db = getDb();

    const exams = db.prepare('SELECT * FROM exams ORDER BY title').all();

    const result = exams.map(exam => {
      const question_count = db.prepare(
        'SELECT COUNT(*) as cnt FROM questions WHERE exam_id = ?'
      ).get(exam.id).cnt;

      let stats;
      if (req.user) {
        stats = db.prepare(`
          SELECT COUNT(*) as total_sessions,
                 AVG(score) as avg_score,
                 MAX(score) as best_score
          FROM sessions
          WHERE user_id = ? AND exam_id = ? AND status = 'completed'
        `).get(req.user.id, exam.id);
      } else if (req.guestId) {
        stats = db.prepare(`
          SELECT COUNT(*) as total_sessions,
                 AVG(score) as avg_score,
                 MAX(score) as best_score
          FROM sessions
          WHERE guest_id = ? AND exam_id = ? AND status = 'completed'
        `).get(req.guestId, exam.id);
      } else {
        stats = { total_sessions: 0, avg_score: null, best_score: null };
      }

      return {
        ...exam,
        question_count,
        user_stats: {
          total_sessions: stats.total_sessions || 0,
          avg_score: stats.avg_score ? Math.round(stats.avg_score * 10) / 10 : null,
          best_score: stats.best_score || null,
        },
      };
    });

    res.json({ exams: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/exams/:examId
router.get('/:examId', optionalAuth, (req, res, next) => {
  try {
    const db = getDb();
    const examId = req.params.examId;

    const exam = db.prepare('SELECT * FROM exams WHERE id = ? OR slug = ?').get(examId, examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const objectives = db.prepare(
      'SELECT * FROM objectives WHERE exam_id = ? ORDER BY sort_order, code'
    ).all(exam.id);

    // Compute objective accuracy for the current user or guest
    const objectiveAccuracy = {};
    for (const obj of objectives) {
      let stats;
      if (req.user) {
        stats = db.prepare(`
          SELECT
            COUNT(a.id) as total,
            SUM(a.is_correct) as correct
          FROM answers a
          JOIN questions q ON a.question_id = q.id
          JOIN sessions s ON a.session_id = s.id
          WHERE s.user_id = ?
            AND q.exam_id = ?
            AND q.objective_id = ?
            AND s.status = 'completed'
        `).get(req.user.id, exam.id, obj.id);
      } else if (req.guestId) {
        stats = db.prepare(`
          SELECT
            COUNT(a.id) as total,
            SUM(a.is_correct) as correct
          FROM answers a
          JOIN questions q ON a.question_id = q.id
          JOIN sessions s ON a.session_id = s.id
          WHERE s.guest_id = ?
            AND q.exam_id = ?
            AND q.objective_id = ?
            AND s.status = 'completed'
        `).get(req.guestId, exam.id, obj.id);
      } else {
        stats = { total: 0, correct: 0 };
      }

      objectiveAccuracy[obj.code] = {
        total: stats.total || 0,
        correct: stats.correct || 0,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null,
      };
    }

    let overallStats;
    if (req.user) {
      overallStats = db.prepare(`
        SELECT COUNT(*) as total_sessions, AVG(score) as avg_score, MAX(score) as best_score
        FROM sessions
        WHERE user_id = ? AND exam_id = ? AND status = 'completed'
      `).get(req.user.id, exam.id);
    } else if (req.guestId) {
      overallStats = db.prepare(`
        SELECT COUNT(*) as total_sessions, AVG(score) as avg_score, MAX(score) as best_score
        FROM sessions
        WHERE guest_id = ? AND exam_id = ? AND status = 'completed'
      `).get(req.guestId, exam.id);
    } else {
      overallStats = { total_sessions: 0, avg_score: null, best_score: null };
    }

    res.json({
      exam,
      objectives,
      user_stats: {
        total_sessions: overallStats.total_sessions || 0,
        avg_score: overallStats.avg_score ? Math.round(overallStats.avg_score * 10) / 10 : null,
        best_score: overallStats.best_score || null,
        objective_accuracy: objectiveAccuracy,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
