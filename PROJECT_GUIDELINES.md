# STARRY Name Cards — Project Guidelines

Act as a senior frontend engineer, product designer, and QA engineer. Build a complete, working, open-source web app called STARRY Name Cards.

This is a free CSR initiative by STARRY Solutions that helps anyone turn a physical business card into a digital contact while keeping their information on their own device.

Implement the application, run appropriate checks, and provide the source code and documentation. Do not stop at a plan, mockup, or architecture description.

## 1. Product goal

Users should be able to:

1. Open the web app.
2. Take a photo of a business card or select an existing image.
3. Extract text locally on their device.
4. Review and correct the contact information.
5. Save the card in their local collection.
6. Download or share a contact file that can be imported into a phone’s contacts.

The home screen must prioritize exactly two primary actions:

* Scan a Name Card
* My Name Cards

Keep the experience simple enough for nontechnical users.

## 2. Non-negotiable requirements

* Free to use.
* Public, open-source repository.
* No account or login.
* No backend for processing or storing business cards.
* No cloud OCR or remote AI API.
* No analytics, tracking pixels, advertisements, or telemetry.
* No transmission of photos, recognized text, or contact details to our servers.
* No runtime dependence on third-party CDNs, remote fonts, or external image services.
* Core features work offline after the app and required OCR assets have been successfully downloaded.
* All contact data stays in the browser on the user’s device unless the user explicitly exports or shares it.
* Never claim that browser storage is a permanent backup or that data is encrypted unless encryption is actually implemented.
* Never invent missing contact details.
* Never silently upload an image as a fallback.

Use this privacy statement:

“Your card photos and contact details stay on your device unless you choose to export or share them.”

Explain separately that ordinary hosting access logs may exist when the app is loaded online.

## 3. Technical approach

Use this preferred stack unless the existing repository provides a suitable established alternative:

* React and TypeScript
* Vite
* A service worker/PWA implementation
* IndexedDB, optionally through Dexie
* Tesseract.js or a suitable open-source browser-based OCR engine
* Locally hosted OCR workers, WASM binaries, and language models
* A lightweight local QR generation library
* Vitest and React Testing Library for meaningful unit/component tests
* Playwright for browser integration tests

Before implementation, verify current official documentation, package compatibility, supported OCR languages, and applicable dependency licenses. Pin dependency versions and commit the lockfile.

Avoid unnecessary frameworks, cloud services, authentication, server databases, or API keys.

The production build must be deployable as static files over HTTPS and support hosting under a subdirectory.

## 4. Visual design

Create a polished, mobile-first interface with:

* Royal blue as the primary color
* White and light neutral surfaces
* Clear typography and strong contrast
* Large touch targets
* Rounded cards and restrained shadows
* Simple icons accompanied by labels
* Accessible focus states
* Responsive layouts for phones, tablets, and desktop

Use a small text attribution:

“A free community project by STARRY Solutions”

Do not invent or recreate an official STARRY logo. Use text branding until an approved logo asset is supplied.

Avoid making the product look like a corporate dashboard. The home screen should feel calm, focused, and easy to use.

Include English and Myanmar interface translations with a language switch. Use Unicode text and suitable locally bundled fonts where needed, subject to font licensing. Flag Myanmar translations that require human review.

UI language and OCR recognition language must be separate settings.

## 5. Home screen

Display:

* App name and brief explanation
* Scan a Name Card
* My Name Cards, including saved-card count
* A short privacy statement
* Offline readiness status
* Small links to settings, privacy, help, and the public source repository

Do not invent a repository URL. Make it configurable and hide the link until configured.

Distinguish clearly between:

* The device currently being offline
* The app being ready for offline use
* An OCR language pack being unavailable

Do not show “Ready offline” until the required app and OCR assets are verified as available locally.

## 6. Scan flow

Provide:

* Take Photo
* Choose Photo
* Enter Details Manually

Use a mobile file input with an appropriate camera capture hint as the reliable baseline. If implementing a live camera interface, include permission handling and a file-picker fallback.

Support:

* A front image
* An optional back image
* Image preview
* Rotation
* Cropping
* Replacing or removing an image
* A clear “Read Card” action

For images:

* Correct orientation.
* Downscale excessive dimensions while preserving readability.
* Set and explain reasonable file-size and dimension limits.
* Handle unsupported formats gracefully.
* Do not assume all browsers can decode HEIC.
* Avoid retaining unnecessary original metadata in stored processed images.
* Release object URLs and temporary image resources.

Provide simple capture guidance:

“Place the card on a plain surface with good lighting. Keep all text visible.”

Run OCR without blocking the main interface. Display honest progress and allow cancellation. Terminate or clean up OCR work when cancelled.

Combine front and back text without silently discarding potentially useful details.

## 7. OCR and field extraction

OCR must execute locally.

Start with English recognition. Include Myanmar recognition if supported by the selected engine, but treat its accuracy as experimental until tested on representative cards.

Do not describe language support as reliable merely because a model exists.

Provide language-pack download controls with:

* Download size, when known
* Download progress
* Retry after failure
* Installed status
* Offline availability
* Removal of optional packs

If the needed model is unavailable while offline, explain the limitation and offer manual entry.

Extract candidate values for:

* Full name
* Company or organization
* Job title
* Multiple phone numbers
* Multiple email addresses
* Multiple websites
* Address
* Notes

Use transparent local parsing rules and heuristics. Names, job titles, and company names may remain uncertain; leave fields blank or mark suggestions for review instead of inventing values.

Preserve:

* International telephone prefixes
* Leading zeros
* Extensions
* Unicode names and addresses

Allow users to inspect and copy the raw OCR text.

Keep OCR confidence distinct from confidence in field assignment. Do not show fabricated confidence percentages.

## 8. Review and edit screen

Show the card image next to or above the editable form.

Include:

* Full name
* Optional given and family names for structured contact export
* Company
* Job title
* Repeatable phone numbers with labels
* Repeatable email addresses with labels
* Repeatable websites
* Address
* Notes
* Raw recognized text

Do not force a Western first-name/last-name interpretation of Myanmar names.

Make all detected values editable. Offer helpful validation without rejecting legitimate international formats.

Show:

“Please check the details before saving.”

Keep these actions distinct:

* Save to My Name Cards — stores the card in this browser
* Download Contact (.vcf) — generates a contact file
* Share Contact — opens the device’s sharing interface when supported

Downloading or sharing must not silently save a card into the local collection.

Give users an explicit choice to retain the processed card photos. Default photo retention to off and explain the storage tradeoff.

Require at least a name, company, phone number, or email before saving or exporting.

## 9. My Name Cards

Implement:

* Search by name, company, telephone, or email
* Sorting by recently added and name
* View details
* Edit
* Download contact
* Share contact
* Delete with confirmation or undo
* Export all contacts
* Backup and restore

Use names or initials when there is no stored photo.

Show an empty state with a Scan a Name Card action.

Include this reminder:

“Cards are stored in this browser on this device. Clearing browser data or losing your device may remove them. Export a backup to keep a copy.”

Do not imply that saved cards automatically appear on another device or browser.

## 10. Duplicate handling

Before saving, check likely duplicates using normalized email addresses and phone numbers.

Do not assume a country code merely to compare numbers.

If a likely duplicate exists:

* Show the matching record.
* Let users review it, save separately, or explicitly merge.
* Never overwrite or merge silently.
* Preserve distinct telephone numbers and emails.
* Ask which value to keep when fields conflict.

## 11. Contact file generation

Generate interoperable UTF-8 .vcf files using a deliberate, documented vCard version. Prefer vCard 3.0 for the initial implementation if it meets the tested compatibility requirements.

Follow the relevant specification for:

* Required properties
* Full name and structured name
* Organization and title
* Repeated telephone and email entries
* Website URLs
* Address
* Notes
* Escaping
* Line endings
* Folding long lines without splitting UTF-8 characters

Keep the original full name intact. Do not guess how to split it into given and family names.

Exclude photos by default to keep exported files small.

Sanitize filenames and handle Unicode names safely.

Use a suitable contact-file MIME type and provide a download fallback when sharing is unavailable.

Explain that the operating system controls importing into contacts; the web app cannot silently add contacts to the user’s address book.

Do not label a download as a successful contact import.

## 12. Sharing and QR codes

For file sharing:

* Detect support using the appropriate browser capability checks.
* Share the generated .vcf only after an explicit user action.
* Treat user cancellation as cancellation, not an error.
* Offer Download Contact when file sharing is unsupported.

Add an optional contact QR feature:

* Generate the QR locally.
* Encode selected contact details directly rather than a hosted profile URL.
* Let the user preview which details are included.
* Allow downloading the QR image.
* Handle excessive data gracefully.
* Explain that anyone who scans the code can read the included details.

Do not require a QR feature to complete the main scan-to-contact flow.

## 13. Local storage and backups

Use IndexedDB for cards and optional photos.

Define a versioned schema containing:

* Stable local ID
* Contact fields
* Created and updated timestamps
* Optional image references
* Optional OCR text
* Schema version

Use transactions for changes involving multiple records or images. Clean up orphaned images.

Implement:

1. Export all contacts as a multi-contact .vcf.
2. Export a versioned JSON backup for restoring the application collection.
3. Import the JSON backup with validation, preview, and duplicate handling.

Make it clear that VCF export is for contacts, while JSON backup restores application data.

Allow users to choose whether the backup contains retained images. Validate file sizes and embedded data before import. Treat imported text as untrusted.

Backups are unencrypted unless encryption is actually implemented. State that plainly before export.

Handle storage quota errors without pretending a save succeeded. Preserve the current editable form so users can still export their contact.

Request persistent storage only where appropriate and supported; do not promise the request will be granted.

Provide “Delete all local data” with explicit confirmation. Explain that this does not delete files already exported or shared.

## 14. Offline lifecycle and updates

Cache the application shell and all assets required for the selected OCR language.

Use local asset paths for OCR workers, WASM, models, fonts, and icons.

Implement robust handling for:

* First launch
* Partial downloads
* Interrupted language-pack downloads
* Offline launch
* Offline scanning
* Missing or evicted caches
* App updates
* Database migrations

Only declare a language pack ready after all its required assets are available.

Offer an “Update available” action. Do not force a reload while the user is editing or scanning.

Keep compatible cached assets until an update is safely activated. Avoid broad cache deletion that affects unrelated applications on the same origin.

## 15. Privacy and security

Treat photos, OCR output, imported backups, and all contact fields as untrusted input.

* Render extracted text as text, never executable HTML.
* Restrict clickable URLs to appropriate safe protocols.
* Do not automatically navigate to URLs found on a card.
* Avoid contact details in application URLs, console logs, error reports, or service-worker diagnostics.
* Do not include analytics or external error-reporting SDKs.
* Use a suitable Content Security Policy compatible with the selected local OCR implementation.
* Minimize network permissions and third-party dependencies.
* Document that same-origin code can access local data; local storage is not protection against a compromised application.
* Do not claim encryption or guaranteed permanence.

Include a readable privacy page covering local processing, storage, explicit export/sharing, deletion, browser-storage limits, and possible hosting access logs.

## 16. Accessibility and performance

Target WCAG 2.2 AA where practical.

Provide:

* Semantic structure
* Proper labels
* Keyboard navigation
* Visible focus
* Accessible dialogs
* Announced progress and errors
* Adequate contrast
* Reduced-motion support
* Comfortable touch targets
* Layouts that work with enlarged text

Lazy-load OCR when needed. Reuse workers where sensible and release them when appropriate.

Avoid freezing the page during image processing, OCR, exports, or large imports.

Provide actionable errors rather than raw exceptions.

## 17. Tests and acceptance criteria

Write meaningful automated tests for:

* Contact-field parsing
* Unicode preservation
* Phone-number normalization
* Duplicate detection
* vCard escaping and formatting
* Multi-contact export
* Backup validation and restore
* Schema migrations
* Storage failure handling
* Unsafe imported content

Use synthetic business cards and fictional contact details for fixtures. Never commit real personal information.

Browser tests must cover:

1. First launch and empty collection.
2. Manual contact creation.
3. Image selection and the review flow.
4. Local saving and persistence after reload.
5. Editing and deletion.
6. Contact download.
7. Sharing fallback.
8. Backup export and restore.
9. Offline launch after preparation.
10. A real OCR smoke test offline using bundled assets.
11. An unavailable language pack while offline.
12. OCR cancellation.
13. An update while unsaved edits exist.
14. No unexpected network requests during scanning and contact management.

Do not substitute mocked OCR for every test and claim real OCR is verified.

Include a manual compatibility checklist for:

* Safari on iPhone
* Chrome on Android
* Desktop Chrome, Firefox, and Safari
* Contact import on iOS and Android
* Installed PWA behavior
* Myanmar and mixed-language card accuracy

Clearly distinguish executed tests from checks that still need real devices.

## 18. Open-source repository

Prepare a public-ready repository containing:

* Complete source
* Lockfile
* README
* LICENSE
* CONTRIBUTING.md
* CODE_OF_CONDUCT.md
* SECURITY.md
* Privacy documentation
* Third-party notices
* Issue templates
* Pull-request template
* CI checks for lint, type checking, tests, and build
* Static-host deployment instructions

Use MIT as the proposed project license and confirm it is compatible with how dependencies and OCR assets are distributed. Preserve all required third-party notices. Make the copyright holder configurable if its legal identity is unconfirmed.

Documentation must explain:

* Product purpose and CSR intent
* Local development
* Production build
* OCR asset setup and distribution
* Offline preparation
* Local data storage
* Export and backup
* Accuracy limitations
* Supported and tested browsers
* Deployment under a subpath
* Contribution workflow

Do not publish a repository or deploy publicly unless explicitly authorized. Prepare everything needed for that step.

## 19. Implementation order

Work in these stages, continuing until the agreed scope is implemented:

1. Inspect the repository and verify technical assumptions.
2. Build the mobile-first home screen and manual contact flow.
3. Implement local storage, editing, deletion, and VCF export.
4. Implement image capture, preprocessing, and local OCR.
5. Implement review and field extraction.
6. Implement offline assets, language packs, and PWA behavior.
7. Add sharing, backups, duplicate handling, and QR export.
8. Complete accessibility, privacy, tests, and documentation.
9. Run the production build and inspect the finished interface.

Choose reasonable defaults instead of stopping for routine questions.

If an environment limitation prevents a feature or test, state the limitation precisely and implement the safest useful fallback. Do not represent a placeholder, mocked feature, or untested integration as complete.

## 20. Definition of done

The core product is complete when a user can:

Open the prepared app offline → photograph or select a card → extract text locally → correct the details → save locally → download or share a valid contact file.

A user must also be able to find saved cards, edit or delete them, export a backup, and restore that backup.

The final delivery must include:

* Working source code
* Setup and build commands
* Test results
* Privacy and offline verification results
* Deployment instructions
* Known limitations and outstanding real-device checks

Start implementation now.
