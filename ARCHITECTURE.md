# Architecture - Fantasy Hockey Dashboard

## Project Structure

```
fantasy-dashboard/
├── app/
│   ├── api/                          # Backend API routes (serverless)
│   │   ├── auth/
│   │   │   ├── callback/route.ts     # OAuth callback - exchanges code for tokens
│   │   │   ├── login/route.ts        # Redirects user to Yahoo OAuth
│   │   │   └── logout/route.ts       # Clears session, redirects home
│   │   ├── league/
│   │   │   ├── standings/route.ts    # GET league standings (6h cache)
│   │   │   └── settings/route.ts     # GET league settings (7d cache)
│   │   ├── teams/
│   │   │   └── [teamId]/
│   │   │       ├── route.ts          # GET team details (24h cache)
│   │   │       └── roster/route.ts   # GET team roster (6h cache)
│   │   ├── players/
│   │   │   └── stats/route.ts        # GET player leaderboards (6h cache)
│   │   └── matchups/
│   │       └── route.ts              # GET weekly matchups (6h cache)
│   ├── components/
│   │   ├── Navigation.tsx            # Header nav (desktop + mobile hamburger)
│   │   └── QueryProvider.tsx         # TanStack Query client provider
│   ├── standings/page.tsx            # Standings page (placeholder)
│   ├── players/page.tsx              # Players page (placeholder)
│   ├── matchups/page.tsx             # Matchups page (placeholder)
│   ├── teams/[teamId]/page.tsx       # Team detail page (placeholder)
│   ├── layout.tsx                    # Root layout: Inter font, dark theme, nav, providers
│   ├── page.tsx                      # Home: feature cards, API status indicator
│   └── globals.css                   # Design system: colors, fonts, spacing via @theme
├── lib/
│   ├── yahoo-api.ts                  # Yahoo Fantasy API client (yahoo-fantasy wrapper)
│   ├── cache.ts                      # File-based cache (read/write JSON to .cache/)
│   └── auth.ts                       # OAuth helpers: auth URL, token exchange, refresh
├── types/
│   └── yahoo-fantasy.d.ts            # TypeScript declarations for yahoo-fantasy package
├── public/                           # Static assets (currently empty)
├── .cert/                            # Local HTTPS certificates (gitignored)
│   ├── localhost.pem
│   └── localhost-key.pem
├── .env.local                        # Yahoo credentials, league ID, redirect URI
├── .gitignore
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
├── package.json
└── [documentation files]
```

## Key Files and Their Purposes

### `lib/yahoo-api.ts`
Yahoo Fantasy API client. Initializes the `yahoo-fantasy` npm package with credentials from env vars. Provides `getYahooClient()` to get an authenticated client and `getLeagueKey()` to build the league identifier (`nhl.l.{leagueId}`).

**Current limitation:** Reads access/refresh tokens from `process.env` — needs to read from session/cookies instead.

### `lib/auth.ts`
Three functions for OAuth 2.0:
- `getAuthorizationUrl()` — builds the Yahoo OAuth redirect URL
- `exchangeCodeForTokens(code)` — POSTs to Yahoo token endpoint with auth code
- `refreshAccessToken(refreshToken)` — POSTs to get a new access token

### `lib/cache.ts`
File-based caching to `.cache/` directory. `getCache(key)` returns cached data or null if expired. `setCache(key, value, ttlSeconds)` writes JSON with expiry timestamp. Cache directory is gitignored.

### `app/layout.tsx`
Root layout that wraps all pages. Sets up:
- Inter font via `next/font/google`
- `<html class="dark">` for dark mode
- `QueryProvider` (TanStack Query)
- `Navigation` component
- Main content area (max-width 1280px, responsive padding)

### `app/globals.css`
Design system defined using Tailwind v4 `@theme inline` blocks. Maps CSS custom properties to Tailwind utility classes (e.g., `bg-surface`, `text-text-secondary`, `text-accent-primary`).

## Data Flow

```
Yahoo Fantasy API
       ↓
  [OAuth 2.0 tokens]
       ↓
  lib/yahoo-api.ts (client)
       ↓
  app/api/*/route.ts (server-side, cached)
       ↓
  lib/cache.ts (.cache/ directory)
       ↓
  Frontend pages (TanStack Query → fetch /api/*)
       ↓
  React components (display)
```

## Tech Stack

| Layer        | Technology                  |
|--------------|-----------------------------|
| Framework    | Next.js 16.1.6 (App Router) |
| Language     | TypeScript 5                |
| Styling      | Tailwind CSS v4             |
| Charts       | Recharts 3.7               |
| Data Fetching| TanStack Query 5            |
| Yahoo API    | yahoo-fantasy 5.3           |
| Deployment   | Vercel (planned)            |
| HTTPS (dev)  | mkcert + --experimental-https|

## Current State

- **Infrastructure**: Complete — project builds, dev server runs with HTTPS
- **Auth flow**: Partial — redirects work, token persistence missing
- **API routes**: Scaffolded with caching — not functional until tokens are stored
- **Frontend**: Shell pages with navigation — no data display yet
