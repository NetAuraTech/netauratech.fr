FROM node:24-alpine AS base

# All deps stage
FROM base AS deps
WORKDIR /app
ADD package.json package-lock.json ./
RUN npm ci

# Production only deps stage
FROM base AS production-deps
WORKDIR /app
ADD package.json package-lock.json ./
RUN npm ci --omit=dev

# Build stage
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
ADD . .
RUN npm run build

# Production stage
FROM base
ENV NODE_ENV=production
WORKDIR /app/build
RUN apk add --no-cache postgresql-client
COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=build /app/build .
EXPOSE 3333
CMD ["node", "bin/server.js"]

