import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { getDb } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function generateToken(user, rememberMe = false) {
  const expiresIn = rememberMe ? '24h' : '2h';
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'changeme',
    { expiresIn }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email and password are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const db = getDb();

    const regSetting = db.prepare("SELECT value FROM settings WHERE key = 'registrations_enabled'").get();
    if (regSetting && regSetting.value === '0') {
      return res.status(403).json({ error: 'New registrations are currently disabled' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existing) {
      return res.status(409).json({ error: 'Email or username already in use' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    ).run(username, email, password_hash);

    const newUserId = result.lastInsertRowid;

    // Check if this is the first user — if so, make them admin
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    let role = 'user';
    if (userCount.count === 1) {
      db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(newUserId);
      role = 'admin';
    }

    const user = {
      id: newUserId,
      username,
      email,
      role,
    };

    const token = generateToken(user);

    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, remember_me = false } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const db = getDb();
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!row) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check account is active
    if (row.is_active === 0) {
      return res.status(403).json({ error: 'Account disabled' });
    }

    // If TOTP is enabled, issue a short-lived temp token (embed remember_me for the next step)
    if (row.totp_enabled === 1) {
      const tempToken = jwt.sign(
        { userId: row.id, purpose: 'totp', remember_me },
        process.env.JWT_SECRET || 'changeme',
        { expiresIn: '5m' }
      );
      return res.json({ requires_2fa: true, temp_token: tempToken });
    }

    const user = { id: row.id, username: row.username, email: row.email, role: row.role };
    const token = generateToken(user, remember_me);

    res.json({ user, token, remember_me });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// PATCH /api/auth/profile
router.patch('/profile', requireAuth, async (req, res, next) => {
  try {
    const { username, avatar_color } = req.body;
    const db = getDb();
    const updates = [];
    const params = [];

    if (username !== undefined) {
      if (!username || username.trim().length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters' });
      }
      const taken = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(username.trim(), req.user.id);
      if (taken) return res.status(409).json({ error: 'Username already taken' });
      updates.push('username = ?');
      params.push(username.trim());
    }

    if (avatar_color !== undefined) {
      if (!/^#[0-9a-fA-F]{6}$/.test(avatar_color)) {
        return res.status(400).json({ error: 'Invalid color format' });
      }
      updates.push('avatar_color = ?');
      params.push(avatar_color);
    }

    if (updates.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    params.push(req.user.id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    const updated = db.prepare('SELECT id, username, email, role, totp_enabled, avatar_color FROM users WHERE id = ?').get(req.user.id);
    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/2fa/setup
router.post('/2fa/setup', requireAuth, async (req, res, next) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT totp_enabled FROM users WHERE id = ?').get(req.user.id);

    if (row && row.totp_enabled === 1) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }

    const secret = speakeasy.generateSecret({
      name: `ExamForge (${req.user.email})`,
      length: 20,
    });

    db.prepare('UPDATE users SET totp_secret = ? WHERE id = ?').run(secret.base32, req.user.id);

    const qr_code = await qrcode.toDataURL(secret.otpauth_url);

    res.json({ qr_code, secret: secret.base32 });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/2fa/verify
router.post('/2fa/verify', requireAuth, (req, res, next) => {
  try {
    const { token } = req.body;
    const db = getDb();
    const row = db.prepare('SELECT totp_secret FROM users WHERE id = ?').get(req.user.id);

    if (!row || !row.totp_secret) {
      return res.status(400).json({ error: '2FA setup not started' });
    }

    const valid = speakeasy.totp.verify({
      secret: row.totp_secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!valid) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    db.prepare('UPDATE users SET totp_enabled = 1 WHERE id = ?').run(req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/auth/2fa
router.delete('/2fa', requireAuth, (req, res, next) => {
  try {
    const db = getDb();
    db.prepare('UPDATE users SET totp_enabled = 0, totp_secret = NULL WHERE id = ?').run(req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/2fa/validate — uses temp_token, no auth middleware
router.post('/2fa/validate', async (req, res, next) => {
  try {
    const { temp_token, token } = req.body;

    if (!temp_token || !token) {
      return res.status(400).json({ error: 'temp_token and token are required' });
    }

    let payload;
    try {
      payload = jwt.verify(temp_token, process.env.JWT_SECRET || 'changeme');
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired temp token' });
    }

    if (payload.purpose !== 'totp') {
      return res.status(401).json({ error: 'Invalid token purpose' });
    }

    const db = getDb();
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId);

    if (!row) {
      return res.status(401).json({ error: 'User not found' });
    }

    const valid = speakeasy.totp.verify({
      secret: row.totp_secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!valid) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    const user = { id: row.id, username: row.username, email: row.email, role: row.role };
    const rememberMe = payload.remember_me || false;
    const fullToken = generateToken(user, rememberMe);

    res.json({ token: fullToken, user, remember_me: rememberMe });
  } catch (err) {
    next(err);
  }
});

export default router;
