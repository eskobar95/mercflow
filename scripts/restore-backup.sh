#!/usr/bin/env bash
# Download and restore a MercFlow pg_dump backup from Hetzner Object Storage.
#
# Usage (required env vars documented below):
#   HETZNER_S3_* and migration DB credentials from infra/db/.env.example
#   export HETZNER_S3_ACCESS_KEY=...
#   export HETZNER_S3_SECRET_KEY=...
#   export HETZNER_S3_BUCKET=mercflow-backups
#   export HETZNER_S3_ENDPOINT=https://nbg1.your-objectstorage.com
#   ./scripts/restore-backup.sh 2026-07-04
#
# Restores the latest backup file matching the date prefix mercflow-backup-YYYY-MM-DD.

set -euo pipefail

DATE="${1:-}"
if [[ -z "${DATE}" ]]; then
  echo "Usage: restore-backup.sh YYYY-MM-DD" >&2
  exit 1
fi

if [[ ! "${DATE}" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
  echo "Date must be YYYY-MM-DD" >&2
  exit 1
fi

required_vars=(
  DATABASE_URL
  HETZNER_S3_ACCESS_KEY
  HETZNER_S3_SECRET_KEY
  HETZNER_S3_BUCKET
  HETZNER_S3_ENDPOINT
)

for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "Missing env: ${var}" >&2
    exit 1
  fi
done

REGION="${HETZNER_S3_REGION:-nbg1}"
RCLONE_REMOTE=":s3,provider=Other,env_auth=false,access_key_id=${HETZNER_S3_ACCESS_KEY},secret_access_key=${HETZNER_S3_SECRET_KEY},endpoint=${HETZNER_S3_ENDPOINT},region=${REGION}:${HETZNER_S3_BUCKET}/"
PREFIX="mercflow-backup-${DATE}"
SCRATCH="$(mktemp -d)"
trap 'rm -rf "${SCRATCH}"' EXIT

echo "Listing backups matching ${PREFIX}..."
mapfile -t MATCHING < <(rclone lsf "${RCLONE_REMOTE}" --include "${PREFIX}*.sql.gz" | sort)

if [[ ${#MATCHING[@]} -eq 0 ]]; then
  echo "No backup found for date ${DATE}" >&2
  exit 1
fi

FILE="${MATCHING[-1]}"
echo "Restoring ${FILE} to ${DATABASE_URL%%@*}@***..."

rclone copy "${RCLONE_REMOTE}${FILE}" "${SCRATCH}/"

echo "WARNING: This will load SQL into the target database. Press Ctrl+C within 5s to abort."
sleep 5

gunzip -c "${SCRATCH}/${FILE}" | psql "${DATABASE_URL}" -v ON_ERROR_STOP=1

echo "Restore complete from ${FILE}"
