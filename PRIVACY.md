# Privacy

**Your card photos and contact details stay on your device unless you choose to export or share them.**

## Processing and storage

Images are decoded and processed in your browser. OCR runs locally using self-hosted worker code, WebAssembly, and language models. The app has no card-processing backend, login, cloud OCR, analytics, tracking pixels, advertising, or external error reporting. It does not silently send an image elsewhere if recognition fails.

Saved contacts and any photos you explicitly retain are stored in this browser's IndexedDB. Photos are not retained by default. Interface preferences and downloaded offline assets are also stored locally. Browser storage is not encrypted by this app, is not guaranteed permanent, and is accessible to application code running on the same origin. A compromised app or device can put local information at risk.

## Network activity

When you load or update the app online, or prepare OCR assets, your browser requests static application resources from the hosting origin. Ordinary hosting access logs may record IP address, time, requested resource, and browser information. Hosting operators control those logs. Contact fields, OCR text, and card photos are not included in those requests. There are no runtime remote fonts, third-party CDN resources, or remote OCR APIs.

## Exports and sharing

Downloading VCF, JSON backup, or QR images creates files you control. These files are unencrypted and may contain personal information. A backup can include retained images if you choose that option. Sharing sends the selected file through your operating system's chosen destination, which has its own privacy practices. Anyone who sees or scans a contact QR can read its included details. Opening a website from a card is an explicit navigation to another site's privacy practices.

## Deletion and durability

You can delete individual saved records or delete all local data with confirmation. Clearing browser/site data also removes saved contacts and offline resources. Deletion does not remove files already downloaded, backed up, imported into contacts, or shared. Different browsers and devices have separate collections. Private-browsing sessions, browser eviction, device loss, and storage limits can remove data. Export a backup to keep a copy.

## Accuracy

OCR results and local field suggestions can be inaccurate. Review all contact details before saving or sharing. Myanmar recognition is experimental. This app does not guarantee contact correctness or successful import into a device's address book.
