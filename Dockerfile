# Single image that builds both apps and serves them from one origin.
# Multi-stage: install + build with dev deps, then run with the artifacts.

FROM node:20-slim AS build
WORKDIR /app
# OpenSSL is needed by Prisma's query engine.
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci

COPY . .
RUN npx prisma generate --schema apps/api/prisma/schema.prisma \
  && npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# node_modules carries the Prisma CLI (migrations), client, and engines.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
# The seed runs via tsx and imports pure domain helpers from src, so it ships too.
COPY --from=build /app/apps/api/src ./apps/api/src
COPY --from=build /app/apps/web/dist ./apps/web/dist
COPY docker-entrypoint.sh ./

# SQLite lives on a mounted volume so data survives restarts (absolute path).
ENV DATABASE_URL="file:/app/data/prod.db"
ENV WEB_DIST_PATH="/app/apps/web/dist"
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000

RUN chmod +x docker-entrypoint.sh
CMD ["./docker-entrypoint.sh"]
