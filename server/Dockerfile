# build from the repo root: docker build -f server/Dockerfile .
FROM oven/bun:1.3-slim AS build

WORKDIR /app
# bun build inlines NODE_ENV, so the production-only checks must see it here
ENV NODE_ENV=production

COPY package.json bun.lock bunfig.toml ./
COPY mobile/package.json mobile/
COPY packages/protocol/package.json packages/protocol/
COPY server/package.json server/
RUN bun install --frozen-lockfile

COPY packages/protocol packages/protocol
COPY server server
# entries land two levels under server/, like src/<dir>/, so import.meta.dir paths still resolve
RUN bun build server/src/index.ts server/src/db/migrate.ts --target bun --root server/src --outdir server/dist/app

FROM oven/bun:1.3-slim

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/server/dist server/dist
COPY server/drizzle server/drizzle
COPY server/taste server/taste
# profile cards land in ../temporary relative to server/
RUN mkdir temporary && chown bun temporary

USER bun
WORKDIR /app/server
EXPOSE 3000
HEALTHCHECK CMD bun -e "fetch('http://localhost:3000/health').then((r) => process.exit(r.ok ? 0 : 1))"
CMD ["sh", "-c", "bun dist/app/db/migrate.js && exec bun dist/app/index.js"]
