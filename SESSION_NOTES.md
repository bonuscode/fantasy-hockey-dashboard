# Session Notes

## Session 3 - February 8, 2026

### Standings Page (Priority 2.1 — Complete)

#### Data Fetching
- `app/standings/page.tsx` — converted from placeholder to full client component
- `useQuery` calls `/api/league/standings`, checks for 401 to show unauthenticated state
- `normalizeStandings()` transforms raw Yahoo API response into typed `TeamStanding[]`

#### Yahoo API Response Discovery
- The `yahoo-fantasy` package returns per-team standings under `team.standings` (not `team.team_standings` as initially assumed)
- League is head-to-head categories — no `points_for`, `points_against`, or `streak` fields
- Response includes: `rank`, `playoff_seed`, `outcome_totals` (wins/losses/ties/percentage)
- Team logos available at `team.team_logos[0].url`

#### Standings Table
- Sortable columns: Rank, Team, W-L-T, PCT (click to toggle asc/desc)
- Rank colors: gold (#1), silver (#2), bronze (#3)
- Playoff indicators: green left border for playoff spots (1-6), cyan for bubble teams (7-8)
- Visual playoff cutoff line between last playoff spot and first non-playoff team
- Team names link to `/teams/[teamId]`, show logo + manager name
- All stat numbers use monospace font

#### Adaptive League Type Detection
- Auto-detects points league vs category league by checking if any team has `pointsFor > 0`
- Points leagues: shows PF, PA, Streak columns
- Category leagues (like BrewZoo): hides PF/PA/Streak, shows cleaner Rank/Team/Record/PCT table
- Mobile cards adapt grid columns based on league type

#### States Implemented
- **Loading**: Shimmer skeleton matching table layout
- **Unauthenticated (401)**: User icon, "Not Connected" message, "Connect Yahoo" CTA
- **Error**: Warning icon, error message, "Retry" button (calls `refetch()`)
- **Empty**: Clipboard icon, "No Standings Available" message
- **Mobile (< 768px)**: Cards replace table with rank, logo, team info, stat grid

### What's Working Now
- Everything from Session 2, plus:
- Standings page displays live Yahoo Fantasy data
- All 8 teams in BrewZoo league rendering with logos, manager names, W-L-T records
- Sorting works across all columns
- Responsive: table on desktop, cards on mobile

### What's Next
- Wire up team dashboard with roster display (Priority 2.2)
- Wire up matchups page (Priority 3.2)

---

## Session 2 - February 7, 2026

### Token Storage & Auth Pipeline (Priority 1 — Complete)

#### 1.1 Token Persistence
- `app/api/auth/callback/route.ts` — stores `access_token`, `refresh_token`, and computed `token_expiry` in HTTP-only, secure, SameSite=lax cookies after OAuth code exchange
- Access token cookie expires with Yahoo's TTL; refresh token persists 30 days
- `app/api/auth/logout/route.ts` — deletes all three token cookies on logout

#### 1.2 Cookie-Based Yahoo Client
- `lib/auth.ts` — added `getAuthTokens()` function that reads tokens from cookies, checks expiry with 5-minute buffer, and auto-refreshes expired tokens (updating cookies with new values)
- Added `AuthError` class for typed error handling
- `lib/yahoo-api.ts` — `getYahooClient()` now calls `getAuthTokens()` instead of reading from `process.env`; throws `AuthError` when no valid tokens exist

#### 1.3 Auth Guards & Status
- All 6 data API routes updated to catch `AuthError` and return `401 { error: "Not authenticated" }`
- New `app/api/auth/status/route.ts` endpoint — returns `{ authenticated: true/false }` by checking cookie presence
- `app/page.tsx` — now a client component that queries `/api/auth/status` via TanStack Query; shows live connection indicator (green/red) with "Connect Yahoo" / "Disconnect" button

### What's Working Now
- Full OAuth flow: login → Yahoo → callback → tokens stored in cookies → redirect home
- Auth status endpoint for frontend polling
- Token auto-refresh when expired (transparent to API routes)
- All API routes properly gate behind authentication (401 when not logged in)
- Home page dynamically reflects auth state

### What's Next
- Wire up standings page with real data (Priority 2.1)
- Wire up team dashboard with roster display (Priority 2.2)

---

## Session 1 - February 7, 2026

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

### What Was Working
- Project builds and runs successfully (`npm run build` passes)
- HTTPS dev server starts and serves pages
- Yahoo OAuth login flow redirects to Yahoo and back successfully
- Navigation between pages works
- Dark theme renders correctly

### What Was NOT Working (resolved in Session 2)
- **Token storage**: After OAuth callback, tokens were only logged to console
- **API data**: No Yahoo API data displayed because tokens weren't stored/used
- **Frontend data fetching**: Pages were placeholder shells with no actual API calls

### Key Decisions Made
- Tailwind v4 CSS-based config (not `tailwind.config.js`)
- File-based caching for MVP (not Redis/Vercel KV)
- No `src/` directory — app and lib at project root
- TypeScript declaration file for untyped `yahoo-fantasy` package
