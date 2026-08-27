# Toonymous

Anonymous, global social app where every posted image is automatically converted to a cartoon/caricature before storage or display. No real identity, no location, no regional grouping, no algorithmic feed.

**Status:** MVP phase (Phases 0-7 complete, see [specs/06-checklist.md](specs/06-checklist.md) for detailed breakdown).

## Quick Links

- [Product Vision & Design Pillars](specs/01-overview.md)
- [MVP Feature Scope](specs/02-features.md)
- [Functional & Non-Functional Requirements](specs/03-requirements.md)
- [Tech Stack & Conventions](specs/04-conventions.md)
- [UI Style Guide](specs/05-ui-styleguide.md)
- [Build Checklist](specs/06-checklist.md)

## Tech Stack

| Component | Stack | Port |
|-----------|-------|------|
| **Frontend** | Next.js (React + TypeScript) | 3080 |
| **Backend API** | Node.js + Express + Prisma | 3081 |
| **Cartoonizer** | Node.js + Express + Sharp | 3082 |
| **Primary Database** | PostgreSQL | 5432 |
| **Cache/Queue** | Redis | 6379 |
| **Job Queue** | BullMQ (backed by Redis) | - |

## Prerequisites

### System Requirements

- **Node.js** (v18+)
- **npm** or **yarn**
- **PostgreSQL** (v14+)
- **Redis** (v6+)

### macOS

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js (includes npm)
brew install node

# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Install Redis
brew install redis
brew services start redis
```

### Ubuntu/Debian

```bash
# Update package manager
sudo apt update && sudo apt upgrade -y

# Install Node.js (v18+)
sudo apt install -y nodejs npm

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Redis
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/amarxcoder/toonymous.git
cd toonymous
```

### 2. Install Root Dependencies

```bash
npm install
```

### 3. Set Up PostgreSQL Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE toonymous;
CREATE USER toonymous_user WITH PASSWORD 'your_secure_password';
ALTER ROLE toonymous_user SET client_encoding TO 'utf8';
ALTER ROLE toonymous_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE toonymous_user SET default_transaction_deferrable TO on;
ALTER ROLE toonymous_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE toonymous TO toonymous_user;
\q
```

Alternatively, on macOS with Homebrew PostgreSQL:

```bash
# Start PostgreSQL
brew services start postgresql@15

# Create database and user
createdb toonymous
psql -d toonymous -c "CREATE USER toonymous_user WITH PASSWORD 'your_secure_password';"
psql -d toonymous -c "ALTER ROLE toonymous_user SET client_encoding TO 'utf8';"
psql -d toonymous -c "ALTER ROLE toonymous_user SET default_transaction_isolation TO 'read committed';"
psql -d toonymous -c "ALTER ROLE toonymous_user SET default_transaction_deferrable TO on;"
psql -d toonymous -c "ALTER ROLE toonymous_user SET timezone TO 'UTC';"
psql -d toonymous -c "GRANT ALL PRIVILEGES ON DATABASE toonymous TO toonymous_user;"
```

### 4. Verify Redis is Running

```bash
redis-cli ping
# Should respond: PONG
```

### 5. Set Up Backend

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your database credentials and configuration
# Required variables:
# - DATABASE_URL=postgresql://toonymous_user:your_secure_password@localhost:5432/toonymous
# - REDIS_URL=redis://localhost:6379
# - JWT_SECRET=your_jwt_secret_key
# - SESSION_SECRET=your_session_secret_key

nano .env  # or your preferred editor

# Install dependencies
npm install

# Run database migrations
npm run prisma:migrate

# Seed database (optional)
npm run prisma:seed
```

### 6. Set Up Frontend

```bash
cd ../frontend

# Copy environment template
cp .env.example .env

# Edit .env with API endpoint
# Required variables:
# - NEXT_PUBLIC_API_URL=http://localhost:3081

nano .env

# Install dependencies
npm install
```

### 7. Set Up Cartoonizer Microservice

```bash
cd ../cartoonizer

# Copy environment template
cp .env.example .env

# Edit .env as needed
# By default, it uses Sharp (no additional installation needed)
# To use G'MIC instead: sudo apt install gmic (Linux only)

nano .env

# Install dependencies
npm install
```

## Running Locally

### Start All Services

Option A: Run each service in separate terminals

**Terminal 1 - Backend API:**
```bash
cd backend
npm run dev
# Backend running on http://localhost:3081
```

**Terminal 2 - Cartoonizer Microservice:**
```bash
cd cartoonizer
npm run dev
# Cartoonizer running on http://localhost:3082 (internal only)
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend running on http://localhost:3080
```

Option B: Use PM2 (production-like setup)

```bash
npm install -g pm2

# From project root
pm2 start ecosystem.config.js

# View logs
pm2 logs

# Monitor processes
pm2 monit
```

### Access the Application

- **Frontend:** http://localhost:3080
- **Backend API:** http://localhost:3081
- **Cartoonizer:** http://localhost:3082 (internal, not accessible from browser)

## Development Workflow

### Database Migrations

```bash
cd backend

# Create a new migration after schema changes
npm run prisma:migrate -- --name your_migration_name

# View migration status
npm run prisma:status
```

### Running Tests

```bash
# Backend tests
cd backend
npm run test

# Frontend tests
cd frontend
npm run test

# Load test (cartoonization queue)
cd backend
npm run loadtest:cartoonize
```

### Styling & UI

All UI components and styling follow [specs/05-ui-styleguide.md](specs/05-ui-styleguide.md).

- Color tokens (light + dark themes)
- Typography system
- Component patterns
- Accessibility guidelines

### Setting Admin/Moderation Roles

```bash
cd backend

# Grant moderator role
npm run set-role -- user@example.com moderator

# Grant compliance officer role
npm run set-role -- user@example.com complianceOfficer
```

## Project Structure

```
toonymous/
├── CLAUDE.md                    # Project guidelines & Karpathy-inspired principles
├── README.md                    # This file
├── ecosystem.config.js          # PM2 configuration for all services
├── specs/                       # Product & design specifications
│   ├── 01-overview.md          # Vision, pillars, open decisions
│   ├── 02-features.md          # MVP scope & non-goals
│   ├── 03-requirements.md      # Functional & non-functional requirements
│   ├── 04-conventions.md       # Tech stack & coding conventions
│   ├── 05-ui-styleguide.md    # UI/design system
│   └── 06-checklist.md         # Build progress tracker
├── frontend/                    # Next.js application
│   ├── src/
│   │   ├── app/                # Next.js app directory
│   │   ├── components/         # Reusable React components
│   │   ├── lib/
│   │   │   └── strings.ts      # All UI copy (externalized)
│   │   └── pages/              # Page components
│   ├── .env.example            # Environment variables template
│   └── package.json
├── backend/                     # Express API
│   ├── src/
│   │   ├── routes/             # API endpoints
│   │   ├── services/           # Business logic
│   │   ├── lib/
│   │   │   ├── safetyCheck.ts # CSAM/NSFW detection (stub, needs real vendor)
│   │   │   └── piiFilter.ts   # PII/identity text filtering
│   │   ├── workers/            # BullMQ job workers
│   │   └── prisma/             # Database schema & migrations
│   ├── .env.example            # Environment variables template
│   └── package.json
├── cartoonizer/                # Image cartoonization microservice
│   ├── src/
│   │   ├── providers/          # Swappable cartoonization engines
│   │   │   ├── sharp.ts       # Default (image filter)
│   │   │   ├── gmic.ts        # G'MIC CLI integration
│   │   │   └── api.ts         # HTTP passthrough for third-party APIs
│   │   └── routes/
│   ├── .env.example            # Environment variables template
│   └── package.json
└── DOCS/                        # Additional documentation
```

## Key Architecture Notes

### Image Pipeline

1. User uploads image
2. EXIF metadata stripped
3. Safety pre-check (CSAM/NSFW detection)
4. Async cartoonization via BullMQ queue
5. Original image deleted (never persists)
6. Cartoonized image stored locally (dev) or S3 (prod)
7. Served via CDN-style path

### Cartoonization Engine

Configurable via `CARTOONIZE_PROVIDER` environment variable:

- **`sharp`** (default): Image filter (smooth + saturate + edge outline)
- **`gmic`**: G'MIC CLI cartoon filter (requires `sudo apt install gmic`)
- **`api`**: HTTP passthrough to local model server or hosted API

### Privacy & Anonymity

**Non-negotiable pillars (see [specs/01-overview.md](specs/01-overview.md)):**

- No real identity — system-generated anonymous handles only
- No location tracking — no coordinates, no IP-based geolocation, no regional feeds
- No algorithmic ranking — chronological or randomized feeds only
- Strict PII filtering on captions and comments
- All identifiable metadata stripped from images

## Troubleshooting

### Database Connection Failed

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Verify connection
psql -U toonymous_user -d toonymous -h localhost

# Check DATABASE_URL in backend/.env
```

### Redis Connection Failed

```bash
# Check Redis status
redis-cli ping

# On macOS with Homebrew
brew services restart redis
```

### Port Already in Use

```bash
# Find process using port 3080/3081/3082
lsof -i :3080
lsof -i :3081
lsof -i :3082

# Kill the process if needed (replace PID)
kill -9 <PID>
```

### Cartoonization Queue Stuck

```bash
# Clear Redis (dev only)
cd backend
npm run redis:flush
```

## Deployment

See [specs/04-conventions.md](specs/04-conventions.md) for production deployment details.

Standard pipeline:
1. Deploy to bare VPS (no Docker)
2. `git pull` + `npm install` in changed workspaces
3. Apply database migrations
4. Build frontend
5. Restart services via PM2

## Known Limitations (MVP)

- **Safety detection is a stub** — always returns "safe". Replace with real CSAM/NSFW vendor before any real (non-test) image upload.
- **Rate limiting keys on IP only** — no device fingerprinting yet.
- **Ban enforcement delay** — banned users' existing JWT access tokens remain valid until expiry (~15 minutes).
- **Role assignment manual** — `npm run set-role -- <email> <role>` only; no self-service or API path.
- **No CI/test suite** — local dev and manual testing only.

## Contributing

See [CLAUDE.md](CLAUDE.md) for project philosophy and engineering guidelines (Karpathy-inspired principles for understanding the full system, favoring simplicity, deleting aggressively, staying full-stack literate).

**Before any significant feature or UI work:** re-read the relevant spec file — this app has hard product constraints around anonymity, location, and feed ranking that are easy to accidentally violate.

## License

[Add your license here]

## Questions?

See the specs directory for detailed documentation. Project is designed around explicit constraints and open decisions — check [specs/01-overview.md](specs/01-overview.md) for product pillars and design decisions before proposing changes.
