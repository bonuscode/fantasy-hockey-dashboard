"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { LineChart, Line, Tooltip, ResponsiveContainer } from "recharts";

// --- Types ---

interface PlayerStat {
  statId: string;
  value: string;
}

interface LeaderboardPlayer {
  playerKey: string;
  playerId: string;
  name: string;
  nhlTeam: string;
  fantasyTeam: string;
  position: string;
  eligiblePositions: string[];
  imageUrl: string | null;
  status: string | null;
  stats: PlayerStat[];
}

type PositionFilter = "All Skaters" | "C" | "LW" | "RW" | "D" | "G";

interface TrendWeek {
  statId: string;
  value: string;
}

interface TrendsData {
  currentWeek: number;
  trends: Record<string, { week: number; stats: TrendWeek[] }[]>;
}

// --- Stat ID mapping (BrewZoo league-specific) ---

const SKATER_STAT_MAP: Record<string, string> = {
  "1": "G", "2": "A", "12": "PPP", "11": "SHG",
  "14": "SOG", "31": "HIT", "32": "BLK",
};

const GOALIE_STAT_MAP: Record<string, string> = {
  "19": "W", "22": "GA", "23": "GAA",
  "24": "SA", "25": "SV", "26": "SV%", "27": "SO",
};

const SKATER_LABEL_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(SKATER_STAT_MAP).map(([id, label]) => [label, id])
);
const GOALIE_LABEL_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(GOALIE_STAT_MAP).map(([id, label]) => [label, id])
);

const SKATER_STAT_LABELS = ["G", "A", "SOG", "HIT", "BLK", "PPP", "SHG"];
const GOALIE_STAT_LABELS = ["W", "GAA", "SV%", "SO", "GA", "SV", "SA"];

// Lower-is-better stats (GAA, GA) default ascending
const LOWER_IS_BETTER = new Set(["23", "22"]);

const POSITION_FILTERS: PositionFilter[] = ["All Skaters", "C", "LW", "RW", "D", "G"];

const ALL_STAT_MAP: Record<string, string> = { ...SKATER_STAT_MAP, ...GOALIE_STAT_MAP };

// --- Normalization ---

function isGoalie(player: { position: string; eligiblePositions: string[] }): boolean {
  return player.position === "G" || player.eligiblePositions?.includes("G");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAllPlayers(data: any): LeaderboardPlayer[] {
  const teams = data?.teams || [];
  const allPlayers: LeaderboardPlayer[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const team of teams) {
    const teamName = team.teamName || "Unknown Team";
    const raw = team.roster;
    if (!raw) continue;

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
    for (const p of players as any[]) {
      const player = p?.player || p;
      const name = player?.name || {};
      const fullName = name?.full || name?.ascii_full || `${name?.first || ""} ${name?.last || ""}`.trim() || "Unknown";

      const eligiblePositions = (player?.eligible_positions || player?.eligiblePositions || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((ep: any) => ep?.position || ep)
        .filter(Boolean);

      const headshot =
        player?.headshot?.url ||
        player?.image_url ||
        player?.imageUrl ||
        null;

      const rawStats = player?.player_stats?.stats || player?.stats || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stats: PlayerStat[] = (Array.isArray(rawStats) ? rawStats : []).map((s: any) => ({
        statId: String(s?.stat?.stat_id || s?.stat_id || s?.statId || ""),
        value: String(s?.stat?.value ?? s?.value ?? ""),
      }));

      allPlayers.push({
        playerKey: player?.player_key || player?.playerKey || "",
        playerId: String(player?.player_id || player?.playerId || ""),
        name: fullName,
        nhlTeam: player?.editorial_team_abbr || player?.team || "",
        fantasyTeam: teamName,
        position: player?.display_position || player?.primary_position || eligiblePositions[0] || "",
        eligiblePositions,
        imageUrl: headshot,
        status: player?.status || player?.injury_note ? (player?.status || "DTD") : null,
        stats,
      });
    }
  }

  return allPlayers;
}

// --- Helpers ---

function getStatValue(player: LeaderboardPlayer, statId: string): number {
  const stat = player.stats.find((s) => s.statId === statId);
  if (!stat || stat.value === "" || stat.value === "-") return 0;
  return parseFloat(stat.value) || 0;
}

function getStatDisplay(player: LeaderboardPlayer, statId: string): string {
  const stat = player.stats.find((s) => s.statId === statId);
  return stat?.value || "-";
}

function filterPlayers(players: LeaderboardPlayer[], filter: PositionFilter): LeaderboardPlayer[] {
  switch (filter) {
    case "All Skaters":
      return players.filter((p) => !isGoalie(p));
    case "G":
      return players.filter((p) => isGoalie(p));
    case "C":
    case "LW":
    case "RW":
    case "D":
      return players.filter((p) =>
        !isGoalie(p) && (p.position.includes(filter) || p.eligiblePositions?.includes(filter))
      );
  }
}

function sortPlayers(
  players: LeaderboardPlayer[],
  statId: string,
  dir: "desc" | "asc"
): LeaderboardPlayer[] {
  return [...players].sort((a, b) => {
    const va = getStatValue(a, statId);
    const vb = getStatValue(b, statId);
    return dir === "desc" ? vb - va : va - vb;
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case "IR": case "IR+": return "bg-accent-danger/15 text-accent-danger";
    case "DTD": case "D2D": return "bg-accent-warning/15 text-accent-warning";
    case "O": case "OUT": return "bg-accent-danger/15 text-accent-danger";
    default: return "bg-surface-elevated text-text-secondary";
  }
}

// --- Sparkline helpers ---

function getSparklineData(
  trends: TrendsData | undefined,
  playerKey: string,
  statId: string
): { week: number; value: number }[] | null {
  if (!trends?.trends?.[playerKey]) return null;

  const weekData = trends.trends[playerKey];
  const points = weekData
    .map((wd) => {
      const stat = wd.stats.find((s) => s.statId === statId);
      if (!stat || stat.value === "" || stat.value === "-") return null;
      const value = parseFloat(stat.value);
      if (isNaN(value)) return null;
      return { week: wd.week, value };
    })
    .filter((p): p is { week: number; value: number } => p !== null)
    .sort((a, b) => a.week - b.week);

  // Need at least 2 data points for a line
  if (points.length < 2) return null;
  return points;
}

// --- Sparkline component ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SparklineTooltip({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const { week, value } = payload[0].payload;
  return (
    <div className="bg-surface-elevated border border-border rounded px-2 py-1 text-[10px] shadow-lg">
      <span className="text-text-muted">Wk {week}: </span>
      <span className="font-mono font-medium text-text-primary">{value}</span>
    </div>
  );
}

function Sparkline({ data }: { data: { week: number; value: number }[] }) {
  return (
    <div className="w-[72px] h-[28px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-accent-primary)"
            strokeWidth={1.5}
            dot={false}
          />
          <Tooltip
            content={<SparklineTooltip />}
            cursor={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- Skeleton ---

function LeaderboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 bg-surface-elevated rounded-md w-20" />
        ))}
      </div>
      <div className="bg-surface border border-border rounded-lg overflow-hidden animate-pulse">
        <div className="border-b border-border p-3 flex gap-4">
          <div className="h-3 bg-surface-elevated rounded w-6" />
          <div className="h-3 bg-surface-elevated rounded w-40" />
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-3 bg-surface-elevated rounded w-10 ml-auto" />
          ))}
        </div>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="border-b border-border p-3 flex items-center gap-4">
            <div className="h-4 bg-surface-elevated rounded w-6" />
            <div className="w-7 h-7 rounded-full bg-surface-elevated" />
            <div className="flex-1">
              <div className="h-4 bg-surface-elevated rounded w-32 mb-1" />
              <div className="h-3 bg-surface-elevated rounded w-24" />
            </div>
            {Array.from({ length: 7 }).map((_, j) => (
              <div key={j} className="h-4 bg-surface-elevated rounded w-10" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Mobile Player Card ---

function PlayerCard({
  player,
  rank,
  sparklineData,
  sortStatLabel,
}: {
  player: LeaderboardPlayer;
  rank: number;
  sparklineData: { week: number; value: number }[] | null;
  sortStatLabel: string;
}) {
  const isG = isGoalie(player);
  const statLabels = isG ? GOALIE_STAT_LABELS : SKATER_STAT_LABELS;
  const labelToId = isG ? GOALIE_LABEL_TO_ID : SKATER_LABEL_TO_ID;

  return (
    <div className="bg-surface border border-border rounded-lg p-3">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs font-bold font-mono text-accent-primary w-5 text-center shrink-0">
          {rank}
        </span>
        {player.imageUrl ? (
          <img src={player.imageUrl} alt="" className="w-8 h-8 rounded-full bg-surface-elevated shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center shrink-0">
            <span className="text-xs text-text-muted">{player.name.charAt(0)}</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-text-primary truncate">{player.name}</span>
            {player.status && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${getStatusBadge(player.status)}`}>
                {player.status}
              </span>
            )}
          </div>
          <div className="text-xs text-text-muted">
            {player.nhlTeam} · {player.position}
            <span className="text-text-muted/60"> · {player.fantasyTeam}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs">
        {statLabels.slice(0, 4).map((label) => (
          <div key={label} className="text-center">
            <div className="text-text-muted">{label}</div>
            <div className="font-mono font-medium text-text-primary">
              {getStatDisplay(player, labelToId[label])}
            </div>
          </div>
        ))}
      </div>
      {sparklineData && (
        <div className="mt-2 pt-2 border-t border-border flex items-center gap-2">
          <span className="text-[10px] text-text-muted">{sortStatLabel} trend</span>
          <Sparkline data={sparklineData} />
        </div>
      )}
    </div>
  );
}

// --- Main Page ---

export default function PlayersPage() {
  const [posFilter, setPosFilter] = useState<PositionFilter>("All Skaters");
  const [sortLabel, setSortLabel] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const {
    data: allPlayers,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["all-players"],
    queryFn: async () => {
      const res = await fetch("/api/players/stats");
      if (res.status === 401) throw new Error("NOT_AUTHENTICATED");
      if (!res.ok) throw new Error("Failed to fetch players");
      const raw = await res.json();
      return normalizeAllPlayers(raw);
    },
  });

  const { data: trendsData } = useQuery<TrendsData>({
    queryKey: ["player-trends"],
    queryFn: async () => {
      const res = await fetch("/api/players/trends");
      if (!res.ok) return { currentWeek: 0, trends: {} };
      return res.json();
    },
    enabled: !!allPlayers,
  });

  const isGoalieView = posFilter === "G";
  const statLabels = isGoalieView ? GOALIE_STAT_LABELS : SKATER_STAT_LABELS;
  const labelToId = isGoalieView ? GOALIE_LABEL_TO_ID : SKATER_LABEL_TO_ID;

  // Default sort: Goals (desc) for skaters, Wins (desc) for goalies
  const effectiveSortLabel = sortLabel ?? (isGoalieView ? "W" : "G");
  const effectiveSortId = labelToId[effectiveSortLabel] || (isGoalieView ? "19" : "1");

  const displayPlayers = useMemo(() => {
    if (!allPlayers) return [];
    const filtered = filterPlayers(allPlayers, posFilter);
    return sortPlayers(filtered, effectiveSortId, sortDir);
  }, [allPlayers, posFilter, effectiveSortId, sortDir]);

  function handleSort(label: string) {
    if (sortLabel === label) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortLabel(label);
      const statId = labelToId[label];
      setSortDir(LOWER_IS_BETTER.has(statId) ? "asc" : "desc");
    }
  }

  function handlePositionChange(filter: PositionFilter) {
    setPosFilter(filter);
    // Reset sort when switching between skater/goalie views
    const switchingType =
      (filter === "G" && posFilter !== "G") || (filter !== "G" && posFilter === "G");
    if (switchingType) {
      setSortLabel(null);
      setSortDir("desc");
    }
  }

  const isUnauth = isError && error instanceof Error && error.message === "NOT_AUTHENTICATED";

  const pageHeader = (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold text-text-primary">
        Player Leaderboard
      </h1>
      {allPlayers && (
        <span className="text-xs text-text-muted">
          {displayPlayers.length} players
        </span>
      )}
    </div>
  );

  if (isUnauth) {
    return (
      <div>
        {pageHeader}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-surface-elevated flex items-center justify-center">
            <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Not Connected</h3>
          <p className="text-text-secondary max-w-sm mb-4">Connect your Yahoo Fantasy account to view player leaderboards.</p>
          <a href="/api/auth/login" className="px-4 py-2 bg-accent-primary text-white rounded-md text-sm font-medium hover:bg-accent-primary/90 transition-colors">
            Connect Yahoo
          </a>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        {pageHeader}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-accent-danger/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-accent-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Failed to Load Players</h3>
          <p className="text-text-secondary max-w-sm mb-4">Something went wrong fetching player data. Please try again.</p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-accent-primary text-white rounded-md text-sm font-medium hover:bg-accent-primary/90 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        {pageHeader}
        <LeaderboardSkeleton />
      </div>
    );
  }

  if (!allPlayers || allPlayers.length === 0) {
    return (
      <div>
        {pageHeader}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-surface-elevated flex items-center justify-center">
            <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No Player Data</h3>
          <p className="text-text-secondary max-w-sm">Player data isn&apos;t available yet. Check back once rosters are set.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {pageHeader}

      {/* Position filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {POSITION_FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => handlePositionChange(filter)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              posFilter === filter
                ? "bg-accent-primary text-white"
                : "bg-surface-elevated text-text-secondary hover:text-text-primary"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="text-xs font-semibold text-text-muted p-3 text-center w-12">#</th>
              <th className="text-xs font-semibold text-text-muted p-3 text-left">Player</th>
              <th className="text-xs font-semibold text-text-muted p-3 text-center w-[88px]">
                Trend
              </th>
              {statLabels.map((label) => {
                const isActive = effectiveSortLabel === label;
                return (
                  <th
                    key={label}
                    className={`text-xs font-semibold p-3 text-right w-16 cursor-pointer select-none group transition-colors ${
                      isActive ? "text-accent-primary" : "text-text-muted hover:text-text-secondary"
                    }`}
                    onClick={() => handleSort(label)}
                  >
                    <span className="flex items-center justify-end gap-1">
                      {label}
                      {isActive ? (
                        <svg className="w-3 h-3 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {sortDir === "asc" ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          )}
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {displayPlayers.map((player, i) => {
              const sparkData = getSparklineData(trendsData, player.playerKey, effectiveSortId);
              return (
                <tr
                  key={player.playerKey || `${player.name}-${player.fantasyTeam}-${i}`}
                  className="border-b border-border last:border-b-0 hover:bg-surface-elevated/50 transition-colors"
                >
                  <td className="p-3 text-center">
                    <span className="text-xs font-bold font-mono text-text-muted">{i + 1}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      {player.imageUrl ? (
                        <img src={player.imageUrl} alt="" className="w-7 h-7 rounded-full bg-surface-elevated shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-surface-elevated flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-medium text-text-muted">{player.name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary truncate">{player.name}</span>
                          {player.status && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${getStatusBadge(player.status)}`}>
                              {player.status}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-text-muted">
                          {player.nhlTeam} · {player.position}
                          <span className="text-text-muted/60"> · {player.fantasyTeam}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center">
                      {sparkData ? (
                        <Sparkline data={sparkData} />
                      ) : trendsData ? (
                        <span className="text-text-muted text-xs">–</span>
                      ) : (
                        <div className="w-[72px] h-[28px] bg-surface-elevated/50 rounded animate-pulse" />
                      )}
                    </div>
                  </td>
                  {statLabels.map((label) => {
                    const statId = labelToId[label];
                    const isActive = effectiveSortLabel === label;
                    return (
                      <td
                        key={label}
                        className={`p-3 text-right font-mono text-sm ${
                          isActive ? "text-accent-primary font-semibold" : "text-text-primary"
                        }`}
                      >
                        {getStatDisplay(player, statId)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-2">
        {displayPlayers.map((player, i) => (
          <PlayerCard
            key={player.playerKey || `${player.name}-${player.fantasyTeam}-${i}`}
            player={player}
            rank={i + 1}
            sparklineData={getSparklineData(trendsData, player.playerKey, effectiveSortId)}
            sortStatLabel={ALL_STAT_MAP[effectiveSortId] || effectiveSortLabel}
          />
        ))}
      </div>
    </div>
  );
}
