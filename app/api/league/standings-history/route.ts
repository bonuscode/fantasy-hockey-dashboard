import { NextResponse } from "next/server";
import { getYahooClient, getLeagueKey } from "@/lib/yahoo-api";
import { getCache, setCache } from "@/lib/cache";
import { AuthError } from "@/lib/auth";

interface TeamInfo {
  teamKey: string;
  name: string;
}

interface TeamRecord {
  wins: number;
  losses: number;
  ties: number;
}

interface WeekStandings {
  week: number;
  records: Record<string, TeamRecord>;
}

interface StandingsHistoryResponse {
  currentWeek: number;
  teams: TeamInfo[];
  weeklyStandings: WeekStandings[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractCurrentWeek(raw: any): number {
  const scoreboard =
    raw?.scoreboard ||
    raw?.league?.scoreboard ||
    raw?.fantasy_content?.league?.scoreboard ||
    raw;
  return Number(scoreboard?.week || raw?.week || 0);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTeamsFromStandings(raw: any): TeamInfo[] {
  let teams: unknown[] = [];

  if (Array.isArray(raw)) {
    teams = raw;
  } else if (raw?.standings) {
    teams = Array.isArray(raw.standings) ? raw.standings : [];
  } else if (raw?.league?.standings) {
    teams = Array.isArray(raw.league.standings) ? raw.league.standings : [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return teams.map((t: any) => ({
    teamKey: String(t?.team_key || t?.teamKey || ""),
    name: String(t?.name || "Unknown Team"),
  }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractMatchupOutcomes(raw: any): { winnerKey: string | null; loserKey: string | null; isTie: boolean }[] {
  const scoreboard =
    raw?.scoreboard || raw?.league?.scoreboard || raw;

  let rawMatchups: unknown[] = [];
  if (scoreboard?.matchups) {
    rawMatchups = Array.isArray(scoreboard.matchups)
      ? scoreboard.matchups
      : Object.values(scoreboard.matchups).filter((v) => typeof v === "object");
  }

  const outcomes: { winnerKey: string | null; loserKey: string | null; isTie: boolean }[] = [];

  for (const m of rawMatchups) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matchup = (m as any)?.matchup || m;
    const rawTeams = matchup?.teams || matchup?.matchup_teams || [];
    const teamsArr = Array.isArray(rawTeams)
      ? rawTeams
      : Object.values(rawTeams).filter((v) => typeof v === "object");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const teamKeys = teamsArr.map((t: any) => {
      const team = t?.team || t;
      return String(team?.team_key || team?.teamKey || "");
    });

    if (teamKeys.length < 2) continue;

    const rawWinners = matchup?.stat_winners || matchup?.statWinners || [];
    let team1CatWins = 0;
    let team2CatWins = 0;

    for (const sw of Array.isArray(rawWinners) ? rawWinners : []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const winner = (sw as any)?.stat_winner || sw;
      const isTied = winner?.is_tied === "1" || winner?.is_tied === 1;
      if (isTied) continue;
      const winnerKey = winner?.winner_team_key || winner?.winnerTeamKey || null;
      if (winnerKey === teamKeys[0]) team1CatWins++;
      else if (winnerKey === teamKeys[1]) team2CatWins++;
    }

    if (team1CatWins > team2CatWins) {
      outcomes.push({ winnerKey: teamKeys[0], loserKey: teamKeys[1], isTie: false });
    } else if (team2CatWins > team1CatWins) {
      outcomes.push({ winnerKey: teamKeys[1], loserKey: teamKeys[0], isTie: false });
    } else {
      outcomes.push({ winnerKey: teamKeys[0], loserKey: teamKeys[1], isTie: true });
    }
  }

  return outcomes;
}

export async function GET() {
  const cacheKey = "standings-history";

  const cached = getCache<StandingsHistoryResponse>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const client = await getYahooClient();
    const leagueKey = getLeagueKey();

    // Get current week
    const scoreboardRaw = await client.league.scoreboard(leagueKey);
    const currentWeek = extractCurrentWeek(scoreboardRaw);

    if (currentWeek === 0) {
      return NextResponse.json({ currentWeek: 0, teams: [], weeklyStandings: [] });
    }

    // Get team list
    const standingsRaw = await client.league.standings(leagueKey);
    const teams = extractTeamsFromStandings(standingsRaw);

    if (teams.length === 0) {
      return NextResponse.json({ currentWeek, teams: [], weeklyStandings: [] });
    }

    // Fetch scoreboard for each week (with per-week caching)
    const weeks = Array.from({ length: currentWeek }, (_, i) => i + 1);

    const weekScoreboards = await Promise.all(
      weeks.map(async (weekNum) => {
        const isPastWeek = weekNum < currentWeek;
        const weekTtl = isPastWeek ? 7 * 24 * 60 * 60 : 6 * 60 * 60;
        const weekCacheKey = `scoreboard-week-${weekNum}`;

        const cachedWeek = getCache(weekCacheKey);
        if (cachedWeek) return { week: weekNum, data: cachedWeek };

        try {
          const data = await client.league.scoreboard(leagueKey, weekNum);
          setCache(weekCacheKey, data, weekTtl);
          return { week: weekNum, data };
        } catch (err) {
          console.error(`Failed to fetch scoreboard for week ${weekNum}:`, err);
          return { week: weekNum, data: null };
        }
      })
    );

    // Build cumulative records
    const cumulative: Record<string, TeamRecord> = {};
    for (const team of teams) {
      cumulative[team.teamKey] = { wins: 0, losses: 0, ties: 0 };
    }

    const weeklyStandings: WeekStandings[] = [];

    for (const { week, data } of weekScoreboards) {
      if (data) {
        const outcomes = extractMatchupOutcomes(data);
        for (const outcome of outcomes) {
          if (outcome.isTie) {
            if (outcome.winnerKey && cumulative[outcome.winnerKey]) {
              cumulative[outcome.winnerKey].ties++;
            }
            if (outcome.loserKey && cumulative[outcome.loserKey]) {
              cumulative[outcome.loserKey].ties++;
            }
          } else {
            if (outcome.winnerKey && cumulative[outcome.winnerKey]) {
              cumulative[outcome.winnerKey].wins++;
            }
            if (outcome.loserKey && cumulative[outcome.loserKey]) {
              cumulative[outcome.loserKey].losses++;
            }
          }
        }
      }

      // Snapshot cumulative records at this week
      const snapshot: Record<string, TeamRecord> = {};
      for (const [key, record] of Object.entries(cumulative)) {
        snapshot[key] = { ...record };
      }
      weeklyStandings.push({ week, records: snapshot });
    }

    const result: StandingsHistoryResponse = {
      currentWeek,
      teams,
      weeklyStandings,
    };

    // Cache assembled result for 6 hours
    setCache(cacheKey, result, 6 * 60 * 60);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("Error fetching standings history:", error);
    return NextResponse.json(
      { error: "Failed to fetch standings history" },
      { status: 500 }
    );
  }
}
