# Security policy

## Reporting

Do not post exploitable vulnerabilities or real card data in public issues. Once the repository is public, use its private vulnerability reporting feature if enabled, or a maintainer's published private contact channel. Maintainers must configure that channel before public launch; this project does not invent an email address or promise a response time.

Include affected version/commit, browser/OS, minimal reproduction with fictional data, expected behavior, and the potential impact. Only test against your own data and local instance.

## Security model

Card data stays in browser storage until explicit export/sharing. It is not encrypted by the app. Same-origin scripts, a compromised deployment, browser extensions, and compromised devices may access it. Offline operation does not eliminate those risks.

Render imported/OCR text as text, allow only safe URL protocols, validate backups before restoring, and avoid contact data in logs or URLs. Keep the dependency lockfile, self-hosted OCR assets, and Content Security Policy under review. Review service-worker updates carefully because they can affect offline resources. A static host may keep ordinary access logs.

No version-support or security-audit claim is made before the initial release. Before release, maintainers should review dependencies, deployment headers, reporting channels, and the manual privacy/network checks in `docs/QA_CHECKLIST.md`.
