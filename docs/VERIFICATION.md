# Verification report

Date: 24 October 2026. Environment: macOS ARM64, Node.js 22.21.1, Playwright 1.64.1 / Chromium 156.0.8078.4. Tests use synthetic card images and fictional contacts.

## Executed checks

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run format:check` | Passed |
| `npm test` | 29 tests passed across six files |
| `npm run build` | Passed; static output in `dist/` |
| `npm run test:e2e` | Ten browser scenarios passed |
| `npm run test:subpath` | Passed at `/name-cards/`; offline launch, asset preparation and local save |
| `npm audit` | Zero known vulnerabilities reported at verification time |

The browser scenarios cover first launch and empty collection; manual creation; edit and reload persistence; VCF download; QR generation; native-sharing fallback without saving; backup export, preview and restore; deletion; duplicate review; responsive layout; and a real service-worker update while unsaved edits remain intact.

The real OCR scenario downloads local English assets, disconnects the browser network, reloads the app, reads a synthetic image using the actual bundled Tesseract/WASM engine, checks the recognized email, and saves locally. It also verifies missing Myanmar-pack guidance and OCR cancellation. No external requests were observed during this scenario. This is a functional smoke test, not an accuracy benchmark.

Unit tests cover Unicode vCard output, escaping and byte-aware folding, duplicate normalization, raw-text parsing, backup versions and malformed embedded images, safe URL handling, IndexedDB persistence and transactional rollback, simulated storage failure, shell-cache eviction/recovery, unsafe asset manifests, and worker cancellation. Schema v1 is the initial schema: unsupported backup versions are rejected; there is no historical database migration to claim.

## Visual review

Reviewed the home screen at 390 px and 1440 px widths. The narrow layout has no horizontal overflow. Screenshots are in `docs/screenshots/` and the browser tests regenerate their source copies under ignored `test-results/`.

## Remaining release checks

- Physical iPhone Safari and Android Chrome camera, orientation, native share and contact-import behavior.
- Desktop Firefox and Safari, installed mobile PWA behavior, and real screen-reader review.
- Representative Myanmar and mixed-language cards. Myanmar OCR remains experimental.
- Native-speaker review of draft Myanmar UI copy; some generated status/conflict messages use English fallback.
- Larger real-world accuracy and performance evaluation on lower-memory phones.
- Configure the actual public source repository URL and GitHub security/reporting settings before publication.

See `QA_CHECKLIST.md` for the device checklist. No public deployment or remote repository publication was performed.

## Implementation references

- [Vite static deployment](https://vite.dev/guide/static-deploy.html)
- [Tesseract.js local installation](https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md)
- [Pinned tessdata_fast model source](https://github.com/tesseract-ocr/tessdata_fast/tree/87416418657359cb625c412a48b6e1d6d41c29bd)
- [vCard 3.0 specification, RFC 2426](https://www.rfc-editor.org/rfc/rfc2426)

## Mobile navigation update

Added persistent Home / Connections / Settings / More navigation, compact settings cards, local profile storage and distinct hash routes. Browser coverage includes route reload, back/forward, profile persistence, saved-connection deep links, privacy deep links, active navigation and mobile overflow. Profile information is local-only and excluded from contact backups.

## Wi-Fi preview and installation update

Added a LAN preview command and a guided Add to home screen button. Browser tests simulate the install event lifecycle, verify prompts require a click and are used once, and check Safari directions using an iPhone user agent. These simulations do not establish physical-device installation compatibility.

A Chromium smoke test against the host's HTTP LAN address confirmed an insecure context, manual contact creation, reload persistence and HTTPS installation guidance without page errors. UUID generation also works when `crypto.randomUUID` is unavailable on HTTP. A physical phone connection remains a manual check.

## Read Card download prompt

Read Card now checks the selected OCR pack before starting recognition. Missing files open a focused download dialog with Download and read, Not now, and manual entry. It shows download progress, retains the selected image, reports failures for retry, and resumes recognition after a successful download. Offline devices receive connection guidance; insecure HTTP previews receive HTTPS/localhost guidance.

The real OCR browser scenario covers dismissing the prompt without losing the image, downloading from the prompt and reading the retained image, then offline recognition and a missing Myanmar pack. Settings remains in primary navigation and was removed from the More menu.

## Combined language download

Offline setup downloads English and Myanmar together without a language selector or a separate Myanmar removal action. The scan screen still lets users choose the recognition language for their card. Browser coverage verifies both packs are installed by the download prompt, then simulates Myanmar cache eviction to check missing-pack guidance.

## Notice popups

App notices now use a native modal dialog, including storage requests, save/export feedback, profile saves, installation results and Settings download results. Progress remains inline. Browser coverage checks the storage message, initial button focus, Escape and OK dismissal, and return of focus to the initiating button.
