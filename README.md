# Fantasy Hockey Dashboard

A modern, web-based analytics dashboard for Yahoo Fantasy NHL leagues. Provides enhanced stats, visualizations, and insights beyond Yahoo's native interface.

## Overview

This project is a personal dashboard built to display real-time stats from my Yahoo Fantasy Hockey league. It integrates with the Yahoo Fantasy Sports API to pull league standings, team rosters, player stats, and weekly matchups.

**Tech Stack:**
- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS
- Yahoo Fantasy Sports API

## Features (MVP)

- 📊 **League Standings** - Real-time rankings with W-L-T records and points
- 👥 **Team Dashboards** - View rosters and team performance
- 📈 **Player Stats** - Leaderboards and performance trends
- 🆚 **Weekly Matchups** - Head-to-head comparisons

## Project Status

🚧 **In Development** - Currently setting up project structure and API integration

## Documentation

- [PRD.md](./PRD.md) - Product requirements and feature specifications
- [FRONTEND_GUIDELINES.md](./FRONTEND_GUIDELINES.md) - Design system and component specs
- [BACKEND_STRUCTURE.md](./BACKEND_STRUCTURE.md) - API integration guide

## Setup

**Prerequisites:**
- Node.js 18+
- Yahoo Developer App credentials
- Yahoo Fantasy Hockey league

**Installation:**
```bash
# Clone repository
git clone https://github.com/bonuscode/fantasy-hockey-dashboard.git
cd fantasy-hockey-dashboard

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Add your Yahoo API credentials to .env.local

# Run development server
npm run dev
```

Visit `http://localhost:3000`

## Environment Variables

Required in `.env.local`:
- `YAHOO_CLIENT_ID` - Yahoo Developer App Client ID
- `YAHOO_CLIENT_SECRET` - Yahoo Developer App Client Secret
- `YAHOO_LEAGUE_ID` - Your Yahoo Fantasy league ID
- `YAHOO_REDIRECT_URI` - OAuth callback URL

See `.env.example` for full template.

## License

Personal project - not licensed for public use.
