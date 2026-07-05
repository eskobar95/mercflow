#!/usr/bin/env bash
# One-shot bootstrap for mercflow-db VPS.
# Run on the DB server as root (after git clone):
#
#   cd /opt/mercflow-db/infra/db
#   ./bootstrap.sh
#
# Starts Postgres only (no Object Storage backup). Use Hetzner Server Backup for disk snapshots.
# Enable backup profile later: docker compose --profile backup up -d

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v docker >/dev/null 2>&1; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
fi

if [[ ! -f .env ]]; then
  echo "Creating .env from .env.example with generated passwords..."
  cp .env.example .env
  MIGRATION_PW="$(openssl rand -hex 24)"
  APP_PW="$(openssl rand -hex 24)"
  OWNER_PW="$(openssl rand -hex 24)"
  sed -i "s/^POSTGRES_MIGRATION_PASSWORD=.*/POSTGRES_MIGRATION_PASSWORD=${MIGRATION_PW}/" .env
  sed -i "s/^MERCFLOW_APP_PASSWORD=.*/MERCFLOW_APP_PASSWORD=${APP_PW}/" .env
  sed -i "s/^MERCFLOW_OWNER_PASSWORD=.*/MERCFLOW_OWNER_PASSWORD=${OWNER_PW}/" .env
  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://mercflow_migration:${MIGRATION_PW}@postgres:5432/mercflow|" .env
  chmod 600 .env
  echo "Wrote infra/db/.env — save these credentials securely."
fi

# shellcheck disable=SC1091
source .env

DB_PRIVATE_IP="${DB_PRIVATE_IP:-10.0.0.2}"

echo "Starting Postgres (pgvector)..."
docker compose up -d postgres

echo "Waiting for Postgres to become healthy..."
for _ in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U mercflow_migration -d mercflow >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

./setup-roles.sh

cat <<EOF

============================================================
 mercflow-db bootstrap complete
============================================================

Postgres is listening on private IP: ${DB_PRIVATE_IP}:5432

Add to APP SERVER infra/.env:

DATABASE_URL=postgresql://mercflow_app:${MERCFLOW_APP_PASSWORD}@${DB_PRIVATE_IP}:5432/mercflow?sslmode=disable
PLATFORM_DATABASE_URL=postgresql://mercflow_owner:${MERCFLOW_OWNER_PASSWORD}@${DB_PRIVATE_IP}:5432/mercflow?sslmode=disable

Migration URL (operator only — never use in running Medusa):

postgresql://mercflow_migration:${POSTGRES_MIGRATION_PASSWORD}@${DB_PRIVATE_IP}:5432/mercflow?sslmode=disable

Next: ./scripts/cutover-neon-to-hetzner.sh (from operator machine with Neon + SSH access)
============================================================

EOF
