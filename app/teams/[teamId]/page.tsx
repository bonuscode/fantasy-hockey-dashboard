"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

// --- Types ---

interface TeamInfo {
  name: string;
  teamId: string;
  teamKey: string;
  logoUrl: string | null;
  managerName: string;
  wins: number;
  losses: number;
  ties: number;
  percentage: string;
  rank: number;
  playoffSeed: number;
  waiverPriority: number | null;
  numberOfMoves: number;
  numberOfTrades: number;
}

interface PlayerInfo {
  playerKey: string;
  playerId: string;
  name: string;
  team: string;
  position: string;
  eligiblePositions: string[];
  selectedPosition: string;
  imageUrl: string | null;
  status: string | null;
  stats: PlayerStat[];
}

interface PlayerStat {
  statId: string;
  value: string;
}

type PositionGroup = "Forwards" | "Defense" | "Goalies" | "Bench" | "IR";

// --- Stat ID mapping (BrewZoo league-specific) ---

const SKATER_STAT_MAP: Record<string, string> = {
  "1": "G", "2": "A", "8": "PIM", "11": "SHG",
  "14": "SOG", "31": "HIT", "32": "BLK",
};

const GOALIE_STAT_MAP: Record<string, string> = {
  "19": "W", "22": "GA", "23": "GAA",
  "24": "SA", "25": "SV", "26": "SV%", "27": "SO",
};

// Reverse maps: label -> statId
const SKATER_LABEL_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(SKATER_STAT_MAP).map(([id, label]) => [label, id])
);
const GOALIE_LABEL_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(GOALIE_STAT_MAP).map(([id, label]) => [label, id])
);

const SKATER_STAT_LABELS = ["G", "A", "SOG", "HIT", "BLK", "PIM", "SHG"];
const GOALIE_STAT_LABELS = ["W", "GAA", "SV%", "SO", "GA", "SV", "SA"];

// --- Normalization ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeTeamInfo(raw: any, standingsData: any): TeamInfo {
  const managers = raw?.managers || [];
  const firstManager = Array.isArray(managers)
    ? managers[0]?.manager || managers[0]
    : managers;
  const logos = raw?.team_logos || raw?.teamLogos || [];
  const firstLogo = Array.isArray(logos)
    ? logos[0]?.team_logo?.url || logos[0]?.url || null
    : null;

  // Get record/rank from standings data for this team
  const teamId = String(raw?.team_id || raw?.teamId || "");
  const teamStanding = findTeamInStandings(standingsData, teamId);
  const standings = teamStanding?.standings || teamStanding?.team_standings || {};
  const outcomes = standings?.outcome_totals || standings?.outcomeTotals || {};

  return {
    name: raw?.name || "Unknown Team",
    teamId,
    teamKey: raw?.team_key || raw?.teamKey || "",
    logoUrl: firstLogo,
    managerName: firstManager?.nickname || firstManager?.name || "",
    wins: Number(outcomes?.wins || 0),
    losses: Number(outcomes?.losses || 0),
    ties: Number(outcomes?.ties || 0),
    percentage: String(outcomes?.percentage || ".000"),
    rank: Number(standings?.rank || 0),
    playoffSeed: Number(standings?.playoff_seed || standings?.playoffSeed || 0),
    waiverPriority: raw?.waiver_priority != null ? Number(raw.waiver_priority) : null,
    numberOfMoves: Number(raw?.number_of_moves || 0),
    numberOfTrades: Number(raw?.number_of_trades || 0),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findTeamInStandings(raw: any, teamId: string): any {
  if (!raw) return null;

  let teams: unknown[] = [];
  if (Array.isArray(raw)) {
    teams = raw;
  } else if (raw?.standings) {
    teams = Array.isArray(raw.standings) ? raw.standings : [];
  } else if (raw?.league?.standings) {
    teams = Array.isArray(raw.league.standings) ? raw.league.standings : [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return teams.find((t: any) => String(t?.team_id || t?.teamId || "") === teamId) || null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeRoster(raw: any): PlayerInfo[] {
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
    const name = player?.name || {};
    const fullName = name?.full || name?.ascii_full || `${name?.first || ""} ${name?.last || ""}`.trim() || "Unknown";

    const eligiblePositions = (player?.eligible_positions || player?.eligiblePositions || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((ep: any) => ep?.position || ep)
      .filter(Boolean);

    const selectedPos =
      player?.selected_position?.position ||
      player?.selectedPosition?.position ||
      player?.selected_position ||
      eligiblePositions[0] ||
      "BN";

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

    return {
      playerKey: player?.player_key || player?.playerKey || "",
      playerId: String(player?.player_id || player?.playerId || ""),
      name: fullName,
      team: player?.editorial_team_abbr || player?.team || "",
      position: player?.display_position || player?.primary_position || eligiblePositions[0] || "",
      eligiblePositions,
      selectedPosition: typeof selectedPos === "string" ? selectedPos : String(selectedPos),
      imageUrl: headshot,
      status: player?.status || player?.injury_note ? (player?.status || "DTD") : null,
      stats,
    };
  });
}

// --- Helpers ---

function getPlayerStatValue(player: PlayerInfo, statId: string): number {
  const stat = player.stats.find((s) => s.statId === statId);
  if (!stat || stat.value === "" || stat.value === "-") return 0;
  return parseFloat(stat.value) || 0;
}

function getDisplayStats(player: PlayerInfo): { label: string; value: string }[] {
  const isGoalie = player.position === "G" || player.eligiblePositions.includes("G");
  const statMap = isGoalie ? GOALIE_STAT_MAP : SKATER_STAT_MAP;
  const priorityStats = isGoalie
    ? ["19", "23", "26", "27", "22", "25", "24"]
    : ["1", "2", "14", "31", "32", "8", "11"];

  const result: { label: string; value: string }[] = [];
  for (const statId of priorityStats) {
    const stat = player.stats.find((s) => s.statId === statId);
    const label = statMap[statId];
    if (stat && label) {
      result.push({ label, value: stat.value || "-" });
    }
  }

  if (result.length === 0) {
    for (const stat of player.stats.slice(0, 7)) {
      const label = statMap[stat.statId] || `S${stat.statId}`;
      result.push({ label, value: stat.value || "-" });
    }
  }

  return result;
}

function getPositionGroup(selectedPosition: string, eligiblePositions: string[]): PositionGroup {
  if (selectedPosition === "IR" || selectedPosition === "IR+") return "IR";
  if (selectedPosition === "BN") return "Bench";
  if (eligiblePositions.includes("G") || selectedPosition === "G") return "Goalies";
  if (selectedPosition === "D") return "Defense";
  const forwardPositions = ["C", "LW", "RW", "F", "Util", "W"];
  if (forwardPositions.includes(selectedPosition)) return "Forwards";
  if (eligiblePositions.includes("G")) return "Goalies";
  if (eligiblePositions.every((p) => p === "D" || p === "IR" || p === "IR+" || p === "BN")) return "Defense";
  return "Forwards";
}

function groupByPosition(players: PlayerInfo[]): Record<PositionGroup, PlayerInfo[]> {
  const groups: Record<PositionGroup, PlayerInfo[]> = {
    Forwards: [], Defense: [], Goalies: [], Bench: [], IR: [],
  };
  for (const player of players) {
    groups[getPositionGroup(player.selectedPosition, player.eligiblePositions)].push(player);
  }
  return groups;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "IR": case "IR+": return "bg-accent-danger/15 text-accent-danger";
    case "DTD": case "D2D": return "bg-accent-warning/15 text-accent-warning";
    case "O": case "OUT": return "bg-accent-danger/15 text-accent-danger";
    default: return "bg-surface-elevated text-text-secondary";
  }
}

// Lower-is-better stats (GAA, GA, PIM) sort ascending by default
const LOWER_IS_BETTER = new Set(["23", "22", "8"]);

function sortPlayersByStat(players: PlayerInfo[], statId: string, dir: "desc" | "asc"): PlayerInfo[] {
  return [...players].sort((a, b) => {
    const va = getPlayerStatValue(a, statId);
    const vb = getPlayerStatValue(b, statId);
    return dir === "desc" ? vb - va : va - vb;
  });
}

// --- Skeleton ---

function TeamDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-lg p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-surface-elevated" />
          <div className="flex-1">
            <div className="h-6 bg-surface-elevated rounded w-48 mb-2" />
            <div className="h-4 bg-surface-elevated rounded w-32 mb-3" />
            <div className="flex gap-6">
              <div className="h-4 bg-surface-elevated rounded w-20" />
              <div className="h-4 bg-surface-elevated rounded w-16" />
              <div className="h-4 bg-surface-elevated rounded w-16" />
            </div>
          </div>
        </div>
      </div>
      {[1, 2, 3].map((section) => (
        <div key={section} className="bg-surface border border-border rounded-lg overflow-hidden animate-pulse">
          <div className="p-3 border-b border-border">
            <div className="h-4 bg-surface-elevated rounded w-24" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-3 flex items-center gap-4 border-b border-border last:border-b-0">
              <div className="w-8 h-8 rounded-full bg-surface-elevated" />
              <div className="flex-1">
                <div className="h-4 bg-surface-elevated rounded w-36 mb-1" />
                <div className="h-3 bg-surface-elevated rounded w-20" />
              </div>
              <div className="flex gap-4">
                <div className="h-4 bg-surface-elevated rounded w-8" />
                <div className="h-4 bg-surface-elevated rounded w-8" />
                <div className="h-4 bg-surface-elevated rounded w-8" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// --- Mobile Player Card ---

function PlayerCard({ player, rankLabel }: { player: PlayerInfo; rankLabel?: string }) {
  const displayStats = getDisplayStats(player);

  return (
    <div className="bg-surface border border-border rounded-lg p-3">
      <div className="flex items-center gap-3 mb-2">
        {rankLabel && (
          <span className="text-xs font-bold font-mono text-accent-primary w-5 text-center shrink-0">
            {rankLabel}
          </span>
        )}
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
            {player.team} · {player.position}
            <span className="text-text-muted/60"> · {player.selectedPosition}</span>
          </div>
        </div>
      </div>
      {displayStats.length > 0 && (
        <div className="grid grid-cols-4 gap-2 text-xs">
          {displayStats.slice(0, 4).map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-text-muted">{stat.label}</div>
              <div className="font-mono font-medium text-text-primary">{stat.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Sorted Roster View (flat list when sorting by stat) ---

function SortedRosterView({
  players,
  sortStat,
  sortDir,
}: {
  players: PlayerInfo[];
  sortStat: { label: string; statId: string };
  sortDir: "desc" | "asc";
}) {
  const isGoalieStat = GOALIE_LABEL_TO_ID[sortStat.label] !== undefined && SKATER_LABEL_TO_ID[sortStat.label] === undefined;
  const isSkaterStat = SKATER_LABEL_TO_ID[sortStat.label] !== undefined && GOALIE_LABEL_TO_ID[sortStat.label] === undefined;

  // Filter to relevant players (skaters for skater stats, goalies for goalie stats)
  let filtered = players;
  if (isGoalieStat) {
    filtered = players.filter((p) => p.position === "G" || p.eligiblePositions.includes("G"));
  } else if (isSkaterStat) {
    filtered = players.filter((p) => p.position !== "G" && !p.eligiblePositions.includes("G"));
  }

  const sorted = sortPlayersByStat(filtered, sortStat.statId, sortDir);

  const statLabels = isGoalieStat ? GOALIE_STAT_LABELS : SKATER_STAT_LABELS;

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-surface">
        <h3 className="text-xs uppercase font-semibold text-text-secondary tracking-wide">
          Sorted by {sortStat.label}
          <span className="ml-1 text-text-muted font-normal normal-case">
            ({sortDir === "desc" ? "highest first" : "lowest first"})
          </span>
          <span className="ml-2 text-text-muted font-normal normal-case">
            ({sorted.length} players)
          </span>
        </h3>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-xs font-semibold text-text-muted p-3 text-center w-8">#</th>
              <th className="text-xs font-semibold text-text-muted p-3 text-center w-10">Pos</th>
              <th className="text-xs font-semibold text-text-muted p-3 text-left">Player</th>
              {statLabels.map((label) => (
                <th
                  key={label}
                  className={`text-xs font-semibold p-3 text-right w-16 ${
                    label === sortStat.label ? "text-accent-primary" : "text-text-muted"
                  }`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((player, i) => {
              const displayStats = getDisplayStats(player);
              return (
                <tr
                  key={player.playerKey || player.playerId}
                  className="border-b border-border last:border-b-0 hover:bg-surface-elevated/50 transition-colors"
                >
                  <td className="p-3 text-center">
                    <span className="text-xs font-bold font-mono text-text-muted">{i + 1}</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="text-xs font-mono text-text-muted">{player.selectedPosition}</span>
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
                        <div className="text-xs text-text-muted">{player.team} · {player.position}</div>
                      </div>
                    </div>
                  </td>
                  {statLabels.map((label) => {
                    const stat = displayStats.find((s) => s.label === label);
                    const isActive = label === sortStat.label;
                    return (
                      <td
                        key={label}
                        className={`p-3 text-right font-mono text-sm ${
                          isActive ? "text-accent-primary font-semibold" : "text-text-primary"
                        }`}
                      >
                        {stat?.value ?? "-"}
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
      <div className="md:hidden flex flex-col">
        {sorted.map((player, i) => (
          <div key={player.playerKey || player.playerId} className="border-b border-border last:border-b-0 p-1">
            <PlayerCard player={player} rankLabel={String(i + 1)} />
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Position Section ---

function PositionSection({
  title,
  players,
  hasStats,
  onSortStat,
  activeSortLabel,
}: {
  title: string;
  players: PlayerInfo[];
  hasStats: boolean;
  onSortStat: (label: string) => void;
  activeSortLabel: string | null;
}) {
  if (players.length === 0) return null;

  const isGoalieSection = title === "Goalies";
  const statLabels = isGoalieSection ? GOALIE_STAT_LABELS : SKATER_STAT_LABELS;

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border bg-surface">
        <h3 className="text-xs uppercase font-semibold text-text-secondary tracking-wide">
          {title}
          <span className="ml-2 text-text-muted font-normal normal-case">({players.length})</span>
        </h3>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-xs font-semibold text-text-muted p-3 text-center w-10">Pos</th>
              <th className="text-xs font-semibold text-text-muted p-3 text-left">Player</th>
              {hasStats &&
                statLabels.map((label) => (
                  <th
                    key={label}
                    className={`text-xs font-semibold p-3 text-right w-16 cursor-pointer select-none group transition-colors ${
                      activeSortLabel === label
                        ? "text-accent-primary"
                        : "text-text-muted hover:text-text-secondary"
                    }`}
                    onClick={() => onSortStat(label)}
                  >
                    <span className="flex items-center justify-end gap-1">
                      {label}
                      <svg
                        className={`w-3 h-3 transition-opacity ${
                          activeSortLabel === label ? "opacity-100 text-accent-primary" : "opacity-0 group-hover:opacity-100"
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </span>
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {players.map((player) => {
              const displayStats = getDisplayStats(player);
              return (
                <tr
                  key={player.playerKey || player.playerId}
                  className="border-b border-border last:border-b-0 hover:bg-surface-elevated/50 transition-colors"
                >
                  <td className="p-3 text-center">
                    <span className="text-xs font-mono text-text-muted">{player.selectedPosition}</span>
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
                        <div className="text-xs text-text-muted">{player.team} · {player.position}</div>
                      </div>
                    </div>
                  </td>
                  {hasStats &&
                    statLabels.map((label) => {
                      const stat = displayStats.find((s) => s.label === label);
                      const isActive = activeSortLabel === label;
                      return (
                        <td
                          key={label}
                          className={`p-3 text-right font-mono text-sm ${
                            isActive ? "text-accent-primary font-semibold" : "text-text-primary"
                          }`}
                        >
                          {stat?.value ?? "-"}
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
      <div className="md:hidden flex flex-col">
        {players.map((player) => (
          <div key={player.playerKey || player.playerId} className="border-b border-border last:border-b-0 p-1">
            <PlayerCard player={player} />
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Page ---

export default function TeamPage() {
  const params = useParams<{ teamId: string }>();
  const teamId = params.teamId;

  // Sort state: null = default (grouped by position), string = stat label being sorted
  const [sortStat, setSortStat] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const {
    data: teamInfo,
    isLoading: teamLoading,
    isError: teamError,
    error: teamErrorObj,
  } = useQuery({
    queryKey: ["team", teamId],
    queryFn: async () => {
      const [teamRes, standingsRes] = await Promise.all([
        fetch(`/api/teams/${teamId}`),
        fetch("/api/league/standings"),
      ]);
      if (teamRes.status === 401) throw new Error("NOT_AUTHENTICATED");
      if (!teamRes.ok) throw new Error("Failed to fetch team");
      const raw = await teamRes.json();
      const standingsRaw = standingsRes.ok ? await standingsRes.json() : null;
      return normalizeTeamInfo(raw, standingsRaw);
    },
  });

  const {
    data: roster,
    isLoading: rosterLoading,
    isError: rosterError,
    refetch: refetchRoster,
  } = useQuery({
    queryKey: ["team-roster", teamId],
    queryFn: async () => {
      const res = await fetch(`/api/teams/${teamId}/roster`);
      if (res.status === 401) throw new Error("NOT_AUTHENTICATED");
      if (!res.ok) throw new Error("Failed to fetch roster");
      const raw = await res.json();
      return normalizeRoster(raw);
    },
  });

  const isLoading = teamLoading || rosterLoading;
  const isUnauth =
    teamError && teamErrorObj instanceof Error && teamErrorObj.message === "NOT_AUTHENTICATED";

  function handleSortStat(label: string) {
    if (sortStat === label) {
      // Toggle direction
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortStat(label);
      // Default direction based on stat type
      const statId = SKATER_LABEL_TO_ID[label] || GOALIE_LABEL_TO_ID[label];
      setSortDir(LOWER_IS_BETTER.has(statId) ? "asc" : "desc");
    }
  }

  function resetSort() {
    setSortStat(null);
    setSortDir("desc");
  }

  // Resolve the active sort stat ID
  const activeSortStatId = sortStat
    ? SKATER_LABEL_TO_ID[sortStat] || GOALIE_LABEL_TO_ID[sortStat] || null
    : null;

  // Back nav helper
  const backNav = (
    <div className="flex items-center gap-3 mb-6">
      <Link href="/standings" className="text-text-secondary hover:text-text-primary transition-colors">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Link>
      <h1 className="text-2xl font-semibold text-text-primary">Team Dashboard</h1>
    </div>
  );

  if (isUnauth) {
    return (
      <div>
        {backNav}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-surface-elevated flex items-center justify-center">
            <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Not Connected</h3>
          <p className="text-text-secondary max-w-sm mb-4">Connect your Yahoo Fantasy account to view team details.</p>
          <a href="/api/auth/login" className="px-4 py-2 bg-accent-primary text-white rounded-md text-sm font-medium hover:bg-accent-primary/90 transition-colors">
            Connect Yahoo
          </a>
        </div>
      </div>
    );
  }

  if (teamError || rosterError) {
    return (
      <div>
        {backNav}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-accent-danger/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-accent-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Failed to Load Team</h3>
          <p className="text-text-secondary max-w-sm mb-4">Something went wrong fetching team data. Please try again.</p>
          <button onClick={() => refetchRoster()} className="px-4 py-2 bg-accent-primary text-white rounded-md text-sm font-medium hover:bg-accent-primary/90 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        {backNav}
        <TeamDashboardSkeleton />
      </div>
    );
  }

  const groups = roster ? groupByPosition(roster) : null;
  const hasStats = roster ? roster.some((p) => p.stats.length > 0) : false;

  return (
    <div>
      {backNav}

      {/* Team header */}
      {teamInfo && (
        <div className="bg-surface border border-border rounded-lg p-5 md:p-6 mb-6">
          <div className="flex items-start gap-4">
            {teamInfo.logoUrl ? (
              <img src={teamInfo.logoUrl} alt="" className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-surface-elevated shrink-0" />
            ) : (
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-surface-elevated flex items-center justify-center shrink-0">
                <span className="text-lg font-medium text-text-muted">{teamInfo.name.charAt(0)}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-text-primary truncate">{teamInfo.name}</h2>
              {teamInfo.managerName && (
                <p className="text-sm text-text-secondary mt-0.5">Managed by {teamInfo.managerName}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
                <div>
                  <span className="text-xs text-text-muted uppercase">Record</span>
                  <div className="font-mono font-semibold text-text-primary">
                    {teamInfo.wins}-{teamInfo.losses}-{teamInfo.ties}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-text-muted uppercase">PCT</span>
                  <div className="font-mono font-semibold text-text-primary">{teamInfo.percentage}</div>
                </div>
                <div>
                  <span className="text-xs text-text-muted uppercase">Rank</span>
                  <div className="font-mono font-semibold text-text-primary">#{teamInfo.rank}</div>
                </div>
                {teamInfo.waiverPriority != null && (
                  <div>
                    <span className="text-xs text-text-muted uppercase">Waiver</span>
                    <div className="font-mono font-semibold text-text-primary">#{teamInfo.waiverPriority}</div>
                  </div>
                )}
                <div>
                  <span className="text-xs text-text-muted uppercase">Moves</span>
                  <div className="font-mono font-semibold text-text-primary">{teamInfo.numberOfMoves}</div>
                </div>
                {teamInfo.numberOfTrades > 0 && (
                  <div>
                    <span className="text-xs text-text-muted uppercase">Trades</span>
                    <div className="font-mono font-semibold text-text-primary">{teamInfo.numberOfTrades}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sort controls */}
      {hasStats && roster && (
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-text-muted uppercase font-semibold mr-1">Sort by:</span>
            {SKATER_STAT_LABELS.map((label) => (
              <button
                key={label}
                onClick={() => handleSortStat(label)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  sortStat === label
                    ? "bg-accent-primary text-white"
                    : "bg-surface-elevated text-text-secondary hover:text-text-primary hover:bg-surface-elevated/80"
                }`}
              >
                {label}
                {sortStat === label && (
                  <span className="ml-1">{sortDir === "desc" ? "\u2193" : "\u2191"}</span>
                )}
              </button>
            ))}
            <span className="text-text-muted/40 mx-1">|</span>
            {GOALIE_STAT_LABELS.map((label) => (
              <button
                key={label}
                onClick={() => handleSortStat(label)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  sortStat === label
                    ? "bg-accent-primary text-white"
                    : "bg-surface-elevated text-text-secondary hover:text-text-primary hover:bg-surface-elevated/80"
                }`}
              >
                {label}
                {sortStat === label && (
                  <span className="ml-1">{sortDir === "desc" ? "\u2193" : "\u2191"}</span>
                )}
              </button>
            ))}
            {sortStat && (
              <button
                onClick={resetSort}
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-accent-danger/10 text-accent-danger hover:bg-accent-danger/20 transition-colors ml-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}

      {/* Roster: sorted view or default grouped view */}
      {roster && sortStat && activeSortStatId && (
        <SortedRosterView
          players={roster}
          sortStat={{ label: sortStat, statId: activeSortStatId }}
          sortDir={sortDir}
        />
      )}

      {roster && !sortStat && groups && (
        <div className="space-y-4">
          <PositionSection title="Forwards" players={groups.Forwards} hasStats={hasStats} onSortStat={handleSortStat} activeSortLabel={sortStat} />
          <PositionSection title="Defense" players={groups.Defense} hasStats={hasStats} onSortStat={handleSortStat} activeSortLabel={sortStat} />
          <PositionSection title="Goalies" players={groups.Goalies} hasStats={hasStats} onSortStat={handleSortStat} activeSortLabel={sortStat} />
          <PositionSection title="Bench" players={groups.Bench} hasStats={hasStats} onSortStat={handleSortStat} activeSortLabel={sortStat} />
          <PositionSection title="IR" players={groups.IR} hasStats={hasStats} onSortStat={handleSortStat} activeSortLabel={sortStat} />
        </div>
      )}

      {roster && roster.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-surface-elevated flex items-center justify-center">
            <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No Roster Data</h3>
          <p className="text-text-secondary max-w-sm">Roster data isn&apos;t available for this team yet.</p>
        </div>
      )}
    </div>
  );
}
