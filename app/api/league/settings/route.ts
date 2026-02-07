import { NextResponse } from "next/server";
import { getYahooClient, getLeagueKey } from "@/lib/yahoo-api";
import { getCache, setCache } from "@/lib/cache";

export async function GET() {
  const cacheKey = "league-settings";

  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const client = await getYahooClient();
    const leagueKey = getLeagueKey();

    const settings = await client.league.settings(leagueKey);

    // Cache for 7 days
    setCache(cacheKey, settings, 7 * 24 * 60 * 60);

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching league settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch league settings" },
      { status: 500 }
    );
  }
}
