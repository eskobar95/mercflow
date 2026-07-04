# MercFlow Medusa backend — monorepo production image (T027)
# Build context: repository root (see infra/docker-compose.yml)

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
# Medusa build reads medusa-config via loadEnv; production NODE_ENV breaks config load in Docker.
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ENV REDIS_URL=redis://127.0.0.1:6379
ENV JWT_SECRET=build-jwt-secret-min-32-chars-long
ENV COOKIE_SECRET=build-cookie-secret-min-32-chars
RUN pnpm build:medusa-fork && pnpm --filter @mercflow/backend build
# Production start runs from `.medusa/server` and expects config + app source alongside the build output
RUN test -d apps/backend/.medusa/server && \
    cp apps/backend/medusa-config.ts apps/backend/.medusa/server/medusa-config.ts && \
    cp -r apps/backend/src apps/backend/.medusa/server/src

FROM base AS runner
RUN apk add --no-cache wget
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app .
WORKDIR /app/apps/backend/.medusa/server
EXPOSE 9000
CMD ["sh", "-c", "/app/apps/backend/node_modules/.bin/medusa start"]
