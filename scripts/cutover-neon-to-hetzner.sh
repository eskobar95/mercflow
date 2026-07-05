#!/usr/bin/env bash
# Neon → Hetzner Postgres cutover helper.
# Run from an operator machine with Neon access and SSH to the app VPS.
#
# Prerequisites:
#   - bootstrap.sh completed on mercflow-db
#   - pg_dump/psql (brew install libpq)
#   - SSH key (default ~/Documents/hetzner_key)
#
# Usage:
#   export NEON_DATABASE_URL='postgresql://...neon...'
#   ./scripts/cutover-neon-to-hetzner.sh
#
# Optional jump host (when DB firewall allows SSH only from app VPS private IP):
#   export JUMP_HOST=root@46.225.226.143
#   export DB_SSH=root@10.0.0.2

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

APP_SERVER_PUBLIC_IP="${APP_SERVER_PUBLIC_IP:-46.225.226.143}"
DB_PRIVATE_IP="${DB_PRIVATE_IP:-10.0.0.2}"
SSH_KEY="${HETZNER_SSH_KEY:-$HOME/Documents/hetzner_key}"
JUMP_HOST="${JUMP_HOST:-root@${APP_SERVER_PUBLIC_IP}}"
DB_SSH="${DB_SSH:-root@${DB_PRIVATE_IP}}"
SSH_OPTS=(-i "$SSH_KEY" -o StrictHostKeyChecking=accept-new)

if [[ -z "${NEON_DATABASE_URL:-}" ]]; then
  echo "Set NEON_DATABASE_URL to your Neon connection string." >&2
  exit 1
fi

if [[ ! -f "$SSH_KEY" ]]; then
  echo "SSH key not found: $SSH_KEY" >&2
  exit 1
fi

for cmd in pg_dump psql ssh scp; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing command: $cmd (brew install libpq)" >&2
    exit 1
  fi
done

run_on_db() {
  ssh "${SSH_OPTS[@]}" "$JUMP_HOST" \
    "ssh -i /root/.ssh/hetzner_key -o StrictHostKeyChecking=accept-new ${DB_SSH} $(printf '%q' "$1")"
}

DUMP_FILE="mercflow-neon-final-$(date -u +%Y%m%d-%H%M%S).sql.gz"
DUMP_PATH="${REPO_ROOT}/${DUMP_FILE}"

echo "=== Step 1: pg_dump from Neon (PG18 client, no owner/ACL) ==="
if command -v pg_dump >/dev/null 2>&1 && pg_dump --version | grep -q "18\."; then
  pg_dump --no-owner --no-acl "$NEON_DATABASE_URL" | gzip > "$DUMP_PATH.raw.gz"
elif command -v docker >/dev/null 2>&1; then
  docker run --rm -e DATABASE_URL="$NEON_DATABASE_URL" postgres:18-alpine \
    sh -c 'pg_dump --no-owner --no-acl "$DATABASE_URL" | gzip' > "$DUMP_PATH.raw.gz"
else
  echo "Install PostgreSQL 18 client or Docker for pg_dump." >&2
  exit 1
fi

gunzip -c "$DUMP_PATH.raw.gz" | grep -v transaction_timeout | gzip > "$DUMP_PATH"
rm -f "$DUMP_PATH.raw.gz"
echo "Dump saved: $DUMP_PATH ($(du -h "$DUMP_PATH" | cut -f1))"

echo "=== Step 2: Copy dump to app server ==="
scp "${SSH_OPTS[@]}" "$DUMP_PATH" "${JUMP_HOST}:/tmp/${DUMP_FILE}"

echo "=== Step 3: Copy dump to DB server and restore ==="
ssh "${SSH_OPTS[@]}" "$JUMP_HOST" bash -s <<REMOTE
set -euo pipefail
scp -i /root/.ssh/hetzner_key /tmp/${DUMP_FILE} ${DB_SSH}:/tmp/${DUMP_FILE}
ssh -i /root/.ssh/hetzner_key ${DB_SSH} bash -s <<'DB'
set -euo pipefail
cd /opt/mercflow-db/infra/db
docker compose exec -T postgres psql -U mercflow_migration -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'mercflow' AND pid <> pg_backend_pid();"
docker compose exec -T postgres psql -U mercflow_migration -d postgres -c "DROP DATABASE IF EXISTS mercflow;"
docker compose exec -T postgres psql -U mercflow_migration -d postgres -c "CREATE DATABASE mercflow;"
gunzip -c /tmp/${DUMP_FILE} | docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U mercflow_migration -d mercflow
./setup-roles.sh
rm -f /tmp/${DUMP_FILE}
DB
rm -f /tmp/${DUMP_FILE}
REMOTE

rm -f "$DUMP_PATH"

echo "=== Step 4: Print app server env lines ==="
run_on_db 'source /opt/mercflow-db/infra/db/.env && cat <<EOF

Update /opt/mercflow/infra/.env on app server:

DATABASE_URL=postgresql://mercflow_app:${MERCFLOW_APP_PASSWORD}@'"${DB_PRIVATE_IP}"':5432/mercflow?sslmode=disable
PLATFORM_DATABASE_URL=postgresql://mercflow_owner:${MERCFLOW_OWNER_PASSWORD}@'"${DB_PRIVATE_IP}"':5432/mercflow?sslmode=disable

Then:
  cd /opt/mercflow
  docker compose -f infra/docker-compose.yml --env-file infra/.env restart medusa-backend medusa-worker
  curl -sf https://api.mercflow.shop/health

EOF'

echo "=== Done ==="
