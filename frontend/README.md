# MediSafe frontend

Next.js App Router UI connected to the existing Express/Prisma API through Axios. The existing workspace design is preserved, with authenticated CRUD screens for the backend's available features.

See [INTEGRATION.md](./INTEGRATION.md) for the full 60-endpoint inventory, before/after audit, changed files, permissions, environment options and verification details.

## Run

Start the backend from its directory:

```powershell
cd backend
npm install
npm run dev
```

In a second terminal from the repository root:

```powershell
cd frontend
npm install
# On a fresh checkout:
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000. Register, then log in. The JWT is stored for the current browser tab and attached by the shared Axios client. Expired/rejected sessions return to login.

## Environment

`MEDISAFE_API_URL=http://localhost:5000` configures the server-side proxy. Leave `NEXT_PUBLIC_API_URL=` empty for same-origin browser requests. Only public origins belong in frontend configuration; keep database credentials and JWT signing secrets in the backend.

Shared catalog editing requires your backend user ID in `CATALOG_EDITOR_IDS`. Accounts without that permission can browse and check interactions. Private records always remain scoped to their owner.

## Verify

```powershell
npm run lint
npx tsc --noEmit
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser test starts isolated servers on ports 3100/5100 and uses the configured development PostgreSQL database. It removes only its own synthetic test records. Existing app processes on 3000/5000 are left running.

On Windows with Edge installed, use `$env:E2E_BROWSER_CHANNEL='msedge'` before `npm run test:e2e`.

The backend still provides supplied-text OCR storage and an unchanged-text translation placeholder. There is no file-storage, automatic OCR, AI or real translation service to connect.
