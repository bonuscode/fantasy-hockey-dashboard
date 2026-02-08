import { NextResponse } from "next/server";
import { getYahooClient, getLeagueKey } from "@/lib/yahoo-api";
import { getCache, setCache } from "@/lib/cache";
import { AuthError } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const cacheKey = `team-${teamId}-roster`;

  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const client = await getYahooClient();
    const leagueKey = getLeagueKey();
    const teamKey = `${leagueKey}.t.${teamId}`;

    // Fetch roster with player stats via subresource
    let roster;
    try {
      roster = await client.roster.players(teamKey, "stats");
    } catch {
      // Fallback to basic roster if stats subresource fails
      roster = await client.team.roster(teamKey);
    }

    // Cache for 6 hours
    setCache(cacheKey, roster, 6 * 60 * 60);

    return NextResponse.json(roster);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("Error fetching roster:", error);
    return NextResponse.json(
      { error: "Failed to fetch roster" },
      { status: 500 }
    );
  }
}
