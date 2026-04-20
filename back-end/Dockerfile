# ── Stage 1: install dependencies ────────────────────────────────────────────
# We use a full Node image here (not alpine) to compile any native addons.
# "AS deps" gives this stage a name so stage 2 can reference it.
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only package files first.
# Docker builds in layers — if package.json doesn't change, this layer
# is cached and npm ci is skipped on the next build. Huge time saver.
COPY package*.json ./

RUN npm ci

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
# Fresh minimal image — no build tools, no npm cache, nothing extra.
FROM node:20-alpine AS runtime

# Create a non-root user. Running as root inside a container is a security risk.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy installed node_modules from the deps stage (not from your host machine)
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Tell Docker this container listens on 5000 (documentation + tooling hint).
# It does NOT actually publish the port — that's docker-compose's job.
EXPOSE 5000

# Switch to non-root user before running the app
USER appuser

# Start the server
CMD ["node", "src/server.js"]
