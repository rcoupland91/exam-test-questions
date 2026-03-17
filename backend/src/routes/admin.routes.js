import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Middleware: require admin role
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// GET /api/admin/users
router.get('/users', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const db = getDb();
    const users = db.prepare(`
      SELECT id, username, email, role, is_active, totp_enabled, created_at,
             (SELECT COUNT(*) FROM sessions WHERE user_id = users.id) as session_count
      FROM users ORDER BY created_at ASC
    `).all();
    res.json({ users });
  } catch (err) { next(err); }
});

// PATCH /api/admin/users/:id
router.patch('/users/:id', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const db = getDb();
    const { role, is_active } = req.body;
    const userId = parseInt(req.params.id);

    // Prevent admin from demoting/disabling themselves
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot modify your own account from admin panel' });
    }

    const updates = [];
    const params = [];
    if (role !== undefined) { updates.push('role = ?'); params.push(role); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active ? 1 : 0); }
    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    params.push(userId);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const user = db.prepare('SELECT id, username, email, role, is_active, totp_enabled, created_at FROM users WHERE id = ?').get(userId);
    res.json({ user });
  } catch (err) { next(err); }
});

// GET /api/admin/settings
router.get('/settings', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
    res.json({ settings });
  } catch (err) { next(err); }
});

// PATCH /api/admin/settings
router.patch('/settings', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const db = getDb();
    const { key, value } = req.body;
    if (!key || value === undefined) return res.status(400).json({ error: 'key and value are required' });
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, String(value));
    res.json({ success: true });
  } catch (err) { next(err); }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', requireAuth, requireAdmin, (req, res, next) => {
  try {
    const db = getDb();
    const userId = parseInt(req.params.id);
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
