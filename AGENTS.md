# Contributor and agent notes

Read `PROJECT_GUIDELINES.md` and `CONTRIBUTING.md` before changing product behavior.

- Keep processing and contact storage on the device. Do not add telemetry, accounts, remote OCR, third-party runtime requests, or sensitive console logging.
- Preserve original Unicode names, international number prefixes, and leading zeros. Never invent missing contact details or silently merge duplicates.
- Use synthetic cards and fictional data in fixtures. Retaining photos must remain optional and off by default.
- Keep dependency versions exact, update the lockfile, and preserve redistribution notices.
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` for code changes. Run `npm run test:e2e` for affected browser flows and `npm run test:subpath` for asset, hosting, or service-worker changes.
- Distinguish executed automated checks from pending physical-device and native-speaker review. Never claim mocked OCR proves offline recognition.
- Do not publish or deploy without explicit maintainer authorization.
