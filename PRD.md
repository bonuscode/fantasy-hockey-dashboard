# Fantasy Hockey Dashboard - Product Requirements Document (PRD) V1

## Project Overview

A web-based analytics dashboard for my Yahoo Fantasy NHL league that provides enhanced stats, visualizations, and insights beyond what Yahoo's native interface offers. This project serves dual purposes:
1. Learn and experiment with the Yahoo Fantasy Sports API
2. Provide league members with a better viewing experience for stats and trends

The dashboard will be publicly accessible via Vercel, pulling live data from Yahoo's API.

## Project Goals

- [ ] Successfully integrate with Yahoo Fantasy Sports API (OAuth 1.0)
- [ ] Display real-time league standings and team performance
- [ ] Visualize player performance trends and statistics
- [ ] Create a modern, mobile-responsive interface
- [ ] Deploy to Vercel with automatic updates from GitHub
- [ ] Learn domain knowledge for future full-scale fantasy sports app

## Target Users

**Primary Users:** Members of my current Yahoo Fantasy NHL league (8 people)
- Mix of casual and serious fantasy players
- Various levels of technical proficiency
- Access primarily via mobile and desktop web browsers
- Want quick insights without navigating Yahoo's cluttered interface

**Secondary User:** Myself (developer/commissioner)
- Learning Yahoo API for future app development
- Testing points league concepts and data structures
- Building portfolio piece

## Core Features (MVP)

### 1. League Standings

**Priority:** HIGH

**Description:** 
Display current league standings with comprehensive team performance metrics.

**Requirements:**
- Team names with owner names
- Win-Loss-Tie records
- Total points scored (season cumulative)
- Points For (PF) and Points Against (PA)
- Current streak (W3, L2, etc.)
- Sortable by any column
- Visual indicators for playoff positions
- Responsive table that collapses to cards on mobile

**Data Source:** Yahoo League Standings API endpoint

**Update Frequency:** Daily (cached)

### 2. Team Dashboard

**Priority:** HIGH

**Description:**
Individual team view showing roster composition and recent performance.

**Requirements:**
- Full roster display (Forwards, Defense, Goalies, Bench)
- Current player stats (G, A, PTS for skaters; W, GAA, SV% for goalies)
- Player injury status indicators
- Recent transactions (adds/drops)
- Team point total breakdown by position
- Link back to Yahoo team page

**Data Source:** Yahoo Team Roster & Stats API

**Update Frequency:** Every 6 hours

### 3. Player Stats & Leaderboards

**Priority:** MEDIUM

**Description:**
League-wide player performance tracking and rankings.

**Requirements:**
- Top 10 scorers in the league (across all teams)
- Hot players (trending up over last 7 days)
- Cold players (trending down over last 7 days)
- Position-specific leaderboards (C, LW, RW, D, G)
- Sortable by different stat categories
- Sparkline charts showing recent performance trends
- Roster percentage (% of teams that own this player)

**Data Source:** Yahoo Player Stats API

**Update Frequency:** Daily, all player metrics hourly

### 4. Weekly Matchups

**Priority:** MEDIUM

**Description:**
Current week's head-to-head matchups with scoring comparisons.

**Requirements:**
- Display all matchups for current week
- Live/projected point totals for each team
- Head-to-head record between opponents
- Roster comparison (starting lineups)
- Games played count for the week
- Win probability indicator (based on current rosters)

**Data Source:** Yahoo Matchup & Scoreboard API

**Update Frequency:** Daily (not real-time for MVP)

### 5. Historical Trends (Nice-to-Have)

**Priority:** LOW

**Description:**
Season-long performance visualizations.

**Requirements:**
- Points scored by week (line chart)
- Win/Loss distribution
- Strength of schedule visualization
- Power rankings over time

**Data Source:** Historical scoreboard data

**Update Frequency:** Weekly

## Technical Requirements

### Technology Stack

**Frontend:**
- Framework: Next.js 14+ (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- Charts: Recharts
- State Management: TanStack Query (React Query)
- UI Components: Custom built with Tailwind (potential shadcn/ui if needed)

**Backend/API:**
- Next.js API Routes (serverless functions)
- Yahoo Fantasy Sports API integration
- OAuth 1.0 authentication handling

**Deployment:**
- Platform: Vercel
- Repository: GitHub
- CI/CD: Automatic deployments on push to main

### API Integration

**Yahoo Fantasy Sports API:**
- Authentication: OAuth 1.0
- Required Scopes: Read-only access to fantasy sports data
- Rate Limits: Monitor and respect Yahoo's limits (not publicly documented well)
- Caching Strategy: 
  - Standings: 24 hours
  - Player stats: 6 hours
  - Static data (team info): 7 days
  
**Data Caching:**
- Use Next.js built-in caching where possible
- Consider Redis or Vercel KV for production if needed
- File-based caching acceptable for MVP

### Performance Requirements

- Initial page load: < 3 seconds
- Time to interactive: < 2 seconds
- API response times: < 1 second
- Mobile responsive at all breakpoints (320px - 1920px)
- Lighthouse score: 90+ on Performance

### Browser Support

- Chrome (latest 2 versions)
- Safari (latest 2 versions)
- Firefox (latest 2 versions)
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

## Design Requirements

(See FRONTEND_GUIDELINES.md for detailed component specifications)

**Overall Aesthetic:**
- Dark mode primary (with light mode toggle as stretch goal)
- Modern, clean interface
- NHL team color accents where appropriate
- Card-based layouts for data grouping
- Minimal but effective data visualization

**Key Principles:**
- Mobile-first responsive design
- Clear visual hierarchy (most important stats prominent)
- Fast information scanning (good use of whitespace)
- Accessible (WCAG 2.1 AA minimum)

## Out of Scope (V1)

The following features are explicitly **NOT** included in V1:

- ❌ Trade analyzer or trade recommendation engine
- ❌ Push notifications or email alerts
- ❌ User accounts or authentication (publicly viewable)
- ❌ Custom scoring configurations
- ❌ Historical data from previous seasons
- ❌ Native mobile apps (iOS/Android)
- ❌ Real-time score updates (will update periodically)
- ❌ Fantasy football (NFL) - NHL only for MVP
- ❌ Draft tools or draft analysis
- ❌ Playoff bracket predictions
- ❌ Chat or social features
- ❌ Commissioner tools or league management

## Success Metrics

**User Engagement:**
- At least 50% of league members visit the dashboard weekly during season
- Average session duration > 2 minutes
- Return visitor rate > 60%

**Technical Performance:**
- Zero API authentication failures over a week
- Page load times consistently < 3 seconds
- No critical bugs reported by users
- 99% uptime (Vercel availability)

**Personal Learning Goals:**
- Understand Yahoo Fantasy API data structures thoroughly
- Build reusable React components for fantasy sports
- Gain experience with OAuth 1.0 implementation
- Validate points league concepts for future app

## Timeline & Milestones

**Week 1: Foundation & API Integration**
- Set up Next.js project with TypeScript
- Implement Yahoo OAuth 1.0 authentication
- Successfully fetch league standings data
- Deploy basic "Hello World" to Vercel

**Week 2: Core Data Display**
- Build standings table component
- Implement team dashboard view
- Add basic routing between pages
- Set up data caching strategy

**Week 3: Enhanced Features**
- Add player stats and leaderboards
- Implement matchup display
- Create data visualizations (charts)
- Mobile responsive refinements

**Week 4: Polish & Launch**
- Performance optimization
- Error handling and loading states
- Final design polish
- Share with league members for feedback

## Additional context

- [ ] **Real-time vs. Cached:** Is daily data refresh is sufficient however I expect more frequent updates during game timeframes
- [ ] **Historical Data:** Current season-to-date
- [ ] **Goalie Stats:** Collect all Goalie stats but the only weighted categories in this league is GAA, SV% W, SO
- [ ] **Mobile Navigation:** Hamburger design
- [ ] **Player Pages:** Individual players have dedicated page in their own card if clicked
- [ ] **League Customization:** Custom to just this single Yahoo league for this project

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Yahoo API rate limiting | High | Implement aggressive caching, monitor usage |
| OAuth complexity/bugs | High | Allocate extra time for auth, use proven libraries |
| Yahoo API changes | Medium | Build abstraction layer, monitor Yahoo dev forums |
| Slow data fetching | Medium | Implement loading states, consider ISR/SSG |
| Low user adoption | Low | Get early feedback, iterate on features |
| Vercel costs exceed free tier | Low | Monitor usage, optimize API calls |

## Future Considerations (Post-V1)

Features to consider after successful MVP launch:

- Multi-league support (view multiple Yahoo leagues)
- Trade analyzer with win probability
- Waiver wire recommendations
- Player injury news integration
- Fantasy football (NFL) support
- Historical season archives
- Custom alerts/notifications
- Deeper analytics (strength of schedule, consistency scores)

## Appendix

### Useful Resources

- Yahoo Fantasy Sports API Docs: https://developer.yahoo.com/fantasysports/guide/
- Next.js Documentation: https://nextjs.org/docs
- Vercel Deployment: https://vercel.com/docs

### Project Repository

- GitHub: [To be created]
- Vercel Dashboard: [To be linked after setup]

---

**Document Version:** 1.0  
**Last Updated:** February 6, 2026  
**Author:** Josh Bonus
**Status:** Draft - Ready for Development
