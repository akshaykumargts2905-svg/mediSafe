# MediSafe backend

Express 5, Prisma 6 and PostgreSQL; CommonJS modules. See the root [setup guide](../README.md)
and [verification report](../VERIFICATION.md). There are 66 mounted HTTP endpoints, including health;
the [endpoint inventory](../frontend/INTEGRATION.md) maps every route to its consumer.

## Database and seed

The original models are retained. User is also the patient identity. The extension adds
`UserRole`, `InteractionSeverity`, `CareAccess`, `PrescriptionImage`, `AlternativeMedicine`,
medicine strength/form/aliases, OCR review metadata and bilingual clinical fields.

The extension migration preserves existing severity columns through an in-place cast.
Legacy MAJOR/SEVERE map to HIGH, MEDIUM to MODERATE, MINOR to LOW. Unknown severity values
abort the transaction for explicit review; they are not silently discarded.

```powershell
npm ci
npx prisma migrate deploy
npx prisma generate
npm run catalog:seed
npm run ocr:setup
npm run dev
```

`catalog:seed` and `npx prisma db seed` run the same transactional seed:
12 generic medicines, 3 foods, 4 drug-drug records, 3 drug-food records and 1 alternative.
Unique RxCUI/pair/name constraints plus skipDuplicates preserve IDs and existing edits on rerun.

Generic names and identifiers were checked using the
[NLM RxNorm API](https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html).
Strength and dosage form are nullable because these seeds represent ingredients, not fabricated
clinical products. The schema/editor support actual product details.
Every interaction/alternative in `prisma/knowledge.json` carries its source URL.
Severity is an application review priority, not a claim of an externally validated risk score.
Read the source and obtain clinical review before expanding or deploying this small dataset.

## Authentication and authorization

- Registration/login are public. All other `/api/*` requests require a signed JWT and existing user.
- Passwords use bcrypt (12 rounds), minimum 8 characters, maximum 72 UTF-8 bytes.
- JWT checks cover HS256, issuer, audience, expiry and user ID. No password/hash is returned.
- `x-user-id` cannot set identity. Patient queries use prescription ownership.
- Registration/profile cannot assign DOCTOR or catalog editor rights.
- `npm run doctor:grant -- existing-email` provisions an already registered, verified clinician.
- Doctor routes require DOCTOR plus patient sharing through CareAccess. Own records remain accessible.
  Catalog editor status never grants patient access.
- Patients alone grant/revoke sharing. Shared clinicians can read summaries/images and create/update
  recommendations; they cannot mutate patient prescriptions or OCR.
- Shared catalogs are readable by every authenticated account. Writes require `CATALOG_EDITOR_IDS`.
- JWT logout clears the browser token. Existing tokens expire naturally; this prototype has no
  server session/revocation store. Password changes do not invalidate other issued tokens.
- `npm run passwords:upgrade` remains available for legacy plaintext records. It preserves existing
  bcrypt hashes and never logs passwords. No automatic default accounts are created.

## OCR and normalization

`POST /api/prescriptions/upload` accepts multipart `image` and `language=en|hi`.
Multer limits size/count; Sharp verifies actual bytes, MIME, dimensions (16 MP) and single-page
format, strips metadata and produces a bounded PNG. Only PNG/JPEG/WebP are accepted.
The normalized image is stored in the private PrescriptionImage relation, not a public directory.
`GET /api/prescriptions/:id/image` rechecks owner/consent and sends no-store image bytes.

Tesseract runs locally using pinned npm English/Hindi model packages extracted by `ocr:setup`.
No third-party OCR key is required. Two jobs may run concurrently; each has a 90-second deadline.
`OCR_DATA_DIR` optionally overrides the model directory.

Extraction returns text, confidence and catalog candidates. Matching normalizes case/punctuation,
generic/brand/alias names and RxCUI-linked records. A single-character near match is only a POSSIBLE
suggestion; confidence is capped by the OCR confidence. No detection automatically links medicines.

Manual text POST/PUT endpoints remain available. Corrections update candidates and reviewVersion,
preserve image provenance, reset confirmation and invalidate generated analysis.
Client-supplied confidence/status cannot assert an OCR success.

`POST /api/ocr/:prescriptionId/confirm` takes
`{medicineIds: [actualIds], reviewVersion: currentVersion}`.
The transaction validates IDs/version/ownership and saves only the confirmed selection.
Existing dosage instructions on retained links are preserved.

## Interactions, alerts, reports and graph

Checks query stored medicine pairs (both directions) or medicine-food pairs.
Supported severities: LOW, MODERATE, HIGH, CRITICAL.
Responses contain description, risk, recommendation, source, localized display fields and related
alternatives. An absent record is explicitly not a safety guarantee.

Analysis requires linked medicines and confirmed OCR when an OCR record exists.
Omitted foodIds checks all known food cautions; [] skips food checks; explicit IDs limit the scope.
It atomically refreshes analysis-owned alerts and the latest report, preserving manual alerts.
Repeated analysis does not accumulate generated records.
Medicine edits/text corrections/confirmation invalidate old generated alerts and reports.
Report generation runs the same analysis service to avoid producing an unchecked safety report.

Graph endpoints use real relational records including alternatives; no separate graph infrastructure.
Alternatives do not replace medicines automatically.

## Language and voice contract

Authentication resolves language from a valid query/header or the stored user preference.
Responses preserve canonical values and add localized display values. Medicine names/RxCUI/ATC are
never passed through the UI translation dictionary.
Hindi fields cover seeded explanations, risks, recommendations, alerts and alternatives.
Custom untranslated content is retained and identified instead of fabricated.

`POST /api/translate` takes `{text, source: "en"|"hi", language: "en"|"hi"}`.
It uses exact bilingual knowledge matches first, then the configured LibreTranslate endpoint.
Same-source/target text is explicitly marked `same-language`.
An unavailable translation returns 503. Provider translation masks medicine names/identifiers and
rejects responses that lose those markers. No private database records are searched to translate
another patient's content. Voice playback lives in the frontend and uses the selected language.

## Errors and operations

Validation/ownership/database errors map to JSON 400/401/403/404/409/413/415/422/429/500/503/504.
Internal stack traces and credentials are not exposed. Parameterized Prisma operations are used.
Secrets stay in ignored backend/.env; images are returned only through the authenticated route.
CORS is restricted by FRONTEND_ORIGINS; same-origin Next proxy needs no public API secret.

Use Node's built-in watch mode for development. The unused nodemon dependency was removed.
The compatible deepmerge-ts override addresses the Prisma config dependency advisory.
Backend npm audit is clean after this change; rerun it as dependencies evolve.

See root setup for exact commands and the optional translation provider configuration.
