import { getDb } from './connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXAMS_DIR = path.join(__dirname, '../data/exams');

export async function runSeeder() {
  const db = getDb();

  if (!fs.existsSync(EXAMS_DIR)) {
    console.log('No exams directory found, skipping seeder.');
    return;
  }

  const files = fs.readdirSync(EXAMS_DIR).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(EXAMS_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    seedExam(db, data);
    console.log(`Seeded exam: ${data.slug}`);
  }
}

function seedExam(db, data) {
  // Upsert exam
  const upsertExam = db.prepare(`
    INSERT INTO exams (slug, title, description, vendor, version, passing_score)
    VALUES (@slug, @title, @description, @vendor, @version, @passing_score)
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      vendor = excluded.vendor,
      version = excluded.version,
      passing_score = excluded.passing_score
  `);

  upsertExam.run({
    slug: data.slug,
    title: data.title,
    description: data.description || null,
    vendor: data.vendor || null,
    version: data.version || null,
    passing_score: data.passing_score || 70,
  });

  const exam = db.prepare('SELECT id FROM exams WHERE slug = ?').get(data.slug);

  // Upsert objectives
  const upsertObjective = db.prepare(`
    INSERT INTO objectives (exam_id, code, title, description, sort_order)
    VALUES (@exam_id, @code, @title, @description, @sort_order)
    ON CONFLICT(exam_id, code) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      sort_order = excluded.sort_order
  `);

  for (const obj of (data.objectives || [])) {
    upsertObjective.run({
      exam_id: exam.id,
      code: obj.code,
      title: obj.title,
      description: obj.description || null,
      sort_order: obj.sort_order || 0,
    });
  }

  // Build objective code -> id map
  const objRows = db.prepare('SELECT id, code FROM objectives WHERE exam_id = ?').all(exam.id);
  const objMap = {};
  for (const row of objRows) {
    objMap[row.code] = row.id;
  }

  // Upsert questions
  const upsertQuestion = db.prepare(`
    INSERT INTO questions (exam_id, objective_id, external_id, body, choices, correct_key, explanation, difficulty, tags)
    VALUES (@exam_id, @objective_id, @external_id, @body, @choices, @correct_key, @explanation, @difficulty, @tags)
    ON CONFLICT(external_id) DO UPDATE SET
      exam_id = excluded.exam_id,
      objective_id = excluded.objective_id,
      body = excluded.body,
      choices = excluded.choices,
      correct_key = excluded.correct_key,
      explanation = excluded.explanation,
      difficulty = excluded.difficulty,
      tags = excluded.tags
  `);

  const seedQuestions = db.transaction((questions) => {
    for (const q of questions) {
      upsertQuestion.run({
        exam_id: exam.id,
        objective_id: objMap[q.objective_code] || null,
        external_id: q.external_id,
        body: q.body,
        choices: JSON.stringify(q.choices),
        correct_key: q.correct_key,
        explanation: q.explanation,
        difficulty: q.difficulty || 'medium',
        tags: JSON.stringify(q.tags || []),
      });
    }
  });

  seedQuestions(data.questions || []);
}
