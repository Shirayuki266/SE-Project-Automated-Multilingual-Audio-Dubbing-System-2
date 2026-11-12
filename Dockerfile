# Multi-stage production Dockerfile for Vietnam Quoc Tu Multilingual Audio Guide
FROM node:22-slim AS builder

WORKDIR /app

# Install Python 3 required for spatial microservice and unit tests
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build
RUN npm test

# Production Runtime
FROM node:22-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install curl for healthcheck and python3 for spatial AI microservice
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl python3 \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/python ./python

# Non-root secure execution
USER node
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["./node_modules/.bin/tsx", "server.ts"]
