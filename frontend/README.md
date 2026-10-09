# MediSafe frontend

The existing Next.js App Router workspace is connected to Express/PostgreSQL through the shared
Axios client. See the root [setup guide](../README.md), [verification](../VERIFICATION.md) and
[endpoint inventory](INTEGRATION.md).

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Use `MEDISAFE_API_URL=http://localhost:5000` for the server-side proxy and leave
`NEXT_PUBLIC_API_URL=` empty. Database/JWT/provider secrets must never be placed here.

Login stores a validated JWT in sessionStorage. Requests attach Authorization and Accept-Language;
expired sessions clear and redirect. Language persists in the account and browser.
Clinical names and identifiers remain unchanged.

Both check pages share real medicine/food APIs and distinguish loading, empty, errors and retry.
Image upload uses multipart and actual OCR. Review/correction/confirmation precede analysis.
Alerts show combination, severity, explanation, risk, action, source and doctor guidance.
Doctor pages require a verified role and patient consent through Care team.
Knowledge pages display real database relationships and clinician-review alternatives.

Listen uses browser SpeechSynthesis with a voice matching the selected language.
On Windows, open Settings > Time & language > Speech > Manage voices > Add voices,
add Hindi, then restart the browser. The browser must expose a matching hi-IN voice.
See [Microsoft's voice installation guide](https://support.microsoft.com/en-us/accessibility/windows/narrator/appendix-a-supported-languages-and-voices).
If a voice is absent or playback fails, the translated text remains usable.
The verification machine exposed English voices but no Hindi voice; Hindi fallback was exercised.

```powershell
npm run lint
npx tsc --noEmit
npx playwright install chromium
npm run test:e2e
npm run build
```

With Windows Edge: `$env:E2E_BROWSER_CHANNEL='msedge'` before browser tests.
Tests use actual development PostgreSQL for integration, plus isolated HTTP/TTS mocks for edge
cases. Fixtures are marked synthetic and removed. E2E ports are 3100/5100, output .next-e2e.
Run build after E2E finishes. A live dev build can remain isolated with
`$env:NEXT_DIST_DIR='.next-e2e'` before `npm run build`.

The complete frontend audit currently includes five high findings in the dev-only ESLint
fast-glob/micromatch/braces dependency chain. Production audit reports zero.
No breaking Next/ESLint downgrade was applied solely to silence that advisory.
