# MediSafe: connected full-stack application

Drug-drug and drug-food checks, private prescription image OCR, patient confirmation,
persisted alerts/reports, English/Hindi content, voice controls and consent-based doctor review.

The frontend uses the existing Next.js design; Express queries PostgreSQL through Prisma.
No React medicine/food arrays or fabricated interaction results are used.

See [audit](AUDIT.md), [verification report](VERIFICATION.md),
[API and screen inventory](frontend/INTEGRATION.md), and [backend details](backend/README.md).

## Fresh clone: PowerShell

Prerequisites: Node.js 24 LTS (tested with 24.14.1), npm, and a reachable PostgreSQL database.

Terminal 1, from the repository root:

```powershell
cd backend
npm ci
Copy-Item .env.example .env
node -e "const fs=require('fs');const p='.env';fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace('JWT_SECRET=','JWT_SECRET='+require('crypto').randomBytes(48).toString('hex')))"
```

Edit `backend/.env`: set `DATABASE_URL` to your PostgreSQL connection string.
The example contains no real credentials. Keep SSL/connection options required by your provider.
Do not copy the example over an existing configured environment.

Then:

```powershell
npx prisma validate
npx prisma migrate deploy
npx prisma generate
npm run catalog:seed
npm run ocr:setup
npm run dev
```

Terminal 2, from the repository root:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000, register and log in. Backend health is http://localhost:5000/.
Both interaction selectors use the real seeded catalogs. Seeding is idempotent and preserves
existing data; no reset or default patient/doctor password is supplied.

## Try the connected flow

- Drug-drug: Aspirin + Ibuprofen returns the stored HIGH caution.
- Drug-food: Simvastatin + Grapefruit juice returns the stored HIGH caution.
- Upload a clear PNG/JPEG/WebP image (maximum 5 MB). Review the original image and OCR text,
  correct it if necessary, select actual catalog medicines and confirm. Then run analysis.
- Switch English/Hindi using the top bar. The preference is saved in the account and browser.
- Listen uses a matching installed browser voice. If unavailable, the readable result remains.
- Register a separate clinician account. An administrator verifies the clinician, then runs:

```powershell
cd backend
npm run doctor:grant -- existing-doctor@example.com
```

The patient grants access by email on **Care team**. The clinician can then use **Doctor tools**.
Revoking access immediately removes permission to read that patient's records.
Catalog editing separately requires actual trusted user IDs in `CATALOG_EDITOR_IDS`.

## Optional free-text translation

Seeded explanations, alerts, guidance and important UI text have English/Hindi content without
an external service. Arbitrary text on the Languages page requires a LibreTranslate-compatible
service with English and Hindi models.

For a separately installed Python environment:

```powershell
python -m pip install libretranslate
libretranslate --host 127.0.0.1 --port 5001 --load-only en,hi
```

Set backend `TRANSLATION_URL=http://127.0.0.1:5001/translate`.
Set `TRANSLATION_API_KEY` only if that service requires one, then restart the backend.
Verify its `/languages` response includes `en` and `hi`.
For hosted/private production setup, follow the
[provider installation instructions](https://docs.libretranslate.com/guides/installation/).
Only send patient free text to a provider authorized for that data.
Without a configured provider, unsupported free text returns an explicit 503 instead of
pretending that unchanged text was translated.

## Verification commands

Run database integration tests on a development database, with connectivity available.
They create uniquely named temporary records and remove them.

```powershell
cd backend
npm test
npm run test:integration
npx prisma migrate status
npm run catalog:seed
cd ../frontend
npm run lint
npx tsc --noEmit
npx playwright install chromium
npm run test:e2e
npm run build
```

On Windows with Edge installed, set `$env:E2E_BROWSER_CHANNEL='msedge'` before browser tests.
Tests use ports 3100/5100 and `.next-e2e`; the development app uses 3000/5000.
Run browser and backend database integration suites sequentially.
For production frontend startup, use `npm run build` then `npm start`; backend uses `npm start`.

The knowledge base is a small sourced prototype, not an exhaustive clinical dataset.
No match is not proof of safety. All OCR detections require review; handwriting is not guaranteed.
Alternatives are for clinician review and never change the prescription automatically.
