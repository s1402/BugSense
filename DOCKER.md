# Running BugSense with Docker

The entire stack — **MongoDB**, **Qdrant**, **back-end API**, and **front-end UI** — is containerised. You don't need Node.js, MongoDB, or Qdrant installed on your machine.

## Prerequisites

- [Git](https://git-scm.com)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (Windows / macOS / Linux)
- API keys (both have free tiers):
  - [Groq](https://console.groq.com) — for LLM analysis
  - [Google AI Studio](https://aistudio.google.com) — for Gemini embeddings

## Quick start

```bash
# 1. Clone the repo
git clone https://github.com/s1402/BugSense.git
cd BugSense

# 2. Create the env file (Windows: use `copy` instead of `cp`)
cp back-end/.env.example back-end/.env
```

Open `back-end/.env` and fill in:

```env
JWT_SECRET=any_long_random_string
GROQ_API_KEY=your_groq_key
GEMINI_API_KEY=your_gemini_key
```

The `MONGO_URI` and `QDRANT_URL` values in `.env` are ignored inside Docker — `docker-compose.yml` overrides them to point at the containerised databases.

```bash
# 3. Build images and start all services
docker-compose up --build

# 4. (First run only) seed sample users + bugs into the Docker MongoDB
docker-compose exec backend node src/scripts/seed.js
```

Open **http://localhost:5173** — the full app is running.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Your laptop (host)                       │
│                                                             │
│   Browser ──► localhost:5173 ──► frontend container (nginx) │
│                                                             │
│   ┌────────────────── Docker network ─────────────────┐     │
│   │                                                   │     │
│   │   frontend ──► backend:5000                       │     │
│   │   backend  ──► mongodb:27017                      │     │
│   │   backend  ──► qdrant:6333                        │     │
│   │                                                   │     │
│   └───────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

Inside Docker, services talk to each other by **service name** (e.g. `mongodb:27017`), not `localhost`. Your browser still uses `localhost` because the host maps ports through.

| Service | Image | Host port | Container port |
|---------|--------|-----------|----------------|
| frontend | Custom (nginx-based) | 5173 | 80 |
| backend | Custom (node:20-alpine) | 5000 | 5000 |
| mongodb | `mongo:7` | 27017 | 27017 |
| qdrant | `qdrant/qdrant:latest` | 6333 | 6333 |

## Dockerfile design

### Back-end — multi-stage Node build
`back-end/Dockerfile` has two stages:
1. **`deps`** — copies `package*.json` first (for layer caching), runs `npm ci`
2. **`runtime`** — fresh `node:20-alpine`, copies `node_modules` from stage 1 and the source code, runs as a **non-root user**

Final image size: ~150 MB.

### Front-end — build + serve split
`front-end/Dockerfile`:
1. **`builder`** — installs deps, runs `vite build` → produces `dist/`
2. **`runtime`** — `nginx:alpine`, serves `dist/` with an SPA-aware config (`try_files` fallback for React Router)

Node is fully stripped from the final image. Final size: ~50 MB.

### Cross-platform native binaries
Vite 7 and Tailwind v4 use native Rust binaries (`rollup`, `lightningcss`, `@tailwindcss/oxide`). `front-end/package.json` declares them in `optionalDependencies` for **all platforms** — Windows, macOS (x64/arm64), Linux gnu, Linux musl — so the lockfile works whether you build on your laptop, on GitHub Actions (Ubuntu/glibc), or inside Alpine (musl).

## Common commands

```bash
# Start (uses existing built images, fast)
docker-compose up

# Start in background (detached)
docker-compose up -d

# Rebuild after code changes
docker-compose up --build

# Stop (data persists in named volumes)
docker-compose down

# Stop AND wipe all MongoDB + Qdrant data
docker-compose down -v

# View logs for one service
docker-compose logs -f backend

# Open a shell inside a running container
docker-compose exec backend sh
docker-compose exec mongodb mongosh
```

## Inspecting data

### MongoDB
Use **MongoDB Compass** or any Mongo GUI — connect to `mongodb://localhost:27017`, database `bugsense`.

Or from the terminal:
```bash
docker-compose exec mongodb mongosh
> use bugsense
> db.users.find().pretty()
> db.bugs.find().pretty()
```

### Qdrant
Qdrant ships with a built-in dashboard: **http://localhost:6333/dashboard**

You can browse collections, inspect the 3072-dim vectors, and test similarity queries visually.

## Data persistence

Named Docker volumes store database data **outside** the containers:

| Volume | Contents |
|--------|----------|
| `mongo_data` | MongoDB databases |
| `qdrant_data` | Qdrant vector storage |

- `docker-compose down` — stops containers, **keeps** volumes (data safe)
- `docker-compose down -v` — stops containers **and deletes** volumes (full reset; re-run seed after this)

## Troubleshooting

**Port already in use**
Something else on your host is using 5173, 5000, 27017, or 6333. Either stop that process or edit the port mappings in `docker-compose.yml`.

**Backend can't connect to MongoDB / Qdrant**
Check `docker-compose logs backend`. The backend container uses service names (`mongodb`, `qdrant`) internally — these are set via the `environment:` block in `docker-compose.yml` and override values in `.env`.

**Empty database**
Fresh Docker volumes start empty. Run the seed script to populate sample users and bugs:
```bash
docker-compose exec backend node src/scripts/seed.js
```

**`Cannot find module @rollup/rollup-linux-x64-musl`**
This would mean the optional dependency for Alpine Linux isn't in the lockfile. Fixed already — if you ever hit this on a new native dep, add it to `front-end/package.json` under `optionalDependencies` and regenerate the lockfile.

## Local dev vs Docker — when to use each

| | `npm run dev` | `docker-compose up` |
|---|---|---|
| **Hot reload** | ✅ Instant | ❌ Needs rebuild |
| **Startup speed** | Fast | Slower |
| **Matches production** | ❌ | ✅ |
| **Needs Node installed** | Yes | No |
| **Use when** | Active coding | Sharing the project, testing prod-like behaviour, CI/CD |

Day-to-day: use `npm run dev` for coding, `docker-compose up` to verify the full stack still ships.
