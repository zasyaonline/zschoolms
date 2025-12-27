# Copilot / AI Agent Instructions — ZSchoolMS

Purpose: help an AI coding agent be productive quickly in this monorepo (frontend + backend).

**📖 Complete Documentation:** See [ZSCHOOL_PROJECT_REFERENCE.md](../ZSCHOOL_PROJECT_REFERENCE.md) for comprehensive project reference.

- **Big picture:** This is a Node.js monorepo using npm workspaces: `frontend` (React + Vite) and `backend` (Node/Express + Sequelize/Postgres). See [README.md](../README.md).

- **Start quickly:**
  - Install all deps from repo root: `npm install` or `npm run install:all` ([package.json](../package.json)).
  - Run both dev servers: `npm run dev` (runs `dev:frontend` and `dev:backend` concurrently).
  - Frontend dev: http://localhost:5173 — run from `frontend` with `npm run dev`.
  - Backend dev: http://localhost:5001 — run from `backend` with `npm run dev`.

- **DB & migrations:** Backend uses Sequelize + PostgreSQL.
  - Copy `.env.example` -> `.env` and set DB vars (see [backend/README.md](../backend/README.md)).
  - Run migrations: `cd backend && source .env && PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_DATABASE -f migrations/XXX.sql`
  - 14 migrations total in `backend/migrations/`

- **Important endpoints / patterns:**
  - Swagger UI: `/api-docs` on the backend (Swagger generated from JSDoc-style comments).
  - API base: `/api` — routes live in `backend/src/routes` and controllers in `backend/src/controllers`.
  - Models: 18 Sequelize models in `backend/src/models`.

- **Project conventions & quirks to preserve:**
  - Root is a workspace; prefer running root-level scripts (`npm run dev`, `npm run build`) which forward to workspaces.
  - Backend uses ES modules (`"type": "module"`) — use `import`/`export` syntax.
  - Pinned Node for local development: **18.20.5 (LTS)** — use `nvm` and the provided `.nvmrc`.
  - Tests are minimal / placeholder in backend; don't assume full test coverage. See `backend/package.json` test script.

- **Common maintenance CLI tasks (examples):**
  - Start both services: `npm run dev` (root)
  - Build both: `npm run build` (root)
  - Lint both: `npm run lint` (root)
  - Reset DB (dev): `cd backend && npm run db:reset`

- **Data population & helpers:** Many helper scripts exist under `backend/` (e.g. `backend/populate-test-data.js`, `backend/populate-enrollment-and-marks.js`) — use these to seed realistic test data rather than handcrafting fixtures.

- **Where to look for examples:**
  - Route + controller pattern: `backend/src/routes/*` -> `backend/src/controllers/*`.
  - DB access: `backend/src/models/*` and `backend/src/services/*` for business logic.
  - Frontend API clients: `frontend/src/services/*` (Axios wrappers).

- **When editing code:**
  - Run the local dev servers and hit Swagger to validate endpoints before changing contracts.
  - Preserve ES module style and Sequelize migration conventions.
  - Keep environment usage consistent with `.env.example`.

- **Troubleshooting tips:**
  - If backend fails to start, check `.env` DB credentials and run migrations.
  - For CORS or port issues, default frontend port is `5173`. The backend dev port was changed to `5001` to avoid macOS port conflicts — check `backend/.env`.

**Pinned versions & known-environment fixes**

- Node: Use **18.20.5 (LTS)** for local development (see `/Users/zasyaonline/Projects/zschoolms/.nvmrc`). Install via `nvm install 18 && nvm use 18`.
- NPM: `npm` v9/10 is acceptable; verify with `npm --version` after switching Node.
- Backend dev port: `5001` (changed to avoid macOS ControlCenter conflict). Check `backend/.env`.
- Nodemon: `backend/nodemon.json` excludes heavy paths and limits watchers — don't remove it; it prevents memory/MaxListeners issues.
- Vite dev server: known macOS issue where the process enters a suspended state (TN) and will accept TCP connections but not respond.
  - Observed on macOS (arm64) — production build always works.
  - Recommended workflows:
    - For fast verification use the production build + simple HTTP server:
      ```bash
      cd frontend
      npm run build
      cd dist
      python3 -m http.server 5173
      ```
    - If you need HMR/dev server, run `npm run dev` in a dedicated foreground terminal (do NOT background with `&`) or run inside Docker to avoid macOS-specific suspension.

**Files to check when env/dev problems occur**

- `backend/nodemon.json` — watch/exclude rules (prevents watcher overload and restart loops).
- `frontend/vite.config.js` — host, watch and HMR config; exclusions for `node_modules`/`dist` exist here.
- `backend/.env` — dev port now `5001`.
- `.nvmrc` — contains `18.20.5`.

**When you fix an environment issue**

- Update this file with a one-line summary (date + fix) so future agents know the root cause and solution.
- If you change `package.json` engines, note the change and which environments (dev/CI/prod) were updated.

- If anything here is unclear or you'd like more detail (examples of common PR changes, test patterns, or a short list of important files to review for specific tasks), tell me which area to expand. I'll iterate on this file.

**Onboarding Checklist (Fresh Machine)**

1. Install `nvm` and use Node 18.20.5 (recommended):

```bash
# Install nvm (if missing)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
# Restart shell, then:
nvm install 18.20.5
nvm use 18.20.5
nvm alias default 18.20.5
node --version  # should show v18.20.5
npm --version
```

2. Clean and install dependencies (from repo root):

```bash
cd /Users/zasyaonline/Projects/zschoolms
npm run clean
npm install
```

3. Start dev servers (both in separate terminals or use root script):

```bash
# Option A: both together (root)
npm run dev

# Option B: separate terminals
npm run dev:backend  # runs backend (nodemon) on port 5001
npm run dev:frontend # runs Vite dev server on 5173 (see Vite caveat below)
```

4. If Vite dev server is unreliable on macOS, use the production-build workaround:

```bash
cd frontend
npm run build
cd dist
python3 -m http.server 5173
# open http://localhost:5173
```

5. Verify backend Swagger UI: `http://localhost:5001/api-docs`

6. If DB is required, copy `.env.example` -> `.env` and run migrations/seeds:

```bash
cd backend
cp .env.example .env
# edit .env with DB credentials
npm run db:migrate
npm run db:seed
```

7. Common troubleshooting commands:

```bash
# Check node processes and ports
ps aux | grep node | grep -v grep
lsof -i :5001
killall -9 node
```

---

Once you confirm this works on your machine, tell me and I can add a shortened developer Quick Start into the README or create a CI job template.

**SDLC & Quality Gates (Mandatory)**

- **Mobile-first & Responsive**: All UI work must be mobile-friendly. Follow the existing responsive breakpoints in `frontend/src/styles` (use fluid layouts, CSS variables, and mobile-first media queries). Verify on small (≤375px), medium (768px) and large (≥1024px) widths.

- **Automated Quality Gates** (CI): Every PR must run and pass these checks in GitHub Actions before merge:
  - `npm run lint` (frontend + backend)
  - `npm run build` (frontend) and `npm start` (backend smoke-start)
  - Unit & integration tests (Vitest/Node tests) — add `vitest` and `@testing-library/react` where missing
  - `npx sequelize-cli db:migrate:status` (or dry-run) to ensure migrations are up-to-date

- **Testing Matrix**:
  - Unit tests for UI logic (Vitest + React Testing Library)
  - Service/controller tests for backend (node + supertest when added)
  - E2E smoke tests (Playwright) for critical flows: login, marks entry, report generation

- **Accessibility (A11y)**: All new UI components require ARIA attributes and keyboard navigation. Run automated checks (axe-core) in CI for PRs touching `frontend/src`.

- **Performance & Bundle Size**: Keep main bundle gzipped < 200KB where possible. Use `vite build` and analyze output in `frontend/dist` during PR reviews for large regressions.

- **Database & Migrations**: Always add a migration for schema changes using `npx sequelize-cli migration:generate` and include a rollback. Run `npm run db:migrate` in CI prior to integration tests.

- **Secrets & Environment**: Never commit secrets. Frontend env keys must be prefixed with `VITE_`. Verify `VITE_API_BASE_URL` is set in review/staging environments.

- **PR Checklist (short)**:
  - Description + related docs updated (`API_IMPLEMENTATION_PLAN.md`, `BUSINESS_LOGIC_IMPLEMENTATION_PLAN.md`)
  - Lint and tests pass locally
  - New migrations + seeds included and tested
  - Accessibility checked (keyboard/aria/axe)
  - Mobile/responsive check completed on 3 breakpoints

- **Issue Tracking & Root Cause Notes**: When fixing environment or runtime issues, add a one-line summary to this file with date + short fix (so future agents can avoid repeats). See `NODE_VERSION_FIX.md` and `FRONTEND_ISSUE_ROOT_CAUSE_ANALYSIS.md` as examples.

---

## Deferred Features (NOT IMPLEMENTED)

The following features are intentionally deferred for future implementation phases:

### Sponsor Portal - Academic Features
**Status:** Deferred (as of current phase)  
**Location:** `frontend/src/pages/SponsorFlow/`  

- **Academic Progress Charts**: Performance trend charts for sponsored students
- **Report Card Viewing**: Direct PDF viewing/download of report cards from sponsor dashboard
- **Attendance Summary**: Visual attendance statistics for each sponsored student

**Why deferred:** Priority was given to establishing the core sponsor portal (dashboard + student list). Academic visualization features will be implemented in a future phase.

**Current Implementation:**
- ✅ Sponsor Dashboard with stats cards (total students, active/expired/terminated)
- ✅ Student cards with basic info (name, class, sponsorship dates, status)
- ✅ Backend APIs: `GET /api/sponsors/me/students`, `GET /api/sponsors/me/dashboard`
- ✅ Sidebar navigation for sponsors

**Backend endpoints ready for future UI:**
- `GET /api/attendance/student/:studentId/summary` - Attendance data exists
- `GET /api/report-cards/student/:studentId` - Report card endpoints exist
- `GET /api/marks/student/:studentId/history` - Marks history endpoints exist
