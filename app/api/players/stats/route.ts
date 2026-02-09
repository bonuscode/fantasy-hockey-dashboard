import { NextResponse } from "next/server";
import { getYahooClient, getLeagueKey } from "@/lib/yahoo-api";
import { getCache, setCache } from "@/lib/cache";
import { AuthError } from "@/lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTeamsFromStandings(raw: any): { teamId: string; name: string }[] {
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
    name: t?.name || "Unknown Team",
  }));
}

export async function GET() {
  const cacheKey = "all-players-stats";

  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const client = await getYahooClient();
    const leagueKey = getLeagueKey();

    // Get standings to enumerate all teams
    const standingsRaw = await client.league.standings(leagueKey);
    const teamList = extractTeamsFromStandings(standingsRaw);

    if (teamList.length === 0) {
      return NextResponse.json({ teams: [] });
    }

    // Fetch all team rosters with stats in parallel
    const rosterResults = await Promise.all(
      teamList.map(async (team) => {
        const teamKey = `${leagueKey}.t.${team.teamId}`;
        try {
          const roster = await client.roster.players(teamKey, "stats");
          return { teamId: team.teamId, teamName: team.name, roster };
        } catch (err) {
          console.error(`Failed to fetch roster for team ${team.teamId}:`, err);
          return { teamId: team.teamId, teamName: team.name, roster: null };
        }
      })
    );

    const result = { teams: rosterResults };

    // Cache for 6 hours
    setCache(cacheKey, result, 6 * 60 * 60);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("Error fetching all player stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch player stats" },
      { status: 500 }
    );
  }
}
