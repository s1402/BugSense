# ── Stage 1: build ───────────────────────────────────────────────────────────
# We need Node + npm to install deps and run "vite build".
# This stage is ONLY used to produce the dist/ folder — it won't ship.
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

# --legacy-peer-deps: needed for @testing-library peer resolution
RUN npm ci --legacy-peer-deps

COPY . .

# VITE_API_URL is a build-time variable — Vite bakes it into the JS bundle.
# It must be the URL the *browser* uses to reach the API, not an internal name.
# We accept it as a Docker build argument with a sensible default.
ARG VITE_API_URL=http://localhost:5000
ARG VITE_SOCKET_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

RUN npm run build
# dist/ now contains: index.html + assets/*.js + assets/*.css

# ── Stage 2: serve ───────────────────────────────────────────────────────────
# Nginx is a battle-tested static file server. The final image is ~25 MB
# instead of ~300 MB if we had kept Node in the image.
FROM nginx:alpine AS runtime

# Remove the default nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy only the compiled output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our SPA-aware nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
