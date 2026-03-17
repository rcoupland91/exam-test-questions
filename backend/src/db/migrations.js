import { getDb } from './connection.js';

function addColumnIfNotExists(db, table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = cols.some((c) => c.name === column);
  if (!exists) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export function runMigrations() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      vendor TEXT,
      version TEXT,
      passing_score INTEGER DEFAULT 70,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS objectives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      UNIQUE(exam_id, code)
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
      objective_id INTEGER REFERENCES objectives(id) ON DELETE SET NULL,
      external_id TEXT UNIQUE,
      body TEXT NOT NULL,
      choices TEXT NOT NULL,
      correct_key TEXT NOT NULL,
      explanation TEXT NOT NULL,
      difficulty TEXT DEFAULT 'medium',
      tags TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      guest_id TEXT,
      exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
      mode TEXT DEFAULT 'practice',
      status TEXT DEFAULT 'active',
      question_ids TEXT NOT NULL,
      total_questions INTEGER NOT NULL,
      score REAL,
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      CHECK (user_id IS NOT NULL OR guest_id IS NOT NULL)
    );

    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
      selected_key TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      answered_at TEXT DEFAULT (datetime('now')),
      UNIQUE(session_id, question_id)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_guest_id ON sessions(guest_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_exam_id ON sessions(exam_id);
    CREATE INDEX IF NOT EXISTS idx_answers_session_id ON answers(session_id);
    CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);
    CREATE INDEX IF NOT EXISTS idx_questions_objective_id ON questions(objective_id);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    INSERT OR IGNORE INTO settings (key, value) VALUES ('registrations_enabled', '1');
  `);

  // Add new columns to users table if they don't exist yet
  addColumnIfNotExists(db, 'users', 'role', "TEXT NOT NULL DEFAULT 'user'");
  addColumnIfNotExists(db, 'users', 'is_active', 'INTEGER NOT NULL DEFAULT 1');
  addColumnIfNotExists(db, 'users', 'totp_secret', 'TEXT');
  addColumnIfNotExists(db, 'users', 'totp_enabled', 'INTEGER NOT NULL DEFAULT 0');
  addColumnIfNotExists(db, 'users', 'avatar_color', "TEXT NOT NULL DEFAULT '#6366f1'");
}
