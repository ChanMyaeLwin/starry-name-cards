# Manual compatibility and privacy checklist

This checklist records **pending manual verification**, not completed test results. Record date, commit, OS/browser versions, device, and observations for each run. Use only synthetic cards and fictional contact data.

| Environment | Status | Evidence |
| --- | --- | --- |
| Safari on physical iPhone | Pending | |
| Chrome on physical Android | Pending | |
| Desktop Chrome | Pending manual run | |
| Desktop Firefox | Pending | |
| Desktop Safari | Pending | |
| iOS Contacts VCF import | Pending | |
| Android Contacts VCF import | Pending | |
| Installed PWA on iOS and Android | Pending | |
| Myanmar and mixed-language card corpus | Pending human evaluation | |
| Myanmar interface translation review | Pending native-speaker review | |

## Workflow

- First launch: two clear home actions, empty collection, no false offline-readiness claim.
- Manual entry: Unicode names, multiple phones/emails/websites, leading zeros, international prefix, extension, and unsplit Myanmar full name survive save/reload/edit/export.
- Images: camera hint and picker, front/back, rotation/crop, replace/remove, large input rejection, unsupported HEIC feedback. Check orientation on actual phone photos.
- OCR: prepare assets online; disable network; reload and recognize a synthetic card using real local OCR. Inspect raw text and editable suggestions. Cancel recognition and ensure workers are released and UI remains usable.
- Missing pack: remove an optional pack, go offline, select it, and verify clear guidance/manual entry.
- Save: retain-photos choice defaults off; reload persistence; likely duplicate review; save separately and explicit conflict-aware merge; storage quota failure preserves editable/exportable data.
- Library: search, sort, edit, delete confirmation/undo, empty state.
- Exports: contact download, unsupported sharing fallback, cancelled native share, multi-contact VCF, selected-field QR preview/download and excessive-data feedback.
- Backups: with/without photos; unencrypted disclosure; invalid/oversized/unsafe import rejection; preview, duplicates, restore, and reload persistence.
- Offline lifecycle: interrupted pack download and retry, app shell preparation, cache eviction/missing assets, offline launch, update notification during unsaved edits without forced reload.
- Deletion: explicit confirmation; collection/local assets cleared; explain exported/shared files remain.

## Accessibility and network

- Keyboard-only flow, visible focus, labelled fields/buttons, dialog focus/escape, progress/error announcements, 200% zoom, narrow viewport, reduced motion, screen-reader review.
- With DevTools network recording, scan and manage synthetic contacts; verify requests only fetch expected same-origin static assets, never contain card/image/OCR data, and never contact external services.
- Repeat prepared OCR with network disabled; do not replace this with mocked OCR.
- Inspect console, URLs, service-worker diagnostics, and host request URLs for accidental personal-data exposure.
- Try unsafe markup and `javascript:`/`data:` URLs in imported fields; confirm text rendering and no unsafe navigation.
- Install a production build under a subdirectory and confirm assets, manifest, offline navigation, OCR, and updates stay within its scope.

Automated results should be recorded separately with the exact command, date, outcome, and any skips. Browser automation cannot validate native share sheets, phone camera orientation, or operating-system contact import by itself.
