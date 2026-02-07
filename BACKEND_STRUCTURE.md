# Backend Structure & Yahoo Fantasy API Integration Guide

## Overview

This document outlines the backend architecture for integrating with the Yahoo Fantasy Sports API to power the Fantasy Hockey Dashboard. It includes authentication setup, API endpoints, data structures, caching strategy, and implementation details.

---

### 1. Yahoo Developer Account and client id and secret stored in .env.**

## Authentication Flow

Yahoo Fantasy API uses **OAuth 2.0** (three-legged authentication).

### OAuth 2.0 Flow Diagram

```
User                  Your App                Yahoo
 |                       |                       |
 |  1. Click "Login"     |                       |
 |--------------------->|                       |
 |                       |  2. Redirect to       |
 |                       |     Yahoo login       |
 |                       |---------------------->|
 |  3. Login & Authorize |                       |
 |<---------------------------------------------|
 |                       |  4. Redirect with     |
 |                       |     auth code         |
 |                       |<----------------------|
 |                       |  5. Exchange code     |
 |                       |     for access token  |
 |                       |---------------------->|
 |                       |  6. Return tokens     |
 |                       |<----------------------|
 |  7. Access granted    |                       |
 |<---------------------|                       |
```

### Implementation Steps

**Step 1: User clicks "Login with Yahoo"**
- Redirect to: `https://api.login.yahoo.com/oauth2/request_auth`
- Include parameters:
  - `client_id` - Your app's client ID
  - `redirect_uri` - Where Yahoo sends user after auth
  - `response_type=code`
  - `language=en-us`

**Step 2: Yahoo redirects back with authorization code**
- User is sent to: `http://localhost:3000/api/auth/callback?code=AUTH_CODE`

**Step 3: Exchange authorization code for access token**
- POST to: `https://api.login.yahoo.com/oauth2/get_token`
- Include:
  - `client_id`, `client_secret`
  - `redirect_uri`
  - `code` (the authorization code)
  - `grant_type=authorization_code`
- Response includes:
  - `access_token` - Use this for API requests (expires in 1 hour)
  - `refresh_token` - Use this to get new access tokens
  - `expires_in` - Token expiration time (3600 seconds)

**Step 4: Store tokens securely**
- For MVP: Store in session/cookies (server-side only)
- Production: Consider database storage with encryption

**Step 5: Refresh tokens when expired**
- POST to: `https://api.login.yahoo.com/oauth2/get_token`
- Include:
  - `client_id`, `client_secret`
  - `redirect_uri`
  - `refresh_token`
  - `grant_type=refresh_token`

### Recommended Library

Use the `yahoo-fantasy` npm package - it handles OAuth 2.0 for you:

```bash
npm install yahoo-fantasy
```

---

## Yahoo Fantasy API Structure

### Base URL

```
https://fantasysports.yahooapis.com/fantasy/v2/
```

### Resource Hierarchy

Yahoo's API uses a hierarchical structure:

```
Game (sport + season)
  └── League (your specific league)
       └── Teams (all teams in league)
            └── Roster (players on a team)
                 └── Players (individual player stats)
```

### Key Identifiers

**Game Key:** Format `{game_id}` (e.g., `nhl` for current NHL season, or specific like `427` for 2024-25 NHL)

**League Key:** Format `{game_id}.l.{league_id}` (e.g., `nhl.l.12345` or `427.l.12345`)

**Team Key:** Format `{league_key}.t.{team_id}` (e.g., `427.l.12345.t.1`)

**Player Key:** Format `{game_id}.p.{player_id}` (e.g., `427.p.8477934` for Connor McDavid)

---

## Core API Endpoints

### 1. League Information

**Get League Settings & Metadata**
```
GET /league/{league_key}
GET /league/{league_key}/settings
```

**Example:** `GET /league/nhl.l.12345`

**Response includes:**
- League name
- Number of teams
- Scoring type (head-to-head, roto, points)
- Draft status
- Current week
- Start/end dates
- Playoff settings

**Use case:** Display league name, check scoring type, get current week

---

### 2. League Standings

**Get Current Standings**
```
GET /league/{league_key}/standings
```

**Example:** `GET /league/nhl.l.12345/standings`

**Response includes for each team:**
- Team key, ID, name
- Manager name
- Win-Loss-Tie record
- Points For (total points scored)
- Points Against (opponent points)
- Rank
- Playoff eligibility
- Division (if applicable)

**Use case:** Main standings table on dashboard

---

### 3. Team Information

**Get All Teams in League**
```
GET /league/{league_key}/teams
```

**Get Specific Team Details**
```
GET /team/{team_key}
```

**Response includes:**
- Team name, logo
- Manager info
- Team stats (season totals)
- Waiver priority
- Number of moves/trades

**Use case:** Team dashboard, manager profiles

---

### 4. Team Roster

**Get Team Roster**
```
GET /team/{team_key}/roster
```

**Get Roster for Specific Week**
```
GET /team/{team_key}/roster;week={week_number}
```

**Response includes for each player:**
- Player key, ID, name
- Position (C, LW, RW, D, G)
- Eligible positions
- Selected position (active vs bench)
- Player stats

**Use case:** Display team rosters, lineup analysis

---

### 5. Player Stats

**Get Player Stats (Season)**
```
GET /player/{player_key}/stats
```

**Get Player Stats (Specific Week)**
```
GET /player/{player_key}/stats;type=week;week={week_number}
```

**Get Player Stats (Date Range)**
```
GET /player/{player_key}/stats;type=date;date={YYYY-MM-DD}
```

**Response includes:**
- Goals (G)
- Assists (A)
- Points (PTS)
- Plus/Minus (+/-)
- Shots on Goal (SOG)
- Powerplay Points (PPP)
- Shorthanded Points (SHP)
- Goalie stats: Wins, GAA, Save %, Shutouts

**Use case:** Player performance tracking, leaderboards

---

### 6. League Players (Free Agents & All Players)

**Get All Players in League**
```
GET /league/{league_key}/players
```

**Get Top Available Free Agents**
```
GET /league/{league_key}/players;status=A;count=25;start=0
```

**Filter by Position**
```
GET /league/{league_key}/players;position=C;status=A
```

**Search Players by Name**
```
GET /league/{league_key}/players;search={player_name}
```

**Response includes:**
- Player ownership percentage
- Availability status
- Position eligibility
- Player stats

**Use case:** Free agent lists, player search

---

### 7. Weekly Matchups

**Get Current Week Matchups**
```
GET /league/{league_key}/scoreboard
```

**Get Specific Week Matchups**
```
GET /league/{league_key}/scoreboard;week={week_number}
```

**Response includes:**
- All matchups for the week
- Team stats for each matchup
- Projected/actual scores
- Win probability (if available)
- Stat breakdown

**Use case:** Weekly matchup display, head-to-head comparisons

---

### 8. Transactions

**Get League Transactions**
```
GET /league/{league_key}/transactions
```

**Filter by Transaction Type**
```
GET /league/{league_key}/transactions;type=add,drop,trade
```

**Response includes:**
- Transaction type (add, drop, trade, waiver)
- Players involved
- Teams involved
- Timestamp
- Transaction status

**Use case:** Recent activity feed, waiver wire tracking

---

### 9. Draft Results

**Get Draft Picks**
```
GET /league/{league_key}/draftresults
```

**Response includes:**
- Pick number
- Round
- Team that drafted
- Player drafted
- Draft cost (if auction)

**Use case:** Draft recap, team building analysis

---

## Response Format

Yahoo API returns **XML** by default. You can request JSON by adding a header:

```javascript
headers: {
  'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
  'Accept': 'application/json'
}
```

However, `yahoo-fantasy` npm package automatically parses XML to JavaScript objects.

---

## Data Caching Strategy

To minimize API calls and improve performance:

### Caching Rules

| Data Type | Cache Duration | Rationale |
|-----------|---------------|-----------|
| League settings | 7 days | Rarely changes |
| Team info (names, logos) | 24 hours | Occasionally changes |
| Standings | 6 hours | Updates throughout day |
| Player stats (season) | 6 hours | Updates after games |
| Player stats (weekly) | 1 hour | Updates during active games |
| Rosters | 6 hours | Changes with lineup edits |
| Matchups | 6 hours | Updates as games finish |
| Transactions | 1 hour | Real-time important |

### Implementation Approach

**Option 1: Next.js Built-in Caching**
```javascript
// In Next.js API route or Server Component
export const revalidate = 3600; // Revalidate every hour
```

**Option 2: Manual Cache with File Storage**
```javascript
// /lib/cache.js
import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.cache');

export function getCache(key) {
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  if (!fs.existsSync(filePath)) return null;
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  if (Date.now() > data.expiry) {
    fs.unlinkSync(filePath);
    return null;
  }
  return data.value;
}

export function setCache(key, value, ttl) {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
  
  const filePath = path.join(CACHE_DIR, `${key}.json`);
  const data = {
    value,
    expiry: Date.now() + (ttl * 1000)
  };
  fs.writeFileSync(filePath, JSON.stringify(data));
}
```

**Option 3: Vercel KV (Production)**
If you upgrade to Vercel Pro, use Vercel KV for distributed caching.

---

## Backend Architecture

### Directory Structure

```
/app
  /api
    /auth
      /callback
        route.ts          # OAuth callback handler
      /login
        route.ts          # Initiate OAuth flow
      /logout
        route.ts          # Clear session
    /league
      /standings
        route.ts          # GET league standings
      /settings
        route.ts          # GET league info
    /teams
      /[teamId]
        route.ts          # GET team details
        /roster
          route.ts        # GET team roster
    /players
      /stats
        route.ts          # GET player leaderboards
    /matchups
      route.ts            # GET weekly matchups

/lib
  yahoo-api.ts            # Yahoo API client wrapper
  cache.ts                # Caching utilities
  auth.ts                 # Session management

/.cache                   # Local file cache (gitignored)
```

### Example API Route

**File: `/app/api/league/standings/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { getYahooClient } from '@/lib/yahoo-api';
import { getCache, setCache } from '@/lib/cache';

export async function GET(request: Request) {
  const cacheKey = 'league-standings';
  
  // Check cache first
  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }
  
  try {
    const yahooClient = await getYahooClient();
    const leagueKey = process.env.YAHOO_LEAGUE_ID;
    
    const standings = await yahooClient.league
      .standings(leagueKey)
      .get();
    
    // Cache for 6 hours
    setCache(cacheKey, standings, 6 * 60 * 60);
    
    return NextResponse.json(standings);
  } catch (error) {
    console.error('Error fetching standings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch standings' },
      { status: 500 }
    );
  }
}
```

---

## Yahoo Fantasy npm Package Usage

### Installation

```bash
npm install yahoo-fantasy
```

### Basic Setup

**File: `/lib/yahoo-api.ts`**

```typescript
import YahooFantasy from 'yahoo-fantasy';

let yahooClient: any = null;

export function initYahooClient() {
  if (!yahooClient) {
    yahooClient = new YahooFantasy(
      process.env.YAHOO_CLIENT_ID!,
      process.env.YAHOO_CLIENT_SECRET!,
      tokenCallback,
      process.env.YAHOO_REDIRECT_URI
    );
  }
  return yahooClient;
}

// Called when tokens are refreshed
function tokenCallback(error: any, token: any) {
  if (error) {
    console.error('Token refresh error:', error);
    return;
  }
  
  // Store new token (implement your storage logic)
  // For MVP, might just log or store in memory
  console.log('Token refreshed successfully');
}

export async function getYahooClient() {
  const client = initYahooClient();
  
  // Set user tokens (retrieve from session/database)
  // This is simplified - you'll need to implement token storage
  const accessToken = getUserAccessToken(); // Implement this
  const refreshToken = getUserRefreshToken(); // Implement this
  
  client.setUserToken(accessToken);
  client.setRefreshToken(refreshToken);
  
  return client;
}

// Placeholder functions - implement based on your auth strategy
function getUserAccessToken() {
  // Retrieve from session, cookie, or database
  return process.env.YAHOO_ACCESS_TOKEN || '';
}

function getUserRefreshToken() {
  // Retrieve from session, cookie, or database
  return process.env.YAHOO_REFRESH_TOKEN || '';
}
```

### Example API Calls

```typescript
// Get league standings
const standings = await yahooClient.league
  .standings('nhl.l.12345')
  .get();

// Get team roster
const roster = await yahooClient.team
  .roster('nhl.l.12345.t.1')
  .get();

// Get player stats for current week
const stats = await yahooClient.player
  .stats('nhl.p.8477934')
  .get();

// Get matchups for week 5
const matchups = await yahooClient.league
  .scoreboard('nhl.l.12345', 5)
  .get();

// Get league settings
const settings = await yahooClient.league
  .settings('nhl.l.12345')
  .get();
```

---

## Rate Limiting & Best Practices

### Yahoo API Limits

Yahoo doesn't publicly document strict rate limits, but general guidelines:

- **Recommended:** Max 1-2 requests per second
- **Best practice:** Cache aggressively
- **Avoid:** Polling for real-time updates (use reasonable refresh intervals)

### Error Handling

```typescript
try {
  const data = await yahooClient.league.standings(leagueKey).get();
  return data;
} catch (error: any) {
  if (error.message?.includes('token_expired')) {
    // Refresh token and retry
    await refreshUserToken();
    return await yahooClient.league.standings(leagueKey).get();
  }
  
  if (error.message?.includes('404')) {
    // League not found
    throw new Error('League not found');
  }
  
  // Generic error
  console.error('Yahoo API error:', error);
  throw error;
}
```

---

## Environment Variables Reference

Add these to `.env.local` (and `.env.example` for documentation):

```bash
# Yahoo Developer App Credentials
YAHOO_CLIENT_ID=your_client_id_here
YAHOO_CLIENT_SECRET=your_client_secret_here
YAHOO_REDIRECT_URI=http://localhost:3000/api/auth/callback

# League Configuration
YAHOO_LEAGUE_ID=12345
YAHOO_GAME_KEY=nhl

# Session Secret (generate a random string)
SESSION_SECRET=your_random_secret_here

# Optional: Pre-authenticated tokens for testing
# (Don't commit these - for local development only)
YAHOO_ACCESS_TOKEN=
YAHOO_REFRESH_TOKEN=
```

---

## Testing the Integration

### Manual Testing Steps

1. **Test OAuth Flow:**
   - Start dev server: `npm run dev`
   - Visit: `http://localhost:3000/api/auth/login`
   - Should redirect to Yahoo login
   - Authorize the app
   - Should redirect back to `/api/auth/callback`
   - Tokens should be stored

2. **Test API Endpoints:**
   ```bash
   # Get standings
   curl http://localhost:3000/api/league/standings
   
   # Get team roster
   curl http://localhost:3000/api/teams/1/roster
   ```

3. **Check Cache:**
   - Make same request twice
   - Second request should be instant (from cache)
   - Check `.cache/` directory for cached files

---

## Common Issues & Solutions

### Issue: "Token Expired" Error

**Solution:** Implement automatic token refresh using the refresh token.

### Issue: "Invalid Grant" on OAuth

**Solution:** 
- Check redirect URI matches exactly (including http vs https)
- Ensure client ID and secret are correct
- Try regenerating app credentials on Yahoo Developer site

### Issue: Empty or Malformed Responses

**Solution:**
- Add `Accept: application/json` header
- Use `yahoo-fantasy` package which handles XML parsing
- Log raw responses to debug

### Issue: CORS Errors

**Solution:**
- Make API calls server-side only (Next.js API routes)
- Never call Yahoo API directly from client/browser

---

## Security Checklist

- [ ] Client ID and secret stored in `.env.local` (NOT in code)
- [ ] `.env.local` added to `.gitignore`
- [ ] Tokens stored server-side only (never exposed to browser)
- [ ] OAuth redirect URI matches exactly in Yahoo Developer settings
- [ ] Session secret is random and secure
- [ ] Access tokens refreshed before expiration
- [ ] Error messages don't expose sensitive data

---

## Next Steps for Implementation

**Phase 1: Authentication Setup**
1. Create Yahoo Developer App
2. Set up OAuth routes (`/api/auth/login`, `/api/auth/callback`)
3. Test login flow manually
4. Implement token storage (session-based for MVP)

**Phase 2: API Integration**
1. Install `yahoo-fantasy` package
2. Create Yahoo API client wrapper (`/lib/yahoo-api.ts`)
3. Test basic endpoint (league standings)
4. Implement caching layer

**Phase 3: Build API Routes**
1. Create Next.js API routes for each feature
2. Map Yahoo data to your frontend needs
3. Add error handling and logging

**Phase 4: Frontend Integration**
1. Create React components that call your API routes
2. Handle loading and error states
3. Display data using FRONTEND_GUIDELINES.md design system

---

## Additional Resources

- **Yahoo Developer Network:** https://developer.yahoo.com/
- **Yahoo Fantasy API Docs:** https://developer.yahoo.com/fantasysports/guide/
- **yahoo-fantasy npm package:** https://www.npmjs.com/package/yahoo-fantasy
- **Package Docs:** https://yahoo-fantasy-node-docs.vercel.app/
- **OAuth 2.0 Spec:** https://oauth.net/2/

---

**Document Version:** 1.0  
**Last Updated:** February 7, 2026  
**Status:** Ready for Implementation
