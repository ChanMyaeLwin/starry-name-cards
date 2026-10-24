# Contributing

Thank you for helping make local contact capture accessible. Read the [project guidelines](PROJECT_GUIDELINES.md) and [code of conduct](CODE_OF_CONDUCT.md) first.

1. Install Node.js 22+, run `npm ci` and `npm run setup:ocr`.
2. Create a focused branch and explain the user problem in your change.
3. Preserve local-only processing, offline operation, subpath deployment, accessible labels/focus, and English/Myanmar interface support. Keep UI and OCR language settings independent. Do not add telemetry, external runtime services, or real personal data.
4. Add meaningful tests for changed behavior using fictional contacts and synthetic images. Check storage errors, unsafe imports, cancellation, Unicode, and offline use where relevant.
5. Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and relevant Playwright tests. Install Chromium with `npx playwright install chromium` if needed. Report exactly what ran and what remains untested.
6. Open a pull request with the problem, resulting behavior, screenshots for visual changes, test evidence, and known limitations.

Pin dependency changes and update the lockfile and third-party notices. Preserve notices for copied/bundled code and model assets. Do not publish a release or deploy the project without maintainer authorization. Translations, especially Myanmar, need native-speaker review; do not claim OCR accuracy based solely on language-model availability.

To report an ordinary bug, use the issue template and redact personal data. For a potential vulnerability, follow [SECURITY.md](SECURITY.md).
