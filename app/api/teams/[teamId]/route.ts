import { NextResponse } from "next/server";
import { getYahooClient, getLeagueKey } from "@/lib/yahoo-api";
import { getCache, setCache } from "@/lib/cache";
import { AuthError } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const cacheKey = `team-${teamId}`;

  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const client = await getYahooClient();
    const leagueKey = getLeagueKey();
    const teamKey = `${leagueKey}.t.${teamId}`;

    const [meta, stats] = await Promise.all([
      client.team.meta(teamKey),
      client.team.stats(teamKey).catch(() => null),
    ]);

    const team = { ...(meta as object), teamStats: stats };

    // Cache for 24 hours
    setCache(cacheKey, team, 24 * 60 * 60);

    return NextResponse.json(team);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}
