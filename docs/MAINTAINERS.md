# Maintaining STARRY Name Cards

This is a free community project by STARRY Solutions. Contributions are open to everyone. Code, translation review, accessibility testing, documentation, bug reports, and design feedback are all welcome. No affiliation with STARRY is needed to contribute.

## Review policy

Review changes for a clear user benefit, accessibility, local-only data handling, offline behavior, maintainability, and accurate documentation. Give actionable feedback respectfully and explain requested changes. Accept small focused improvements as well as larger contributions; help new contributors find a manageable starting point.

Changes should arrive through pull requests with relevant checks and evidence. Before merging, a maintainer should review the change and confirm required CI passes. Security, storage schema, backup format, OCR distribution, and service-worker changes deserve particular care. Do not merge an unreviewed dependency update automatically. Keep exact dependency versions, the lockfile, and notices current.

Myanmar translations require native-speaker review. OCR language support and real-device compatibility must be described according to actual evidence. Synthetic fixtures are required; do not ask contributors to publish personal card data.

## Repository configuration before public release

- Confirm the legal copyright holder in LICENSE.
- Configure a real source repository URL and a private security/conduct reporting channel.
- Enable private vulnerability reporting where available.
- Protect the default branch with review and required CI checks appropriate to the hosting platform.
- Identify maintainers through the repository's actual access controls and public profiles; this document does not invent names or contacts.
- Publish accurate test results, remaining device checks, and deployment instructions.
- Confirm distribution includes all third-party notices and self-hosted OCR assets.

## Releases and changes of responsibility

Publication and deployment require explicit project authorization. Record the version/commit, automated results, known limitations, compatibility checks, and any storage or backup migration behavior. Avoid forced updates while a user is editing or scanning.

When adding a maintainer, document their actual role after they consent and grant only the access they need. Decisions should be recorded in issues or pull requests without exposing private reports or personal contact data. This document defines a proposed working policy; repository permissions and protections must be configured on the actual host.
