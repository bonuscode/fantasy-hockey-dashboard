# Next Steps - Prioritized TODO

## Priority 1: Fix Token Storage (Blocking Everything)

### 1.1 Persist tokens from OAuth callback
The callback route (`app/api/auth/callback/route.ts`) currently logs tokens to the console and redirects home. It needs to:
- Store `access_token`, `refresh_token`, and `expires_in` in HTTP-only cookies or server-side session
- Consider using `cookies()` from `next/headers` for simple cookie-based storage
- Tokens expire in 1 hour — must store expiry timestamp alongside

### 1.2 Update yahoo-api.ts to read tokens from cookies
`lib/yahoo-api.ts` currently reads tokens from `process.env`. Change `getYahooClient()` to:
- Read access token and refresh token from cookies/session
- Check if access token is expired
- Auto-refresh if expired using `lib/auth.ts` `refreshAccessToken()`
- Update stored tokens after refresh

### 1.3 Add auth middleware/guard
- API routes should check for valid tokens before calling Yahoo API
- Return 401 with redirect to `/api/auth/login` if no tokens present
- Frontend should detect 401 and show login prompt

## Priority 2: Get First API Data Displaying

### 2.1 Wire up standings page
- Add client-side data fetching with TanStack Query (`useQuery` calling `/api/league/standings`)
- Build the standings table component per FRONTEND_GUIDELINES.md specs
- Handle loading skeleton and error states
- Test with real Yahoo data

### 2.2 Wire up team dashboard
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
