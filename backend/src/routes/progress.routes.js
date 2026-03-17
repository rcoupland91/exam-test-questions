import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/progress
router.get('/', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    const userId = req.user.id;

    // Overall stats
    const overall = db.prepare(`
      SELECT
        COUNT(*) as total_sessions,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sessions,
        AVG(CASE WHEN status = 'completed' THEN score END) as avg_score,
        MAX(CASE WHEN status = 'completed' THEN score END) as best_score
      FROM sessions
      WHERE user_id = ?
    `).get(userId);

    // Recent session scores for chart (last 10 completed)
    const recentSessions = db.prepare(`
      SELECT s.id, s.score, s.started_at, s.completed_at, e.title as exam_title, e.slug as exam_slug, e.passing_score
      FROM sessions s
      JOIN exams e ON s.exam_id = e.id
      WHERE s.user_id = ? AND s.status = 'completed'
      ORDER BY s.completed_at DESC
      LIMIT 10
    `).all(userId);

    // By exam
    const exams = db.prepare('SELECT id, slug, title, passing_score FROM exams').all();
    const by_exam = exams.map(exam => {
      const stats = db.prepare(`
        SELECT COUNT(*) as total_sessions, AVG(score) as avg_score, MAX(score) as best_score
        FROM sessions
        WHERE user_id = ? AND exam_id = ? AND status = 'completed'
      `).get(userId, exam.id);

      return {
        exam_id: exam.id,
        exam_slug: exam.slug,
        exam_title: exam.title,
        passing_score: exam.passing_score,
        total_sessions: stats.total_sessions || 0,
        avg_score: stats.avg_score ? Math.round(stats.avg_score * 10) / 10 : null,
        best_score: stats.best_score,
      };
    });

    // Weak areas — objectives where accuracy < 70%
    const weakAreas = db.prepare(`
      SELECT
        o.code as objective_code,
        o.title as objective_title,
        e.title as exam_title,
        e.slug as exam_slug,
        COUNT(a.id) as total_answered,
        SUM(a.is_correct) as correct,
        ROUND(CAST(SUM(a.is_correct) AS REAL) / COUNT(a.id) * 100, 1) as accuracy
      FROM answers a
      JOIN questions q ON a.question_id = q.id
      JOIN objectives o ON q.objective_id = o.id
      JOIN exams e ON q.exam_id = e.id
      JOIN sessions s ON a.session_id = s.id
      WHERE s.user_id = ? AND s.status = 'completed'
      GROUP BY o.id
      HAVING total_answered >= 3 AND accuracy < 70
      ORDER BY accuracy ASC
      LIMIT 10
    `).all(userId);

    res.json({
      overall: {
        total_sessions: overall.total_sessions || 0,
        completed_sessions: overall.completed_sessions || 0,
        avg_score: overall.avg_score ? Math.round(overall.avg_score * 10) / 10 : null,
        best_score: overall.best_score,
      },
      recent_sessions: recentSessions.reverse(), // chronological order for chart
      by_exam,
      weak_areas: weakAreas,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
