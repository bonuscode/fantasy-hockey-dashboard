# Next Steps - Prioritized TODO

## ~~Priority 1: Fix Token Storage~~ DONE

### ~~1.1 Persist tokens from OAuth callback~~ DONE
- Callback stores `access_token`, `refresh_token`, `token_expiry` in HTTP-only secure cookies
- Logout clears all token cookies

### ~~1.2 Update yahoo-api.ts to read tokens from cookies~~ DONE
- `getAuthTokens()` reads cookies, checks expiry (5-min buffer), auto-refreshes and updates cookies
- `getYahooClient()` uses `getAuthTokens()` instead of `process.env`; throws `AuthError` when unauthenticated

### ~~1.3 Add auth middleware/guard~~ DONE
- All API routes catch `AuthError` and return 401
- New `/api/auth/status` endpoint for frontend auth checking
- Home page shows live auth status with Connect/Disconnect button

## ~~Priority 2: Get First API Data Displaying~~ (IN PROGRESS)

### ~~2.1 Wire up standings page~~ DONE
- Client-side data fetching with TanStack Query (`useQuery` calling `/api/league/standings`)
- Standings table with sortable columns, rank colors (gold/silver/bronze), playoff/bubble indicators
- Adaptive: detects points vs category league, hides PF/PA/Streak when not available
- Mobile card layout below 768px
- Loading skeleton, error with retry, unauthenticated with login CTA, empty state

### 2.2 Wire up team dashboard (NEXT)
- Fetch team details and roster from `/api/teams/[teamId]` and `/api/teams/[teamId]/roster`
- Build roster table (Forwards, Defense, Goalies, Bench sections)
- Player stat display (G, A, PTS for skaters; W, GAA, SV% for goalies)

## Priority 3: Remaining Core Pages

### 3.1 Player stats & leaderboards
- Top scorers across all teams
- Position-specific filtering (C, LW, RW, D, G)
- Sortable columns
- Sparkline trends (recharts)

### 3.2 Weekly matchups
- Current week's head-to-head matchups
- Point totals comparison
- Roster comparison view

## Priority 4: Polish & Components

### 4.1 Build reusable components
- StatCard component (per frontend guidelines)
- PlayerTable with sorting
- Badges (position, streak, injury)
- Loading skeletons
- Empty states

### 4.2 Mobile responsive refinements
- Tables collapse to cards below 768px
- Test on actual mobile devices
- Bottom navigation option for mobile

### 4.3 Error handling
- Global error boundary
- API error states with retry buttons
- Offline/network error handling

## Priority 5: Deploy

### 5.1 Vercel setup
- Connect GitHub repo to Vercel
- Configure environment variables in Vercel dashboard
- Update `YAHOO_REDIRECT_URI` to production Vercel URL
- Add production redirect URI in Yahoo Developer app settings
- Test OAuth flow on production

### 5.2 Production caching
- Evaluate if file-based cache works on Vercel (serverless = ephemeral filesystem)
- May need to switch to Vercel KV or use Next.js built-in `revalidate`

## Backlog

- [ ] Light mode toggle
- [ ] Historical trends (points by week line charts)
- [ ] Transaction feed (recent adds/drops)
- [ ] Player detail pages (individual cards when clicked)
- [ ] Power rankings
- [ ] Strength of schedule visualization
