FROM node:26-alpine AS base

# All deps stage
FROM base AS deps
WORKDIR /app
# node-gyp build tools for native deps (better-sqlite3): no prebuilt binary
# ships for musl, and the alpine base image carries no toolchain.
RUN apk add --no-cache python3 make g++
ADD . .
RUN npm ci

# Production only deps stage
FROM base AS production-deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
ADD . .
RUN npm ci --omit=dev
# npm nests some production deps per workspace (apps/web/node_modules,
# packages/design-system/node_modules) instead of hoisting them to the root.
# Merge them into the root so the image ships one self-contained
# node_modules, mirroring how Node resolves from the app directory.
RUN for d in apps/web/node_modules packages/design-system/node_modules; do if [ -d "$d" ]; then cp -a "$d/." node_modules/; fi; done

# Build stage
FROM base AS build
WORKDIR /app
COPY --from=deps /app /app
ADD . .
RUN npm run build

# Production stage
FROM base
ENV NODE_ENV=production
WORKDIR /app/apps/web/build
RUN apk add --no-cache postgresql-client
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=build /app/apps/web/build .
EXPOSE 3333
CMD ["node", "bin/server.js"]
