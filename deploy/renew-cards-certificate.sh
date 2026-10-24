#!/bin/sh
# Certbot deploy hook: reload only for this site's renewed certificate.
set -eu
if [ "${RENEWED_LINEAGE:-}" = /etc/letsencrypt/live/cards.starrymm.com ]; then
    /usr/sbin/nginx -t
    /bin/systemctl reload nginx
fi
