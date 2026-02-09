import { NextRequest, NextResponse } from "next/server";
import { getYahooClient, getLeagueKey } from "@/lib/yahoo-api";
import { getCache, setCache } from "@/lib/cache";
import { AuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const weekParam = request.nextUrl.searchParams.get("week");
  const week = weekParam ? parseInt(weekParam, 10) : undefined;
  const cacheKey = `weekly-matchups-${week ?? "current"}`;

  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const client = await getYahooClient();
    const leagueKey = getLeagueKey();

    const matchups = await client.league.scoreboard(leagueKey, week);

    // Cache for 6 hours
    setCache(cacheKey, matchups, 6 * 60 * 60);

    return NextResponse.json(matchups);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("Error fetching matchups:", error);
    return NextResponse.json(
      { error: "Failed to fetch matchups" },
      { status: 500 }
    );
  }
}
