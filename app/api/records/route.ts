import { NextResponse } from "next/server";
import { getYahooClient, getLeagueKey } from "@/lib/yahoo-api";
import { getCache, setCache } from "@/lib/cache";
import { AuthError } from "@/lib/auth";

interface RecordHolder {
  teamName: string;
  teamKey: string;
  logoUrl: string | null;
  value: number;
  displayValue: string;
  weeks: number[];
}

interface StatRecord {
  statId: string;
  label: string;
  lowerIsBetter: boolean;
  holders: RecordHolder[];
}

interface RecordsResponse {
  currentWeek: number;
  records: StatRecord[];
}

const RECORD_STATS: { statId: string; label: string; lowerIsBetter: boolean }[] = [
  { statId: "1", label: "Most Goals", lowerIsBetter: false },
  { statId: "2", label: "Most Assists", lowerIsBetter: false },
  { statId: "8", label: "Most Power Play Points", lowerIsBetter: false },
  { statId: "11", label: "Most SH Goals", lowerIsBetter: false },
  { statId: "14", label: "Most Shots on Goal", lowerIsBetter: false },
  { statId: "31", label: "Most Hits", lowerIsBetter: false },
  { statId: "32", label: "Most Blocks", lowerIsBetter: false },
  { statId: "19", label: "Most Goalie Wins", lowerIsBetter: false },
  { statId: "23", label: "Best GAA", lowerIsBetter: true },
  { statId: "26", label: "Best Save %", lowerIsBetter: false },
  { statId: "27", label: "Most Shutouts", lowerIsBetter: false },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractCurrentWeek(raw: any): number {
  const scoreboard = raw?.scoreboard || raw?.league?.scoreboard || raw;
  return Number(scoreboard?.week || raw?.week || 0);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface RawEntry {
  teamName: string;
  teamKey: string;
  logoUrl: string | null;
  value: number;
  displayValue: string;
  week: number;
}

function extractTeamStatsFromWeek(raw: any, weekNum: number): Map<string, RawEntry[]> {
  const result = new Map<string, RawEntry[]>();
  const scoreboard = raw?.scoreboard || raw?.league?.scoreboard || raw;

  let rawMatchups: unknown[] = [];
  if (scoreboard?.matchups) {
    rawMatchups = Array.isArray(scoreboard.matchups)
      ? scoreboard.matchups
      : Object.values(scoreboard.matchups).filter((v) => typeof v === "object");
  }

  for (const m of rawMatchups) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const matchup = (m as any)?.matchup || m;
    const rawTeams = matchup?.teams || matchup?.matchup_teams || [];
    const teamsArr = Array.isArray(rawTeams)
      ? rawTeams
      : Object.values(rawTeams).filter((v) => typeof v === "object");

    for (const t of teamsArr) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const team = (t as any)?.team || t;
      const teamKey = String(team?.team_key || team?.teamKey || "");
      const teamName = String(team?.name || "Unknown Team");
      const logos = team?.team_logos || team?.teamLogos || [];
      const logoUrl = Array.isArray(logos)
        ? logos[0]?.team_logo?.url || logos[0]?.url || null
        : null;

      const rawStats = team?.team_stats?.stats || team?.stats || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stats = (Array.isArray(rawStats) ? rawStats : []).map((s: any) => ({
        statId: String(s?.stat?.stat_id || s?.stat_id || s?.statId || ""),
        value: String(s?.stat?.value ?? s?.value ?? ""),
      }));

      for (const stat of stats) {
        if (!stat.statId || stat.value === "-" || stat.value === "") continue;
        const numValue = parseFloat(stat.value);
        if (isNaN(numValue)) continue;

        if (!result.has(stat.statId)) {
          result.set(stat.statId, []);
        }
        result.get(stat.statId)!.push({
          teamName,
          teamKey,
          logoUrl,
          value: numValue,
          displayValue: stat.value,
          week: weekNum,
        });
      }
    }
  }

  return result;
}

export async function GET() {
  const cacheKey = "league-records-v2";

  const cached = getCache<RecordsResponse>(cacheKey);
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
      return NextResponse.json({ currentWeek: 0, records: [] });
    }

    // Cache the current week scoreboard for reuse
    setCache(`scoreboard-week-${currentWeek}`, scoreboardRaw, 6 * 60 * 60);

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

    // Collect all team stats across all weeks
    const allStats = new Map<string, RawEntry[]>();

    for (const { week, data } of weekScoreboards) {
      if (!data) continue;
      const weekStats = extractTeamStatsFromWeek(data, week);
      for (const [statId, entries] of weekStats) {
        if (!allStats.has(statId)) {
          allStats.set(statId, []);
        }
        allStats.get(statId)!.push(...entries);
      }
    }

    // Compute records for each stat
    const records: StatRecord[] = RECORD_STATS.map((rs) => {
      const entries = allStats.get(rs.statId) || [];
      if (entries.length === 0) {
        return { ...rs, holders: [] };
      }

      let bestValue: number;
      if (rs.lowerIsBetter) {
        bestValue = Math.min(...entries.map((e) => e.value));
      } else {
        bestValue = Math.max(...entries.map((e) => e.value));
      }

      // Deduplicate by teamKey — a team that hit the record value in multiple
      // weeks counts as one holder, not one per week.
      const byTeam = new Map<string, RecordHolder>();
      for (const e of entries) {
        if (e.value !== bestValue) continue;
        const existing = byTeam.get(e.teamKey);
        if (existing) {
          existing.weeks.push(e.week);
          existing.weeks.sort((a, b) => a - b);
        } else {
          byTeam.set(e.teamKey, {
            teamName: e.teamName,
            teamKey: e.teamKey,
            logoUrl: e.logoUrl,
            value: e.value,
            displayValue: e.displayValue,
            weeks: [e.week],
          });
        }
      }
      const holders = Array.from(byTeam.values());

      return { ...rs, holders };
    });

    const result: RecordsResponse = { currentWeek, records };

    // Cache for 6 hours
    setCache(cacheKey, result, 6 * 60 * 60);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    console.error("Error fetching records:", error);
    return NextResponse.json(
      { error: "Failed to fetch records" },
      { status: 500 }
    );
  }
}
