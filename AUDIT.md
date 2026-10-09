# Full-stack audit and implementation record

## Baseline inspection (before this repair)

Reviewed all application pages, components, API/service helpers, Express route families,
middleware, Prisma models/migration, scripts, dependency manifests, environment variable
names, and existing backend/browser tests. Existing uncommitted changes are preserved.

| Area | Evidence and required repair |
| --- | --- |
| Auth | bcrypt + signed JWT + existing-user validation work. Catalog editing is server-allowlisted. Keep these controls; add doctor authorization rather than exposing patient records. |
| Catalogs | Real Prisma CRUD and frontend mappings exist. Database has 10 medicines, 0 foods and 0 interaction records. Extend the explicit, idempotent seed with sourced bilingual knowledge. |
| Interactions | Real symmetric drug-pair and medicine-food queries exist. Missing severity validation, sources, patient risk/action structure and clinician-review alternatives. |
| OCR | Both endpoints only save caller-provided text; upload UI has no file upload. Add validated image ingestion, real local OCR, catalog normalization and mandatory patient confirmation. |
| Languages | `/api/translate` returns input unchanged with `placeholder: true`. Replace with database-backed bilingual content and an explicitly configured translation provider for unsupported free text. |
| Voice | No speech playback implementation. Add browser speech synthesis, exact language/voice selection, cancellation and visible fallback. |
| Doctor | Existing pages/routes are scoped to the caller's prescriptions, with no doctor role or patient assignment. Add server-provisioned doctor role and patient-controlled sharing/revocation. |
| Alerts/reports | Real persisted analysis exists. Preserve manual alerts; connect risk/action, Hindi content and source evidence. Invalidate derived results when confirmed medicine inputs change. |
| Graph | Relational database relationships are already returned and displayed. Extend to risk/action, sources and alternatives; no graph database required. |
| Dead code | Navbar, MedicineCard, AlertCard, StatusBadge and Loading have no imports/references outside their own definitions. Remove or replace only after reference verification. Legacy route URLs remain redirects; their rendering wrappers are replaced by equivalent configuration redirects to avoid development validation errors. |
| Tests | Existing tests cover CRUD/JWT/ownership and catalog dropdown states. Expand with actual image OCR, review confirmation, bilingual results, doctor sharing, TTS success/fallback and every major page. |

## Implementation decisions

- `User` remains the patient identity; no duplicate Patient table. Add a controlled doctor role
  and patient consent relations. Doctor status alone grants no access to another patient's data.
- Keep RxCUI as the medicine identifier. Add optional strength, dosage form and aliases.
- Keep existing interaction, alert, OCR and recommendation models; extend their missing fields.
- Store prescription images in a separate private database relation; never put patient uploads
  in public frontend/static paths or send them to third-party OCR services.
- Run Tesseract locally with downloaded English/Hindi models. Every detection, including high
  confidence results, must be reviewed before it changes prescription medicines.
- Starter knowledge is a small, source-linked prototype dataset, not an exhaustive clinical
  database. Severity labels are application review priorities, not a claimed external rating.
- English/Hindi UI and seeded medical explanations work without API credentials. Free-form
  translation requires a configured LibreTranslate service; absence must produce an honest
  unavailable response, never unchanged text labelled as a translation.
- Clinical alternatives are review suggestions and never automatically replace a medicine.

## Verification

Final commands, page coverage, database changes and remaining limitations will be recorded
in `VERIFICATION.md` after running the completed application and tests.
