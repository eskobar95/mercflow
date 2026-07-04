# MercFlow Medusa backend — monorepo production image (T027)
# Build context: repository root (see infra/docker-compose.yml)
#
# Runs from workspace source via tsx (medusa-fork uses workspace:* links).
# Compiled .medusa/server output is not used until medusa build supports workspace deps in Docker.

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages packages
COPY apps/backend/package.json apps/backend/
COPY apps/worker/package.json apps/worker/
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY apps/backend apps/backend
COPY apps/worker apps/worker
RUN pnpm build:medusa-fork

FROM base AS runner
RUN apk add --no-cache wget
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS=--import tsx
ENV NODE_PATH=/app/apps/backend/node_modules
COPY --from=build /app .
EXPOSE 9000
CMD ["pnpm", "--filter", "@mercflow/backend", "exec", "medusa", "start"]
