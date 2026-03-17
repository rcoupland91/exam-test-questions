# ExamForge

Interactive exam study platform for certification practice. Currently includes **HashiCorp Terraform Associate (004)** with 65 questions across all 8 exam objectives.

Features: user accounts, progress tracking, score history, weak area identification, guest mode, dark/light mode, PWA support.

---

## Quick Start (pre-built images)

No git clone required — images are pulled from GitHub Container Registry.

**1. Download the environment template**
```bash
curl -O https://raw.githubusercontent.com/rcoupland91/exam-test-questions/main/.env.example
cp .env.example .env
```

**2. Edit `.env`** — set `JWT_SECRET`:
```env
JWT_SECRET=your_super_secret_key_at_least_32_chars
```

**3. Download the compose file and start**
```bash
curl -O https://raw.githubusercontent.com/rcoupland91/exam-test-questions/main/docker-compose.yml
docker compose up -d
```

Access the app at **http://localhost:5173**

**Update to latest version:**
```bash
docker compose pull && docker compose up -d
```

**Pin to a specific release** (recommended for stability) — add to `.env`:
```env
EXAMFORGE_BACKEND_IMAGE=ghcr.io/rcoupland91/examforge-backend:v1.2.0
EXAMFORGE_FRONTEND_IMAGE=ghcr.io/rcoupland91/examforge-frontend:v1.2.0
```

---

## Development (build from source)

**Clone and start:**
```bash
git clone https://github.com/YOUR_USERNAME/exam-test-questions.git
cd exam-test-questions
cp .env.example .env  # set JWT_SECRET
docker compose -f docker-compose.build.yml up --build -d
```

**Rebuild after changes:**
```bash
docker compose -f docker-compose.build.yml up --build -d
```

---

## Local Development (no Docker)

**Backend:**
```bash
cd backend
npm install
JWT_SECRET=devsecret node src/server.js
# API runs on http://localhost:3001
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173 — proxies /api to :3001
```

---

## Releases & Versioning

Releases are automated via GitHub Actions:

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | Push to `main`/`dev`, PRs | Builds both Docker images, validates JSON, confirms backend starts |
| `auto-tag.yml` | Push to `main` | Auto-bumps version from commit messages, creates git tag |
| `release.yml` | New `v*` tag | Builds and pushes both images to GHCR, creates GitHub Release with deploy instructions |

**Commit message convention for auto-versioning:**
```
feat: add new exam          → minor bump (v1.0.0 → v1.1.0)
fix: correct question typo  → patch bump (v1.0.0 → v1.0.1)
feat!: breaking change      → major bump (v1.0.0 → v2.0.0)
```

**Manual version bump** — use the `auto-tag` workflow dispatch in GitHub Actions and select major/minor/patch.

**Required GitHub secret:** `PAT_TOKEN` — a personal access token with `contents: write` scope, needed by `auto-tag.yml` to push tags.

---

## Adding New Exams

1. Create a JSON file in `backend/src/data/exams/<slug>.json` following the schema in `terraform-associate-004.json`
2. Restart the backend — the seeder auto-imports it
3. The exam appears on the Exams page immediately

---

## Project Structure

```
exam-test-questions/
├── docker-compose.yml          # End users — pulls from GHCR
├── docker-compose.build.yml    # Developers — builds from source
├── .env.example
├── .github/workflows/
│   ├── ci.yml                  # Build validation on every push/PR
│   ├── auto-tag.yml            # Auto version bump on merge to main
│   └── release.yml             # Build, push images, create release
├── backend/
│   ├── src/
│   │   ├── db/                 # SQLite connection, migrations, seeder
│   │   ├── middleware/         # Auth (JWT + optional guest), error handling
│   │   ├── routes/             # API route handlers
│   │   └── data/exams/         # Exam question JSON files
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── api/                # Axios API clients
    │   ├── components/         # UI components (session, dashboard, layout)
    │   ├── context/            # AuthContext, ThemeContext
    │   └── pages/              # Route-level pages
    ├── public/
    │   └── terraform-badge.svg # HashiCorp badge used as exam icon + PWA logo
    ├── nginx.conf
    └── Dockerfile
```

---

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | — | Create account |
| POST | /api/auth/login | — | Login |
| GET | /api/auth/me | JWT | Current user |
| GET | /api/exams | Optional | List all exams |
| GET | /api/exams/:id | Optional | Exam detail + objectives |
| POST | /api/sessions | Optional | Start a session |
| GET | /api/sessions/:id/question | Optional | Get next question |
| POST | /api/sessions/:id/answers | Optional | Submit answer |
| GET | /api/sessions/:id/summary | Optional | Session results |
| GET | /api/sessions | Optional | Session history |
| GET | /api/progress | JWT | Overall progress dashboard |
| GET | /api/health | — | Health check |

"Optional" auth means the endpoint works for both authenticated users and guests (via `X-Guest-ID` header).
