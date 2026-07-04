#!/bin/sh
# Daily PostgreSQL backup — pg_dump → gzip → Hetzner Object Storage.
# Invoked by cron in the backup container (infra/db/docker-compose.yml).

set -eu

TIMESTAMP="$(date -u +%Y-%m-%d-%H%M%S)"
FILENAME="mercflow-backup-${TIMESTAMP}.sql.gz"
SCRATCH="/tmp/backup/${FILENAME}"

required() {
  if [ -z "$(eval "printf '%s' \"\${$1:-}\"")" ]; then
    echo "Missing required env: $1" >&2
    exit 1
  fi
}

for var in DATABASE_URL HETZNER_S3_ACCESS_KEY HETZNER_S3_SECRET_KEY HETZNER_S3_BUCKET HETZNER_S3_ENDPOINT; do
  required "$var"
done

RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
REGION="${HETZNER_S3_REGION:-nbg1}"

mkdir -p /tmp/backup

echo "[backup] Starting pg_dump at ${TIMESTAMP}..."
pg_dump "${DATABASE_URL}" | gzip > "${SCRATCH}"

echo "[backup] Uploading ${FILENAME} to s3://${HETZNER_S3_BUCKET}/..."
rclone copy "${SCRATCH}" ":s3,provider=Other,env_auth=false,access_key_id=${HETZNER_S3_ACCESS_KEY},secret_access_key=${HETZNER_S3_SECRET_KEY},endpoint=${HETZNER_S3_ENDPOINT},region=${REGION}:${HETZNER_S3_BUCKET}/"

rm -f "${SCRATCH}"

if [ "${RETENTION_DAYS}" -gt 0 ] 2>/dev/null; then
  echo "[backup] Pruning backups older than ${RETENTION_DAYS} days..."
  rclone delete ":s3,provider=Other,env_auth=false,access_key_id=${HETZNER_S3_ACCESS_KEY},secret_access_key=${HETZNER_S3_SECRET_KEY},endpoint=${HETZNER_S3_ENDPOINT},region=${REGION}:${HETZNER_S3_BUCKET}/" \
    --min-age "${RETENTION_DAYS}d" \
    --include "mercflow-backup-*.sql.gz" || true
fi

echo "[backup] Done: ${FILENAME}"
