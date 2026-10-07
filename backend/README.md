# MediSafe REST API

Simple CommonJS Node.js + Express + Prisma + PostgreSQL backend using the existing eleven Prisma models. Each endpoint has its own route file and an async handler with try/catch. There are 59 requested API endpoints plus the health endpoint. No JWT, external OCR, translation service, AI service, or Neo4j is used.

## Setup

Run commands from `backend/`. Use Node.js 20 or newer.

Put your database connection in **backend/.env** (the existing file is preserved):

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
PORT=5000
```

For a fresh checkout, copy `.env.example` to `.env` and replace the placeholders. Keep any connection options your PostgreSQL provider requires. Never commit credentials.

```powershell
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

The initial migration already exists and was applied in this workspace. The migration command above checks for pending development changes; do not reset the database. To apply checked-in migrations in a deployment, use `npx prisma migrate deploy`. Use `npm start` to run without nodemon.

Base URL: **http://localhost:5000**.

## Folder structure

```text
backend/
├── package.json
├── package-lock.json
├── server.js
├── .env                         # Existing local credentials; ignored by Git
├── .env.example
├── .gitignore
├── README.md
├── prisma.config.ts
├── prisma/
│   ├── schema.prisma             # Unchanged by this API implementation
│   └── migrations/
│       ├── migration_lock.toml
│       └── 20261007104637_init/
│           └── migration.sql
├── lib/
│   ├── prisma.js                 # One shared Prisma client
│   ├── validation.js             # Small input-validation helpers
│   ├── errors.js                 # JSON error responses
│   ├── userFields.js             # Public user fields (no password)
│   └── safetyReport.js           # Shared report calculation
├── tests/
│   ├── api.test.js
│   └── integration.test.js
└── routes/
    ├── health.js
    ├── auth/
    │   ├── register.js
    │   └── login.js
    ├── users/
    │   ├── getMe.js
    │   ├── updateMe.js
    │   └── deleteMe.js
    ├── prescriptions/
    │   ├── create.js
    │   ├── getAll.js
    │   ├── getById.js
    │   └── delete.js
    ├── ocr/
    │   ├── process.js
    │   ├── update.js
    │   └── getByPrescription.js
    ├── medicines/
    │   ├── create.js
    │   ├── getAll.js
    │   ├── search.js
    │   ├── getById.js
    │   ├── update.js
    │   └── delete.js
    ├── prescriptionMedicines/
    │   ├── getAll.js
    │   ├── create.js
    │   ├── update.js
    │   └── delete.js
    ├── drugInteractions/
    │   ├── create.js
    │   ├── getAll.js
    │   ├── getById.js
    │   ├── update.js
    │   ├── delete.js
    │   └── check.js
    ├── foods/
    │   ├── create.js
    │   ├── getAll.js
    │   ├── getById.js
    │   ├── update.js
    │   └── delete.js
    ├── foodInteractions/
    │   ├── create.js
    │   ├── getAll.js
    │   ├── getById.js
    │   ├── update.js
    │   ├── delete.js
    │   └── check.js
    ├── alerts/
    │   ├── create.js
    │   ├── getAll.js
    │   ├── getById.js
    │   ├── markRead.js
    │   └── delete.js
    ├── safetyReports/
    │   ├── generate.js
    │   ├── getByPrescription.js
    │   └── getAll.js
    ├── doctor/
    │   ├── dashboard.js
    │   ├── getPrescriptions.js
    │   ├── getPrescriptionById.js
    │   ├── getAlerts.js
    │   ├── createRecommendation.js
    │   ├── getRecommendations.js
    │   └── updateRecommendation.js
    ├── languages/
    │   └── getLanguages.js
    ├── translate/
    │   └── translate.js
    ├── knowledgeGraph/
    │   ├── getGraph.js
    │   └── getMedicineGraph.js
    └── analyze/
        └── analyzePrescription.js
```

`server.js` mounts each file explicitly. `mergeParams: true` makes mounted parameters such as `:prescriptionId` available to the route. The helpers avoid repeating connection setup and basic validation; CRUD queries remain inside each endpoint file.

## Request and response conventions

- Send JSON with `Content-Type: application/json`.
- IDs are positive PostgreSQL integers. Unknown body fields are ignored. Updates must contain at least one editable field.
- Create endpoints return **201**. Reads, updates, deletes, checks, analysis, report generation and OCR upserts return **200** with JSON.
- Errors return `{ "message": "..." }`: **400** invalid input, **401** invalid login, **404** missing resource/route, **409** duplicate values, foreign-key conflicts or concurrent updates, **413** oversized JSON, **500** unexpected database/server errors.
- Single results use keys such as `user`, `medicine`, `prescription`, `interaction`, `ocrResult`, `report` or `recommendation`. Lists use plural keys. Languages returns an array.
- Login returns a user without a token or session. For all three `/api/users/me` endpoints, set **x-user-id** to the user's ID. This is a caller-supplied selector, not authentication. All routes, including doctor routes, are public in this MVP.
- Passwords use the requested simple plain-text storage/comparison. Responses never include passwords. Password hashing and authenticated access are needed before using real accounts.
- Nullable fields accept `null` to clear them. Email addresses are trimmed and lowercased. Empty strings are rejected.
- A list with no results returns an empty array. Interaction checks with existing medicines/foods and no match return `{ "found": false, "interaction": null }`.
- There is no file upload endpoint: prescription creation stores `fileName` and optional `fileUrl` metadata.
- No CORS middleware is configured. These examples work in Postman; a separate browser frontend needs a same-origin proxy or a deliberate CORS configuration.

## All endpoints

| Method | URL | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Check email/password; return user |
| GET | `/api/users/me` | get current user |
| PUT | `/api/users/me` | update current user |
| DELETE | `/api/users/me` | delete current user |
| POST | `/api/prescriptions` | Create prescription |
| GET | `/api/prescriptions` | List prescriptions |
| GET | `/api/prescriptions/:id` | Get prescription |
| DELETE | `/api/prescriptions/:id` | Delete Prescription |
| POST | `/api/ocr/process/:prescriptionId` | Save supplied OCR text (upsert) |
| PUT | `/api/ocr/:prescriptionId` | Update OCR result |
| GET | `/api/ocr/:prescriptionId` | Get prescription OCR result |
| POST | `/api/medicines` | Create medicine |
| GET | `/api/medicines` | List medicines |
| GET | `/api/medicines/search` | Search name, generic name, brand, or RxCUI |
| GET | `/api/medicines/:id` | Get medicine |
| PUT | `/api/medicines/:id` | Update medicine |
| DELETE | `/api/medicines/:id` | Delete Medicine |
| GET | `/api/prescriptions/:id/medicines` | List linked medicines |
| POST | `/api/prescriptions/:id/medicines` | Create prescriptionMedicine |
| PUT | `/api/prescriptions/:id/medicines/:medicineId` | Update dosage, frequency, duration |
| DELETE | `/api/prescriptions/:id/medicines/:medicineId` | Unlink a medicine |
| POST | `/api/drug-interactions` | Create interaction |
| GET | `/api/drug-interactions` | List interactions |
| GET | `/api/drug-interactions/:id` | Get interaction |
| PUT | `/api/drug-interactions/:id` | Update interaction |
| DELETE | `/api/drug-interactions/:id` | Delete Interaction |
| POST | `/api/drug-interactions/check` | Check an interaction in either direction |
| POST | `/api/foods` | Create food |
| GET | `/api/foods` | List foods |
| GET | `/api/foods/:id` | Get food |
| PUT | `/api/foods/:id` | Update food |
| DELETE | `/api/foods/:id` | Delete Food |
| POST | `/api/food-interactions` | Create interaction |
| GET | `/api/food-interactions` | List interactions |
| GET | `/api/food-interactions/:id` | Get interaction |
| PUT | `/api/food-interactions/:id` | Update interaction |
| DELETE | `/api/food-interactions/:id` | Delete Interaction |
| POST | `/api/food-interactions/check` | Check a medicine/food pair |
| POST | `/api/alerts` | Create alert |
| GET | `/api/alerts` | List alerts |
| GET | `/api/alerts/:id` | Get alert |
| PATCH | `/api/alerts/:id/read` | Mark an alert as read |
| DELETE | `/api/alerts/:id` | Delete Alert |
| POST | `/api/safety-reports/generate/:prescriptionId` | Create/refresh report from stored alerts |
| GET | `/api/safety-reports/:prescriptionId` | Get the latest report for a prescription |
| GET | `/api/safety-reports` | List reports |
| GET | `/api/doctor/dashboard` | Get database dashboard counts |
| GET | `/api/doctor/prescriptions` | List prescriptions |
| GET | `/api/doctor/prescriptions/:id` | Get prescription |
| GET | `/api/doctor/alerts` | List alerts |
| POST | `/api/doctor/recommendations` | Create recommendation |
| GET | `/api/doctor/recommendations/:prescriptionId` | List recommendations for a prescription |
| PUT | `/api/doctor/recommendations/:id` | Update recommendation |
| GET | `/api/languages` | List supported placeholder languages |
| POST | `/api/translate` | Return unchanged text as a translation placeholder |
| GET | `/api/knowledge-graph` | Get medicines, foods and relationship records |
| GET | `/api/knowledge-graph/medicine/:id` | Get a medicine with relationships in both directions |
| POST | `/api/analyze/:prescriptionId` | Check stored interactions, refresh generated alerts/report |
| GET | `/` | API health |

Optional list filters:

| Endpoints | Query parameter |
| --- | --- |
| `GET /api/prescriptions`, `GET /api/doctor/prescriptions` | `userId` |
| `GET /api/alerts`, `GET /api/doctor/alerts`, `GET /api/safety-reports` | `prescriptionId` |

## Editable fields

An asterisk indicates a field required on creation. PUT endpoints accept a partial update.

| Resource | Fields |
| --- | --- |
| Register | `name*`, `email*`, `password*` |
| Login | `email*`, `password*` |
| Current user | `name`, `email`, `password` |
| Prescription | `userId*`, `fileName*`, `fileUrl`, `ocrText` |
| OCR | `extractedText*`, `confidence` (0–1), `language`, `status`; extractedText only required by POST |
| Medicine | `name*`, `genericName`, `brandName`, `rxCui`, `atcCode` |
| Prescription medicine | `medicineId*`, `dosage`, `frequency`, `duration`; PUT edits the last three fields |
| Drug interaction | `medicineAId*`, `medicineBId*`, `severity*`, `description*`, `recommendation` |
| Food | `name*` |
| Food interaction | `medicineId*`, `foodId*`, `severity*`, `description*`, `recommendation` |
| Alert | `prescriptionId*`, `type*`, `severity*`, `title*`, `message*`, `language`, `isRead` |
| Doctor recommendation | `prescriptionId*`, `medicineId*`, `reason*`, `alternative`, `status`; PUT edits reason, alternative and status |
| Translation | `text*`, `language*` (`en` or `hi`) |
| Analysis | Optional `foodIds` array |

`severity`, `status` and `type` are strings as defined by your schema, not added enums. The report treats HIGH, SEVERE, CRITICAL and MAJOR as high-risk severity values, ignoring case.

## Special endpoint behavior

**OCR:** POST stores supplied extracted text with an upsert (one OCRResult per prescription). Its default status is COMPLETED. POST and PUT also synchronize Prescription.ocrText in the same transaction. No image processing occurs.

**Drug checks:** queries check both directions. Creates and updates sort the medicine IDs so the unique pair constraint prevents new reverse duplicates. Identical medicine IDs are rejected.

**Analysis:** reads linked medicines and stored interaction records. If `foodIds` is omitted, returns all known food cautions for those medicines; this does not establish that a patient consumes those foods. `foodIds: []` skips food cautions, and a nonempty array limits the check to those foods.

Each analysis refreshes alerts of type ANALYSIS_DRUG_DRUG and ANALYSIS_DRUG_FOOD, preserving manual alerts. These types are reserved and cannot be submitted through alert creation. Refreshed generated alerts get new IDs and are unread again. The latest report is updated; repeated analysis does not accumulate generated alerts or reports. A transaction keeps these writes together. Concurrent conflicting requests receive 409 and can be retried.

**Reports:** report generation summarizes currently stored alerts; use analysis first to detect interactions. Counts include both read and unread alerts. Status is HIGH_RISK, REVIEW_REQUIRED, or NO_KNOWN_ALERTS. An empty prescription has zero medicines and no detected interactions; no known alerts is not a clinical safety guarantee. The schema allows report history, so the latest report is refreshed while any older records remain.

**Translation:** returns the original text unchanged with `placeholder: true`. Supported language codes are en and hi.

**Knowledge graph:** returns medicines, foods and relationship records from PostgreSQL. The medicine-specific graph includes outgoing and incoming drug relationships and food relationships.

**Deletion:** follows the schema's cascades. Deleting a user removes their prescriptions and associated records. Deleting a medicine that is still used by a prescription or doctor recommendation returns 409. Remove those references first.

## Postman walkthrough

Set a Postman variable `baseUrl` to `http://localhost:5000`. Use raw JSON request bodies. Save returned IDs into the variables shown below; example data is synthetic and is not a clinical interaction dataset.

1. **Register:** POST `{{baseUrl}}/api/auth/register`

   ```json
   { "name": "Demo User", "email": "demo@example.com", "password": "demo-password" }
   ```

   Save `user.id` as `userId`. Login with POST `/api/auth/login` using the email and password. GET `/api/users/me` with header `x-user-id: {{userId}}`.

2. **Create a prescription:** POST `{{baseUrl}}/api/prescriptions`

   ```json
   { "userId": {{userId}}, "fileName": "demo-prescription.txt" }
   ```

   Save `prescription.id` as `prescriptionId`.

3. **Save OCR text:** POST `{{baseUrl}}/api/ocr/process/{{prescriptionId}}`

   ```json
   { "extractedText": "Demo Medicine A and Demo Medicine B", "language": "en", "confidence": 0.9 }
   ```

   Response contains `message: "OCR result saved"` and `ocrResult`. Text is not automatically converted into linked medicines.

4. **Create two medicines:** POST `{{baseUrl}}/api/medicines` twice, once per body:

   ```json
   { "name": "Demo Medicine A", "genericName": "Synthetic A" }
   ```

   ```json
   { "name": "Demo Medicine B", "genericName": "Synthetic B" }
   ```

   Save IDs as `medicineAId` and `medicineBId`. Try GET `/api/medicines/search?q=demo`.

5. **Link both medicines:** POST `{{baseUrl}}/api/prescriptions/{{prescriptionId}}/medicines` twice, changing the ID:

   ```json
   { "medicineId": {{medicineAId}}, "dosage": "Demo only", "frequency": "Demo schedule" }
   ```

6. **Store a synthetic interaction:** POST `{{baseUrl}}/api/drug-interactions`

   ```json
   {
     "medicineAId": {{medicineAId}},
     "medicineBId": {{medicineBId}},
     "severity": "HIGH",
     "description": "Synthetic interaction for testing only",
     "recommendation": "Demo recommendation"
   }
   ```

   Check the reverse pair with POST `/api/drug-interactions/check`:

   ```json
   { "medicineAId": {{medicineBId}}, "medicineBId": {{medicineAId}} }
   ```

7. **Optional food caution:** POST `/api/foods` with `{ "name": "Demo Food" }`. Save `food.id` as `foodId`, then POST `/api/food-interactions`:

   ```json
   {
     "medicineId": {{medicineAId}},
     "foodId": {{foodId}},
     "severity": "LOW",
     "description": "Synthetic food caution for testing"
   }
   ```

   POST `/api/food-interactions/check` with `medicineId` and `foodId` to check the pair.

8. **Analyze:** POST `{{baseUrl}}/api/analyze/{{prescriptionId}}`

   ```json
   { "foodIds": [{{foodId}}] }
   ```

   Expect `drugInteractions`, `foodInteractions`, `alerts` and `report`. With the above fresh sample, totalMedicines is 2, totalAlerts is 2, highRiskCount is 1 and overallStatus is HIGH_RISK. Repeat the request to confirm counts do not increase.

9. **Reports and alerts:** GET `/api/safety-reports/{{prescriptionId}}`, GET `/api/alerts?prescriptionId={{prescriptionId}}`, then PATCH `/api/alerts/{{alertId}}/read` with no body. POST `/api/safety-reports/generate/{{prescriptionId}}` refreshes counts from stored alerts.

10. **Doctor recommendation:** POST `{{baseUrl}}/api/doctor/recommendations`

    ```json
    { "prescriptionId": {{prescriptionId}}, "medicineId": {{medicineAId}}, "reason": "Demo review", "alternative": "Demo alternative" }
    ```

    PUT `/api/doctor/recommendations/{{recommendationId}}` with `{ "status": "REVIEWED" }`. GET `/api/doctor/dashboard` for counts.

11. **Translation:** POST `{{baseUrl}}/api/translate`

    ```json
    { "text": "Demo message", "language": "hi" }
    ```

    The text remains unchanged. GET `/api/knowledge-graph/medicine/{{medicineAId}}` to see linked drug/food records.

## Verification

```powershell
npm test
npm run test:integration
npx prisma validate
```

`npm test` checks every route's registration, required fields and invalid input, JSON handling, placeholders and Prisma error mapping without database queries.

`npm run test:integration` uses DATABASE_URL and exercises all endpoints through HTTP. It creates uniquely named synthetic records, tests repeated analysis, reverse pairs, relation queries and cascades, then removes only the records it created, including on assertion failure. Use a development database.

Dependencies are intentionally limited to Express, dotenv and Prisma Client, plus Prisma CLI and nodemon for development. npm currently reports six high-severity findings in the existing Prisma/nodemon dependency trees; its suggested fixes are breaking downgrades and were not applied.
