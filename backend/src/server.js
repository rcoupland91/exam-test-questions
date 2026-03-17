import express from 'express';
import cors from 'cors';
import { runMigrations } from './db/migrations.js';
import { runSeeder } from './db/seeder.js';
import authRoutes from './routes/auth.routes.js';
import examRoutes from './routes/exams.routes.js';
import sessionRoutes from './routes/sessions.routes.js';
import progressRoutes from './routes/progress.routes.js';
import adminRouter from './routes/admin.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/admin', adminRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Initialize DB and start server
async function start() {
  try {
    runMigrations();
    console.log('Database migrations complete.');
    await runSeeder();
    console.log('Database seeding complete.');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
