#!/usr/bin/env bash
# Create MercFlow DB roles after Postgres is running.
# Run from infra/db/ with passwords in .env (never commit real values).
#
# Usage:
#   cp .env.example .env   # edit passwords
#   docker compose up -d postgres
#   ./setup-roles.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [[ ! -f .env ]]; then
  echo "Missing infra/db/.env — copy from .env.example and set passwords." >&2
  exit 1
fi

# shellcheck disable=SC1091
source .env

required_vars=(
  POSTGRES_MIGRATION_PASSWORD
  MERCFLOW_APP_PASSWORD
  MERCFLOW_OWNER_PASSWORD
)

for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "Set ${var} in infra/db/.env" >&2
    exit 1
  fi
done

PSQL=(docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U mercflow_migration -d mercflow)

echo "Creating roles (idempotent)..."

"${PSQL[@]}" <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'mercflow_app') THEN
    CREATE ROLE mercflow_app LOGIN PASSWORD '${MERCFLOW_APP_PASSWORD}' NOSUPERUSER NOBYPASSRLS;
  ELSE
    ALTER ROLE mercflow_app WITH PASSWORD '${MERCFLOW_APP_PASSWORD}' NOBYPASSRLS;
  END IF;

  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'mercflow_owner') THEN
    CREATE ROLE mercflow_owner LOGIN PASSWORD '${MERCFLOW_OWNER_PASSWORD}' NOSUPERUSER BYPASSRLS;
  ELSE
    ALTER ROLE mercflow_owner WITH PASSWORD '${MERCFLOW_OWNER_PASSWORD}' BYPASSRLS;
  END IF;
END
\$\$;

GRANT CONNECT ON DATABASE mercflow TO mercflow_app, mercflow_owner;
GRANT USAGE ON SCHEMA public TO mercflow_app, mercflow_owner;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO mercflow_app, mercflow_owner;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mercflow_app, mercflow_owner;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO mercflow_app, mercflow_owner;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO mercflow_app, mercflow_owner;
SQL

echo "Roles mercflow_app (NOBYPASSRLS) and mercflow_owner (BYPASSRLS) ready."
