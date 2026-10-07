# Frontend/backend integration

## Inspection and existing behavior

The backend has **59 REST API endpoints plus GET /**, 11 Prisma models and one route file per endpoint. JWTs come from login; all remaining /api routes require Bearer authorization. Private records are scoped through Prescription.userId. Catalog mutations require server-side CATALOG_EDITOR_IDS membership. OCR and translation are intentionally placeholders; there is no binary-upload API.

The frontend is Next.js 16.4 App Router with React 19, JavaScript pages, local component state and a shared green workspace design. Before this change it used a fetch helper, localStorage user IDs and x-user-id headers. Login did not save the JWT and signup treated registration as an authenticated session. Thus existing protected API calls could not authenticate with the current backend.

Existing partial connections included signup/login; prescription list/detail/create; OCR reads and supplied-text save; analysis/report generation; interaction checks; alert list/read/delete; profile name update/delete; doctor summaries, reads and recommendation creation; graph reads; languages/translation. Several detail screens were raw JSON. An unused upload component displayed a fake success message, and prescription creation sent a rejected empty fileUrl.

## Changes

- Centralized Axios transport in lib/api.js, JSON/query/parameter support, 45-second timeout, consistent error messages and cancellation.
- JWT persisted in sessionStorage for the current tab. Request interceptor attaches Bearer tokens; protected 401 responses clear the matching session and redirect to login. Login errors stay on the form. Logout and protected workspace guard added. No new backend authentication system.
- Signup returns to login with a success notice; profile supports name/email/password updates and account deletion.
- Catalog list, search (medicines), detail, create, edit and delete controls for medicines, foods and both interaction types.
- Live prescription and medicine selectors replace manual-ID entry where appropriate.
- Prescription deletion, linked-medicine add/edit/remove, OCR create/update, explicit analysis with optional food selections, all-report listing.
- Alert create/detail/filter/read/delete and recommendation create/list/update.
- Human-readable medicine, prescription, analysis and graph detail views; doctor navigation and consistent loading/empty/error states.
- Original layout, sidebar, colors, cards and route aliases retained. Shared form and catalog components extend that design.
- No automatic mutation on analysis page mount. No fake file-upload or translation success. No fabricated prescription status.
- Separate medicine/food graph maps prevent ID-collision naming errors.

## Backend changes

- Added cors with an explicit FRONTEND_ORIGINS allowlist, Authorization/Content-Type headers and preflight handling before authentication.
- GET /api/users/me adds `permissions.catalogEditor` alongside the unchanged `user` object. Permissions are computed by the same helper used for server-side enforcement; the frontend never receives the allowlist.
- Existing route registration tests now accept multiline formatting in server.js.
- No Prisma schema changes, database resets, new business endpoints or weakening of JWT/ownership checks.

## Environment and running

Backend, in `backend/.env`:

```dotenv
DATABASE_URL=<existing PostgreSQL URL>
JWT_SECRET=<existing private random secret>
JWT_EXPIRES_IN=1d
PORT=5000
FRONTEND_ORIGINS=http://localhost:3000
CATALOG_EDITOR_IDS=<comma-separated trusted user IDs>
```

Leave the editor list empty to deny catalog mutations. A catalog editor cannot access another user's private prescription records. Doctor-role/patient-assignment authorization is not present in the existing schema; doctor screens show the current user's records.

Frontend, in `frontend/.env.local` (already created locally; template in .env.example):

```dotenv
MEDISAFE_API_URL=http://localhost:5000
NEXT_PUBLIC_API_URL=
```

MEDISAFE_API_URL is the server-only upstream origin (no /api suffix). The existing Next.js proxy forwards /api/* and /api-health (to backend GET /). Keeping NEXT_PUBLIC_API_URL empty is recommended for same-origin browser requests. For a separate public API origin, set NEXT_PUBLIC_API_URL to that origin (no /api suffix), rebuild the frontend, and add the exact frontend origin to backend FRONTEND_ORIGINS. Health still uses the proxy.

Do not put DATABASE_URL or JWT_SECRET in frontend files or NEXT_PUBLIC_* variables. Use HTTPS in deployment. Browser Bearer tokens remain readable by JavaScript; sessionStorage is not an HttpOnly cookie. The existing API has no refresh-token endpoint; expiry requires another login.

Restart both existing development processes after installing packages:

```powershell
# Terminal 1
cd backend
npm install
npm run dev

# Terminal 2 (from repository root)
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. Register, log in, then add a prescription. New accounts have read-only shared-catalog access until their real user ID is added to CATALOG_EDITOR_IDS and the backend restarted.

## Endpoint inventory and UI coverage

Body fields below are allowed fields, not all required. Required/nullable fields follow the backend validation and schema. Forms mark required fields. IDs are positive integers; optional nullable text fields are sent as null when cleared, never empty strings.

| Method | Endpoint | Input | Access | Frontend |
| --- | --- | --- | --- | --- |
| POST | `/api/auth/register` | JSON: name, email, password | Public | /signup, /login |
| POST | `/api/auth/login` | JSON: email, password | Public | /signup, /login |
| GET | `/api/users/me` | Path parameters only / no body | JWT, own records | /profile |
| PUT | `/api/users/me` | JSON: name, email, password | JWT, own records | /profile |
| DELETE | `/api/users/me` | Path parameters only / no body | JWT, own records | /profile |
| POST | `/api/prescriptions` | JSON: userId, fileName, fileUrl, ocrText | JWT, own records | /prescriptions, /prescriptions/upload, /prescriptions/[id] |
| GET | `/api/prescriptions` | Query: userId | JWT, own records | /prescriptions, /prescriptions/upload, /prescriptions/[id] |
| GET | `/api/prescriptions/:id` | Path parameters only / no body | JWT, own records | /prescriptions, /prescriptions/upload, /prescriptions/[id] |
| DELETE | `/api/prescriptions/:id` | Path parameters only / no body | JWT, own records | /prescriptions, /prescriptions/upload, /prescriptions/[id] |
| POST | `/api/ocr/process/:prescriptionId` | JSON: extractedText, confidence, language, status | JWT, own records | /prescriptions/[id]/ocr |
| PUT | `/api/ocr/:prescriptionId` | JSON: extractedText, confidence, language, status | JWT, own records | /prescriptions/[id]/ocr |
| GET | `/api/ocr/:prescriptionId` | Path parameters only / no body | JWT, own records | /prescriptions/[id]/ocr |
| POST | `/api/medicines` | JSON: name, genericName, brandName, rxCui, atcCode | JWT + catalog editor | /medicines, /medicines/[id] |
| GET | `/api/medicines` | Path parameters only / no body | JWT | /medicines, /medicines/[id] |
| GET | `/api/medicines/search` | Query: q | JWT | /medicines, /medicines/[id] |
| GET | `/api/medicines/:id` | Path parameters only / no body | JWT | /medicines, /medicines/[id] |
| PUT | `/api/medicines/:id` | JSON: name, genericName, brandName, rxCui, atcCode | JWT + catalog editor | /medicines, /medicines/[id] |
| DELETE | `/api/medicines/:id` | Path parameters only / no body | JWT + catalog editor | /medicines, /medicines/[id] |
| GET | `/api/prescriptions/:id/medicines` | Path parameters only / no body | JWT, own records | /prescriptions/[id]/medicines |
| POST | `/api/prescriptions/:id/medicines` | JSON: medicineId, dosage, frequency, duration | JWT, own records | /prescriptions/[id]/medicines |
| PUT | `/api/prescriptions/:id/medicines/:medicineId` | JSON: dosage, frequency, duration | JWT, own records | /prescriptions/[id]/medicines |
| DELETE | `/api/prescriptions/:id/medicines/:medicineId` | Path parameters only / no body | JWT, own records | /prescriptions/[id]/medicines |
| POST | `/api/drug-interactions` | JSON: medicineAId, medicineBId, severity, description, recommendation | JWT + catalog editor | /interactions/catalog, /interactions/drug-drug |
| GET | `/api/drug-interactions` | Path parameters only / no body | JWT | /interactions/catalog, /interactions/drug-drug |
| GET | `/api/drug-interactions/:id` | Path parameters only / no body | JWT | /interactions/catalog, /interactions/drug-drug |
| PUT | `/api/drug-interactions/:id` | JSON: medicineAId, medicineBId, severity, description, recommendation | JWT + catalog editor | /interactions/catalog, /interactions/drug-drug |
| DELETE | `/api/drug-interactions/:id` | Path parameters only / no body | JWT + catalog editor | /interactions/catalog, /interactions/drug-drug |
| POST | `/api/drug-interactions/check` | JSON: medicineAId, medicineBId | JWT | /interactions/catalog, /interactions/drug-drug |
| POST | `/api/foods` | JSON: name | JWT + catalog editor | /foods |
| GET | `/api/foods` | Path parameters only / no body | JWT | /foods |
| GET | `/api/foods/:id` | Path parameters only / no body | JWT | /foods |
| PUT | `/api/foods/:id` | JSON: name | JWT + catalog editor | /foods |
| DELETE | `/api/foods/:id` | Path parameters only / no body | JWT + catalog editor | /foods |
| POST | `/api/food-interactions` | JSON: medicineId, foodId, severity, description, recommendation | JWT + catalog editor | /interactions/catalog, /interactions/drug-food |
| GET | `/api/food-interactions` | Path parameters only / no body | JWT | /interactions/catalog, /interactions/drug-food |
| GET | `/api/food-interactions/:id` | Path parameters only / no body | JWT | /interactions/catalog, /interactions/drug-food |
| PUT | `/api/food-interactions/:id` | JSON: medicineId, foodId, severity, description, recommendation | JWT + catalog editor | /interactions/catalog, /interactions/drug-food |
| DELETE | `/api/food-interactions/:id` | Path parameters only / no body | JWT + catalog editor | /interactions/catalog, /interactions/drug-food |
| POST | `/api/food-interactions/check` | JSON: medicineId, foodId | JWT | /interactions/catalog, /interactions/drug-food |
| POST | `/api/alerts` | JSON: prescriptionId, type, severity, title, message, language, isRead | JWT, own records | /alerts |
| GET | `/api/alerts` | Query: prescriptionId | JWT, own records | /alerts |
| GET | `/api/alerts/:id` | Path parameters only / no body | JWT, own records | /alerts |
| PATCH | `/api/alerts/:id/read` | Path parameters only / no body | JWT, own records | /alerts |
| DELETE | `/api/alerts/:id` | Path parameters only / no body | JWT, own records | /alerts |
| POST | `/api/safety-reports/generate/:prescriptionId` | Path parameters only / no body | JWT, own records | /reports, /prescriptions/[id]/report |
| GET | `/api/safety-reports/:prescriptionId` | Path parameters only / no body | JWT, own records | /reports, /prescriptions/[id]/report |
| GET | `/api/safety-reports` | Query: prescriptionId | JWT, own records | /reports, /prescriptions/[id]/report |
| GET | `/api/doctor/dashboard` | Path parameters only / no body | JWT, own records | /doctor and its prescriptions, alerts, recommendations pages |
| GET | `/api/doctor/prescriptions` | Query: userId | JWT, own records | /doctor and its prescriptions, alerts, recommendations pages |
| GET | `/api/doctor/prescriptions/:id` | Path parameters only / no body | JWT, own records | /doctor and its prescriptions, alerts, recommendations pages |
| GET | `/api/doctor/alerts` | Query: prescriptionId | JWT, own records | /doctor and its prescriptions, alerts, recommendations pages |
| POST | `/api/doctor/recommendations` | JSON: prescriptionId, medicineId, alternative, reason, status | JWT, own records | /doctor and its prescriptions, alerts, recommendations pages |
| GET | `/api/doctor/recommendations/:prescriptionId` | Path parameters only / no body | JWT, own records | /doctor and its prescriptions, alerts, recommendations pages |
| PUT | `/api/doctor/recommendations/:id` | JSON: alternative, reason, status | JWT, own records | /doctor and its prescriptions, alerts, recommendations pages |
| GET | `/api/languages` | Path parameters only / no body | JWT | /languages |
| POST | `/api/translate` | JSON: text, language | JWT | /languages |
| GET | `/api/knowledge-graph` | Path parameters only / no body | JWT | /knowledge-graph, /knowledge-graph/medicine/[id] |
| GET | `/api/knowledge-graph/medicine/:id` | Path parameters only / no body | JWT | /knowledge-graph, /knowledge-graph/medicine/[id] |
| POST | `/api/analyze/:prescriptionId` | JSON: optional foodIds array | JWT, own records | /prescriptions/[id]/analysis |
| GET | `/` | Path parameters only / no body | Public | /dashboard service status |

Responses remain compatible: named resources (`user`, `prescription`, `medicine`, `food`, `ocrResult`, `interaction`, `alert`, `report`, `recommendation`) and plural lists. Login adds token. Checks return found + interaction. Analysis returns prescriptionId, drugInteractions, foodInteractions, alerts and report. Languages returns an array. Graph returns medicines/foods/relationship collections. Errors use message. Axios preserves HTTP status for 401/403/404 behavior.

## Files

Transport/services: lib/api.js, lib/services.js, lib/catalog.js.
Shared UI: components/Workspace.js, ApiPanel.js, RecordForm.js, CatalogManager.js, PrescriptionDetails.js, PrescriptionMedicines.js, OcrEditor.js, Analysis.js, UploadPrescription.js, InteractionCheck.js, PrescriptionCard.js.
Pages: auth, dashboard, profile, prescriptions and nested detail tabs, medicines, foods, interaction catalog, alerts, reports, doctor navigation/recommendations, languages and knowledge graph.
Configuration: next.config.ts, .env.example, local .env.local, .gitignore, eslint.config.mjs, package.json and lockfile. Next.js also updated tsconfig.json for the isolated test output and regenerated its agent-feedback instructions in AGENTS.md.
Backend: server.js, middleware/catalogAccess.js, routes/users/getMe.js, .env.example, package.json/lockfile and route-registration test patterns.
Tests: playwright.config.js, tests/integration.spec.js. Backend existing unit/integration suites retained.

## Verification commands

Verified on 2026-10-07: frontend lint and TypeScript passed, production build completed, all 12 backend unit tests passed, all 60 backend endpoints passed the PostgreSQL integration suite, and the Edge browser integration workflow passed against the real API. Temporary records were cleaned up. The Prisma schema is unchanged.

```powershell
cd backend
npm test
npm run test:integration

cd ../frontend
npm run lint
npx tsc --noEmit
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser integration test uses the actual PostgreSQL-backed Express app on port 5100 and an isolated Next.js dev server on 3100 (.next-e2e output), so it does not replace your running dev servers. It exercises registration/login, Axios authorization, CORS, editor controls, catalog CRUD, supplied OCR text, linked medicines, analysis, reports, alerts, recommendation updates, graphs, translation preview, profile updates and rejected-token redirect. It creates uniquely named synthetic records and deletes only its own users/catalog records afterward. Use a development database. On Windows with Edge installed, `$env:E2E_BROWSER_CHANNEL='msedge'; npm run test:e2e` avoids downloading Chromium.

Limits inherited from the backend: no binary upload, automatic OCR, real translation, AI analysis, token refresh, or doctor/patient role assignment. These are represented honestly in the UI. Existing dependency audit findings need a separate compatible dependency upgrade; no forced major upgrades were applied.
