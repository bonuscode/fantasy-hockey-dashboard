# Session Notes - February 7, 2026

## What We Built

### Project Initialization
- Scaffolded Next.js 16.1.6 project with TypeScript, Tailwind CSS v4, ESLint, and App Router
- Installed core dependencies: recharts, @tanstack/react-query, yahoo-fantasy
- Fixed package name from temp scaffold name to `fantasy-dashboard`

### Design System (Tailwind v4)
- Configured full dark theme in `globals.css` using CSS `@theme inline` blocks
- Colors: background (#0f1419), surface (#1a1f2e), surface-elevated (#252d3d), border (#2d3748)
- Text: primary (#f7fafc), secondary (#a0aec0), muted (#718096)
- Accents: primary (blue), success (green), warning (amber), danger (red), info (cyan)
- Fonts: Inter (primary sans), SF Mono (stats/numbers)
- Custom scrollbar styling for dark theme

### OAuth & Yahoo API Integration
- Created OAuth 2.0 flow: login route redirects to Yahoo, callback exchanges code for tokens
- Built Yahoo API client wrapper (`lib/yahoo-api.ts`) using `yahoo-fantasy` npm package
- Built auth helpers (`lib/auth.ts`) for token exchange and refresh
- File-based caching layer (`lib/cache.ts`) with configurable TTL

### API Routes (All with caching)
- `POST /api/auth/login` - Initiates Yahoo OAuth flow
- `GET /api/auth/callback` - Handles OAuth redirect, exchanges code for tokens
- `GET /api/auth/logout` - Clears session
- `GET /api/league/standings` - League standings (6h cache)
- `GET /api/league/settings` - League config (7d cache)
- `GET /api/teams/[teamId]` - Team details (24h cache)
- `GET /api/teams/[teamId]/roster` - Team roster (6h cache)
- `GET /api/players/stats` - Player leaderboards (6h cache)
- `GET /api/matchups` - Weekly matchups (6h cache)

### Frontend Pages
- Home page with feature cards and API connection status
- Standings, Players, Matchups placeholder pages
- Dynamic team page (`/teams/[teamId]`)
- Navigation component with desktop horizontal nav + mobile hamburger menu
- TanStack Query provider wrapping the app

### HTTPS Setup
- Configured `--experimental-https` with mkcert certificates at `.cert/`
- Dev server runs at `https://localhost:3000`
- Required because Yahoo OAuth mandates HTTPS redirect URIs

## What's Working
- Project builds and runs successfully (`npm run build` passes)
- HTTPS dev server starts and serves pages
- Yahoo OAuth login flow redirects to Yahoo and back successfully
- Navigation between pages works
- Dark theme renders correctly

## What's NOT Working
- **Token storage**: After OAuth callback, tokens are only logged to console — not persisted anywhere
- **API data**: No Yahoo API data displays on any page because tokens aren't being stored/used
- **Frontend data fetching**: Pages are placeholder shells with no actual API calls from the client

## Key Decisions Made
- Tailwind v4 CSS-based config (not `tailwind.config.js`)
- File-based caching for MVP (not Redis/Vercel KV)
- OAuth tokens stored in env vars for now (needs session/cookie solution)
- No `src/` directory — app and lib at project root
- TypeScript declaration file for untyped `yahoo-fantasy` package
