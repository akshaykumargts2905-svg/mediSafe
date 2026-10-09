# Frontend/backend contract inventory

Generated from the mounted Express route files. All existing route families are retained.
The six new endpoints cover upload, private images, OCR confirmation and patient consent.
Resource IDs come from API responses/catalogs; no patient identity is taken from request headers
other than the verified JWT. See [backend behavior](../backend/README.md) and [verification](../VERIFICATION.md).

| Method | Endpoint | Frontend consumer |
| --- | --- | --- |
| POST | `/api/auth/register` | Login and signup |
| POST | `/api/auth/login` | Login and signup |
| GET | `/api/care-team` | Care team sharing/revocation |
| POST | `/api/care-team` | Care team sharing/revocation |
| DELETE | `/api/care-team/:doctorId` | Care team sharing/revocation |
| GET | `/api/users/me` | Dashboard, profile, language selector, catalog permissions |
| PUT | `/api/users/me` | Dashboard, profile, language selector, catalog permissions |
| DELETE | `/api/users/me` | Dashboard, profile, language selector, catalog permissions |
| POST | `/api/prescriptions` | Prescription list/detail/upload and protected image preview |
| POST | `/api/prescriptions/upload` | Prescription list/detail/upload and protected image preview |
| GET | `/api/prescriptions/:id/image` | Prescription list/detail/upload and protected image preview |
| GET | `/api/prescriptions` | Prescription list/detail/upload and protected image preview |
| GET | `/api/prescriptions/:id` | Prescription list/detail/upload and protected image preview |
| DELETE | `/api/prescriptions/:id` | Prescription list/detail/upload and protected image preview |
| POST | `/api/ocr/process/:prescriptionId` | OCR editor and confirmation |
| POST | `/api/ocr/:prescriptionId/confirm` | OCR editor and confirmation |
| PUT | `/api/ocr/:prescriptionId` | OCR editor and confirmation |
| GET | `/api/ocr/:prescriptionId` | OCR editor and confirmation |
| POST | `/api/medicines` | Medicine catalog, medicine detail, both check selectors, OCR suggestions |
| GET | `/api/medicines` | Medicine catalog, medicine detail, both check selectors, OCR suggestions |
| GET | `/api/medicines/search` | Medicine catalog, medicine detail, both check selectors, OCR suggestions |
| GET | `/api/medicines/:id` | Medicine catalog, medicine detail, both check selectors, OCR suggestions |
| PUT | `/api/medicines/:id` | Medicine catalog, medicine detail, both check selectors, OCR suggestions |
| DELETE | `/api/medicines/:id` | Medicine catalog, medicine detail, both check selectors, OCR suggestions |
| GET | `/api/prescriptions/:id/medicines` | Prescription medicine editor and OCR review |
| POST | `/api/prescriptions/:id/medicines` | Prescription medicine editor and OCR review |
| PUT | `/api/prescriptions/:id/medicines/:medicineId` | Prescription medicine editor and OCR review |
| DELETE | `/api/prescriptions/:id/medicines/:medicineId` | Prescription medicine editor and OCR review |
| POST | `/api/drug-interactions` | Interaction catalog and drug-drug check |
| GET | `/api/drug-interactions` | Interaction catalog and drug-drug check |
| GET | `/api/drug-interactions/:id` | Interaction catalog and drug-drug check |
| PUT | `/api/drug-interactions/:id` | Interaction catalog and drug-drug check |
| DELETE | `/api/drug-interactions/:id` | Interaction catalog and drug-drug check |
| POST | `/api/drug-interactions/check` | Interaction catalog and drug-drug check |
| POST | `/api/foods` | Food catalog, drug-food selector and analysis scope |
| GET | `/api/foods` | Food catalog, drug-food selector and analysis scope |
| GET | `/api/foods/:id` | Food catalog, drug-food selector and analysis scope |
| PUT | `/api/foods/:id` | Food catalog, drug-food selector and analysis scope |
| DELETE | `/api/foods/:id` | Food catalog, drug-food selector and analysis scope |
| POST | `/api/food-interactions` | Interaction catalog and drug-food check |
| GET | `/api/food-interactions` | Interaction catalog and drug-food check |
| GET | `/api/food-interactions/:id` | Interaction catalog and drug-food check |
| PUT | `/api/food-interactions/:id` | Interaction catalog and drug-food check |
| DELETE | `/api/food-interactions/:id` | Interaction catalog and drug-food check |
| POST | `/api/food-interactions/check` | Interaction catalog and drug-food check |
| POST | `/api/alerts` | Patient dashboard and alert list/details/read/delete |
| GET | `/api/alerts` | Patient dashboard and alert list/details/read/delete |
| GET | `/api/alerts/:id` | Patient dashboard and alert list/details/read/delete |
| PATCH | `/api/alerts/:id/read` | Patient dashboard and alert list/details/read/delete |
| DELETE | `/api/alerts/:id` | Patient dashboard and alert list/details/read/delete |
| POST | `/api/safety-reports/generate/:prescriptionId` | Report list/detail/generate and prescription actions |
| GET | `/api/safety-reports/:prescriptionId` | Report list/detail/generate and prescription actions |
| GET | `/api/safety-reports` | Report list/detail/generate and prescription actions |
| GET | `/api/doctor/dashboard` | Doctor dashboard, prescription review, alerts and recommendations |
| GET | `/api/doctor/prescriptions` | Doctor dashboard, prescription review, alerts and recommendations |
| GET | `/api/doctor/prescriptions/:id` | Doctor dashboard, prescription review, alerts and recommendations |
| GET | `/api/doctor/alerts` | Doctor dashboard, prescription review, alerts and recommendations |
| POST | `/api/doctor/recommendations` | Doctor dashboard, prescription review, alerts and recommendations |
| GET | `/api/doctor/recommendations/:prescriptionId` | Doctor dashboard, prescription review, alerts and recommendations |
| PUT | `/api/doctor/recommendations/:id` | Doctor dashboard, prescription review, alerts and recommendations |
| GET | `/api/languages` | Languages screen |
| POST | `/api/translate` | Languages screen |
| GET | `/api/knowledge-graph` | Knowledge graph and medicine relationships |
| GET | `/api/knowledge-graph/medicine/:id` | Knowledge graph and medicine relationships |
| POST | `/api/analyze/:prescriptionId` | Analysis screen and prescription actions |
| GET | `/` | Dashboard /api-health proxy |

## Transport and shapes

Axios sends bearer authorization and Accept-Language. JSON payloads use structured data; image upload uses multipart FormData.
Catalog responses are `{medicines}` and `{foods}`; interaction checks are `{found, interaction, guidance, notice}`.
OCR is `{ocrResult}`; upload is `{prescription}`; confirmation is `{ocrResult, medicines}`.
Analysis returns `{prescriptionId, drugInteractions, foodInteractions, alternatives, alerts, report}`.
Doctor summaries include safe patient fields, linked medicines, OCR metadata, alerts and alternatives.
Patient permission changes are `/api/care-team` and require the patient token.
Clinical canonical fields remain unchanged; `.display` contains localized text and missing translation information.

## Error behavior

401 clears the active tab session and redirects. 403 explains missing editor/doctor permission.
404 hides records outside the authorization scope. 409 handles duplicates/concurrent review changes.
422 requires confirmed medicine input or reports unreadable images.
Upload limits, OCR availability and translation provider failures remain visible and retryable.
The check page distinguishes loading, empty data, malformed data and API failure.

Legacy /interaction, /prescription and /results aliases remain 307 redirects in next.config.ts. Their old page wrappers were removed to avoid redirect control flow being diagnosed as an instant-render failure.
