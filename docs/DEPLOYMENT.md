# Production hosting

Public URL: https://cards.starrymm.com

The app is served as static files by Nginx over HTTPS. Photos, OCR and contacts remain in the browser; the server serves app/OCR files and may keep ordinary access logs. No backend database or private SSH key is part of this repository.

## Server layout

- Site configuration: `/etc/nginx/conf.d/cards.starrymm.com.conf` (source: `deploy/cards.nginx.conf`).
- Releases: `/var/www/starry-name-cards/releases/<release-id>/`.
- Active release symlink: `/var/www/starry-name-cards/current`.
- ACME webroot: `/var/www/starry-name-cards/acme`.
- Certificate: `/etc/letsencrypt/live/cards.starrymm.com/`.
- Renewal: existing Certbot timer, with the site-scoped hook in `deploy/renew-cards-certificate.sh` installed under `/etc/letsencrypt/renewal-hooks/deploy/`.

The first release is `20261024-1c26abf`. Existing sites have separate configurations and were not replaced.

## Deploy updates

Build locally with Node 22.12+ after installing dependencies and preparing OCR files:

```sh
npm ci
npm run setup:ocr
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run test:subpath
```

Upload the complete `dist/` directory to a **new** release directory using your authorized SSH access. Include all OCR files, notices, icons, manifests and the generated service worker. Never upload source credentials or private keys. Keep the current release active until upload and verification finish.

Switch the `current` symlink atomically using a temporary symlink and `mv -Tf`. Preserve the previous release for rollback; reverse the symlink change if needed. If changing Nginx, back up the site configuration, run `sudo nginx -t`, then reload it. No reload is needed solely for a release-symlink switch.

Validate HTTP-to-HTTPS redirection, the certificate, WASM MIME type, both OCR downloads, offline reload and real OCR with a fictional card. Activate the app's service-worker update after saving any draft. A new site origin has separate browser storage; use JSON backup/restore to move contacts from local previews.

## Certificate renewal

The certificate uses Certbot's webroot method, so keep `/.well-known/acme-challenge/` reachable on HTTP. The renewal hook checks Nginx configuration and reloads Nginx only when this site's certificate is renewed.

```sh
sudo certbot renew --cert-name cards.starrymm.com --dry-run --no-random-sleep-on-renew
systemctl is-active certbot.timer
```

## Caching

Hashed `/assets/` files are immutable. Other files use revalidation to support app and OCR updates. Missing asset requests return 404 rather than the application HTML. Hash routes need no server-side rewrite rules.
