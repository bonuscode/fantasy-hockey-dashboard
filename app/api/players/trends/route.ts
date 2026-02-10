import { NextResponse } from "next/server";
import { getYahooClient, getLeagueKey } from "@/lib/yahoo-api";
import { getCache, setCache } from "@/lib/cache";
import { AuthError } from "@/lib/auth";

interface WeekStat {
  statId: string;
  value: string;
}

interface PlayerWeekData {
  week: number;
  stats: WeekStat[];
}

interface TrendsResponse {
  currentWeek: number;
  trends: Record<string, PlayerWeekData[]>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTeamsFromStandings(raw: any): { teamId: string }[] {
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
    teamId: String(t?.team_id || t?.teamId || ""),
  }));
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
function extractPlayersFromRoster(raw: any): { playerKey: string; stats: WeekStat[] }[] {
  let players: unknown[] = [];

  if (Array.isArray(raw)) {
    players = raw;
  } else if (raw?.roster?.players) {
    const p = raw.roster.players;
    players = Array.isArray(p) ? p : Object.values(p).filter((v) => typeof v === "object");
  } else if (raw?.roster) {
    players = Array.isArray(raw.roster) ? raw.roster : [];
  } else if (raw?.players) {
    const p = raw.players;
    players = Array.isArray(p) ? p : Object.values(p).filter((v) => typeof v === "object");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return players.map((p: any) => {
    const player = p?.player || p;
    const rawStats = player?.player_stats?.stats || player?.stats || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stats: WeekStat[] = (Array.isArray(rawStats) ? rawStats : []).map((s: any) => ({
      statId: String(s?.stat?.stat_id || s?.stat_id || s?.statId || ""),
      value: String(s?.stat?.value ?? s?.value ?? ""),
    }));

    return {
      playerKey: player?.player_key || player?.playerKey || "",
      stats,
    };
  });
}

export async function GET() {
  const cacheKey = "player-trends";

  const cached = getCache<TrendsResponse>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const client = await getYahooClient();
    const leagueKey = getLeagueKey();

    // Get current week from scoreboard
    const scoreboardRaw = await client.league.scoreboard(leagueKey);
    const currentWeek = extractCurrentWeek(scoreboardRaw);

    if (currentWeek === 0) {
      return NextResponse.json({ currentWeek: 0, trends: {} });
    }

    // Get team list from standings
    const standingsRaw = await client.league.standings(leagueKey);
    const teamList = extractTeamsFromStandings(standingsRaw);

    if (teamList.length === 0) {
      return NextResponse.json({ currentWeek, trends: {} });
    }

    // Fetch 6 weeks of data (or fewer if early in the season)
    const startWeek = Math.max(1, currentWeek - 5);
    const weeks = Array.from(
      { length: currentWeek - startWeek + 1 },
      (_, i) => startWeek + i
    );

    const trends: Record<string, PlayerWeekData[]> = {};

    // Fetch each week's data for all teams
    for (const weekNum of weeks) {
      const isPastWeek = weekNum < currentWeek;
      const weekTtl = isPastWeek ? 7 * 24 * 60 * 60 : 6 * 60 * 60; // 7 days for past, 6 hours for current

      // Fetch all teams for this week in parallel
      const teamResults = await Promise.all(
        teamList.map(async (team) => {
          const teamKey = `${leagueKey}.t.${team.teamId}`;
          const rosterCacheKey = `roster-week-${team.teamId}-${weekNum}`;

          const cachedRoster = getCache(rosterCacheKey);
          if (cachedRoster) return cachedRoster;

          try {
            const roster = await client.roster.players(teamKey, weekNum, "stats");
            setCache(rosterCacheKey, roster, weekTtl);
            return roster;
          } catch (err) {
            console.error(`Failed to fetch roster for team ${team.teamId} week ${weekNum}:`, err);
            return null;
          }
        })
      );

      // Extract player stats from each team's roster
      for (const rosterRaw of teamResults) {
        if (!rosterRaw) continue;
        const players = extractPlayersFromRoster(rosterRaw);
        for (const player of players) {
          if (!player.playerKey) continue;
          if (!trends[player.playerKey]) {
            trends[player.playerKey] = [];
          }
          trends[player.playerKey].push({
            week: weekNum,
            stats: player.stats,
          });
        }
      }
    }

    const result: TrendsResponse = { currentWeek, trends };

    // Cache the assembled trends for 6 hours
    setCache(cacheKey, result, 6 * 60 * 60);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("Error fetching player trends:", error);
    return NextResponse.json(
      { error: "Failed to fetch player trends" },
      { status: 500 }
    );
  }
}
