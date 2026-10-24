# Architecture

STARRY Name Cards is a static React/TypeScript application. Its runtime has no application server, account service, telemetry client, or external OCR API.

## Boundaries

- `src/App.tsx`: scan, review, collection, settings and information screens. Contact data remains in component state until explicit saving.
- `src/lib/contact.ts`: pure contact model, parsing rules, duplicate comparison, vCard serialization and backup validation.
- `src/lib/storage.ts`: versioned Dexie/IndexedDB storage. Multi-record restores run in one transaction.
- `src/lib/images.ts`: image decoding, orientation, resizing, cropping and rotation. Processed images are JPEGs without original EXIF metadata.
- `src/lib/ocr.ts` and `ocr.worker.ts`: cancellable local OCR, including front/back text preservation.
- `src/lib/offline.ts`: verified local OCR asset preparation and cache readiness.
- `scripts/setup-ocr.mjs`: pinned, reproducible build-time OCR distribution.
- `scripts/build-sw.mjs`: production shell manifest and scoped service worker generation.

## Data lifecycle

Selecting a photo creates an in-memory processed image. OCR creates editable suggestions and raw recognized text. Download and share generate a vCard without adding a database record. Saving writes a contact with optional processed photos; photo retention defaults off. Deleting a record removes its embedded images in the same operation, so there is no separate image store to orphan.

Schema version 1 is the first released schema. There is no historical migration to invent. Unsupported backup versions are rejected. Future database changes must add a Dexie version and test upgrades from existing records; future backup migrations must be explicit and validated before mutation.

## Offline lifecycle

The installed service worker caches the app shell. OCR packs are explicitly prepared, checked against their byte lengths and SHA-256 digests, and stored separately. Readiness requires both the shell and the selected model dependencies. Browser cache eviction can invalidate readiness. Updates wait for explicit activation when a previous service worker controls the page.

## Contact export

vCard 3.0 follows RFC 2425/2426: UTF-8, CRLF, text escaping, repeated phone/email properties and 75-octet line folding without splitting code points. Required `FN` and `N` are emitted. Structured names are not guessed. The original full name stays in `FN`. Photos and raw OCR text are excluded.

## Privacy boundary

Application code on the same origin can read local records. IndexedDB is not encryption. A compromised release or hosting origin could access data, so dependency review, small changes and static hosting integrity matter. Exported files are outside the application's deletion controls. Ordinary static-host access logs may exist.
