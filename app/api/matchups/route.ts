import { NextResponse } from "next/server";
import { getYahooClient, getLeagueKey } from "@/lib/yahoo-api";
import { getCache, setCache } from "@/lib/cache";

export async function GET() {
  const cacheKey = "weekly-matchups";

  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const client = await getYahooClient();
    const leagueKey = getLeagueKey();

    const matchups = await client.league.scoreboard(leagueKey);

    // Cache for 6 hours
    setCache(cacheKey, matchups, 6 * 60 * 60);

    return NextResponse.json(matchups);
  } catch (error) {
    console.error("Error fetching matchups:", error);
    return NextResponse.json(
      { error: "Failed to fetch matchups" },
      { status: 500 }
    );
  }
}
