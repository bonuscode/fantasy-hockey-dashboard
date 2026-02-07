import { NextResponse } from "next/server";
import { getYahooClient, getLeagueKey } from "@/lib/yahoo-api";
import { getCache, setCache } from "@/lib/cache";

export async function GET() {
  const cacheKey = "league-standings";

  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const client = await getYahooClient();
    const leagueKey = getLeagueKey();

    const standings = await client.league.standings(leagueKey);

    // Cache for 6 hours
    setCache(cacheKey, standings, 6 * 60 * 60);

    return NextResponse.json(standings);
  } catch (error) {
    console.error("Error fetching standings:", error);
    return NextResponse.json(
      { error: "Failed to fetch standings" },
      { status: 500 }
    );
  }
}
