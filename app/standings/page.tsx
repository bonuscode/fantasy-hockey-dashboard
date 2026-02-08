"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

interface TeamStanding {
  teamKey: string;
  teamId: string;
  name: string;
  managerName: string;
  logoUrl: string | null;
  rank: number;
  playoffSeed: number;
  wins: number;
  losses: number;
  ties: number;
  percentage: string;
  pointsFor: number;
  pointsAgainst: number;
  gamesBack: string;
  streakType: "win" | "loss" | "tie";
  streakValue: number;
}

type SortField =
  | "rank"
  | "name"
  | "record"
  | "percentage"
  | "pointsFor"
  | "pointsAgainst"
  | "streak";
type SortDir = "asc" | "desc";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeStandings(raw: any): TeamStanding[] {
  // Yahoo Fantasy API returns data in varying nested structures.
  // Handle common shapes from the yahoo-fantasy npm package.
  let teams: unknown[] = [];

  if (Array.isArray(raw)) {
    teams = raw;
  } else if (raw?.standings) {
    teams = Array.isArray(raw.standings) ? raw.standings : [];
  } else if (raw?.league?.standings) {
    teams = Array.isArray(raw.league.standings) ? raw.league.standings : [];
  } else if (raw?.fantasy_content?.league?.standings?.teams) {
    const t = raw.fantasy_content.league.standings.teams;
    teams = Array.isArray(t) ? t : Object.values(t).filter(Array.isArray);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return teams.map((team: any) => {
    // Yahoo uses "standings" (not "team_standings") as the per-team key
    const ts = team.standings || team.team_standings || team.teamStandings || {};
    const outcomes =
      ts.outcome_totals || ts.outcomeTotals || {};
    const streak = ts.streak || {};
    const managers = team.managers || [];
    const firstManager = Array.isArray(managers)
      ? managers[0]?.manager || managers[0]
      : managers;

    const logos = team.team_logos || team.teamLogos || [];
    const firstLogo = Array.isArray(logos)
      ? logos[0]?.team_logo?.url || logos[0]?.url || null
      : null;

    return {
      teamKey: team.team_key || team.teamKey || "",
      teamId: String(team.team_id || team.teamId || ""),
      name: team.name || "Unknown Team",
      managerName:
        firstManager?.nickname || firstManager?.name || "",
      logoUrl: firstLogo,
      rank: Number(ts.rank || 0),
      playoffSeed: Number(ts.playoff_seed || ts.playoffSeed || 0),
      wins: Number(outcomes.wins || 0),
      losses: Number(outcomes.losses || 0),
      ties: Number(outcomes.ties || 0),
      percentage: String(outcomes.percentage || ".000"),
      pointsFor: parseFloat(ts.points_for || ts.pointsFor || "0"),
      pointsAgainst: parseFloat(
        ts.points_against || ts.pointsAgainst || "0"
      ),
      gamesBack: String(ts.games_back || ts.gamesBack || "-"),
      streakType:
        (streak.type === "win" || streak.type === "loss" || streak.type === "tie"
          ? streak.type
          : "tie") as "win" | "loss" | "tie",
      streakValue: Number(streak.value || 0),
    };
  });
}

function getRankColor(rank: number) {
  if (rank === 1) return "text-amber-400";
  if (rank === 2) return "text-gray-300";
  if (rank === 3) return "text-amber-600";
  return "text-text-secondary";
}

function getRowIndicator(rank: number, playoffSpots: number) {
  if (rank <= playoffSpots) return "border-l-2 border-l-accent-success";
  if (rank <= playoffSpots + 2) return "border-l-2 border-l-accent-info";
  return "border-l-2 border-l-transparent";
}

function StreakBadge({
  type,
  value,
}: {
  type: "win" | "loss" | "tie";
  value: number;
}) {
  if (value === 0) return <span className="text-text-muted">-</span>;
  const label = type === "win" ? "W" : type === "loss" ? "L" : "T";
  const bg =
    type === "win"
      ? "bg-accent-success/15 text-accent-success"
      : type === "loss"
        ? "bg-accent-danger/15 text-accent-danger"
        : "bg-surface-elevated text-text-secondary";
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${bg}`}
    >
      {label}
      {value}
    </span>
  );
}

function SortIcon({
  field,
  currentField,
  currentDir,
}: {
  field: SortField;
  currentField: SortField;
  currentDir: SortDir;
}) {
  if (field !== currentField) {
    return (
      <svg
        className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        />
      </svg>
    );
  }
  return (
    <svg
      className="w-3 h-3 text-accent-primary"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      {currentDir === "asc" ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      )}
    </svg>
  );
}

function sortTeams(
  teams: TeamStanding[],
  field: SortField,
  dir: SortDir
): TeamStanding[] {
  return [...teams].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case "rank":
        cmp = a.rank - b.rank;
        break;
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "record":
        cmp = a.wins !== b.wins ? a.wins - b.wins : a.losses - b.losses;
        break;
      case "percentage":
        cmp = parseFloat(a.percentage) - parseFloat(b.percentage);
        break;
      case "pointsFor":
        cmp = a.pointsFor - b.pointsFor;
        break;
      case "pointsAgainst":
        cmp = a.pointsAgainst - b.pointsAgainst;
        break;
      case "streak":
        cmp =
          (a.streakType === "win" ? a.streakValue : -a.streakValue) -
          (b.streakType === "win" ? b.streakValue : -b.streakValue);
        break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

// --- Skeleton ---
function StandingsSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      {/* Header skeleton */}
      <div className="border-b border-border p-3 flex gap-6 animate-pulse">
        <div className="h-3 bg-surface-elevated rounded w-8" />
        <div className="h-3 bg-surface-elevated rounded w-32" />
        <div className="h-3 bg-surface-elevated rounded w-16 ml-auto" />
        <div className="h-3 bg-surface-elevated rounded w-12" />
        <div className="h-3 bg-surface-elevated rounded w-12" />
        <div className="h-3 bg-surface-elevated rounded w-12" />
        <div className="h-3 bg-surface-elevated rounded w-12" />
      </div>
      {/* Row skeletons */}
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="border-b border-border p-3 flex items-center gap-6 animate-pulse"
        >
          <div className="h-4 bg-surface-elevated rounded w-6" />
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 bg-surface-elevated rounded-full" />
            <div>
              <div className="h-4 bg-surface-elevated rounded w-28 mb-1" />
              <div className="h-3 bg-surface-elevated rounded w-16" />
            </div>
          </div>
          <div className="h-4 bg-surface-elevated rounded w-16" />
          <div className="h-4 bg-surface-elevated rounded w-10" />
          <div className="h-4 bg-surface-elevated rounded w-14" />
          <div className="h-4 bg-surface-elevated rounded w-14" />
          <div className="h-4 bg-surface-elevated rounded w-10" />
        </div>
      ))}
    </div>
  );
}

// --- Mobile card ---
function StandingCard({
  team,
  playoffSpots,
  hasPoints,
}: {
  team: TeamStanding;
  playoffSpots: number;
  hasPoints: boolean;
}) {
  const inPlayoffs = team.rank <= playoffSpots;
  const bubble = team.rank > playoffSpots && team.rank <= playoffSpots + 2;
  return (
    <Link
      href={`/teams/${team.teamId}`}
      className={`block bg-surface border border-border rounded-lg p-4 hover:bg-surface-elevated transition-colors ${
        inPlayoffs
          ? "border-l-2 border-l-accent-success"
          : bubble
            ? "border-l-2 border-l-accent-info"
            : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span
            className={`text-lg font-bold font-mono ${getRankColor(team.rank)}`}
          >
            {team.rank}
          </span>
          {team.logoUrl ? (
            <img
              src={team.logoUrl}
              alt=""
              className="w-8 h-8 rounded-full bg-surface-elevated"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center">
              <span className="text-xs text-text-muted">
                {team.name.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <div className="font-medium text-text-primary text-sm">
              {team.name}
            </div>
            {team.managerName && (
              <div className="text-xs text-text-muted">{team.managerName}</div>
            )}
          </div>
        </div>
      </div>
      <div className={`grid gap-2 text-sm ${hasPoints ? "grid-cols-4" : "grid-cols-3"}`}>
        <div>
          <div className="text-text-muted text-xs">Record</div>
          <div className="font-medium font-mono text-text-primary">
            {team.wins}-{team.losses}-{team.ties}
          </div>
        </div>
        <div>
          <div className="text-text-muted text-xs">PCT</div>
          <div className="font-medium font-mono text-text-primary">
            {team.percentage}
          </div>
        </div>
        {hasPoints ? (
          <>
            <div>
              <div className="text-text-muted text-xs">PF</div>
              <div className="font-medium font-mono text-text-primary">
                {team.pointsFor.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-text-muted text-xs">PA</div>
              <div className="font-medium font-mono text-text-primary">
                {team.pointsAgainst.toLocaleString()}
              </div>
            </div>
          </>
        ) : (
          <div>
            <div className="text-text-muted text-xs">Seed</div>
            <div className="font-medium font-mono text-text-primary">
              #{team.playoffSeed || team.rank}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

// --- Main page ---
export default function StandingsPage() {
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const playoffSpots = 6;

  const {
    data: standings,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["standings"],
    queryFn: async () => {
      const res = await fetch("/api/league/standings");
      if (res.status === 401) {
        throw new Error("NOT_AUTHENTICATED");
      }
      if (!res.ok) {
        throw new Error("Failed to fetch standings");
      }
      const raw = await res.json();
      return normalizeStandings(raw);
    },
  });

  // Detect if the league has points data (points league vs category league)
  const hasPoints = standings?.some((t) => t.pointsFor > 0) ?? false;
  const hasStreak = standings?.some((t) => t.streakValue > 0) ?? false;

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      // Default sort direction per field
      setSortDir(
        field === "rank" || field === "name" || field === "pointsAgainst"
          ? "asc"
          : "desc"
      );
    }
  }

  const sorted = standings ? sortTeams(standings, sortField, sortDir) : [];

  // Unauthenticated
  if (
    isError &&
    error instanceof Error &&
    error.message === "NOT_AUTHENTICATED"
  ) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-text-primary mb-6">
          League Standings
        </h1>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-surface-elevated flex items-center justify-center">
            <svg
              className="w-8 h-8 text-text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Not Connected
          </h3>
          <p className="text-text-secondary max-w-sm mb-4">
            Connect your Yahoo Fantasy account to view league standings.
          </p>
          <a
            href="/api/auth/login"
            className="px-4 py-2 bg-accent-primary text-white rounded-md text-sm font-medium hover:bg-accent-primary/90 transition-colors"
          >
            Connect Yahoo
          </a>
        </div>
      </div>
    );
  }

  // Generic error
  if (isError) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-text-primary mb-6">
          League Standings
        </h1>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-accent-danger/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-accent-danger"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Failed to Load Standings
          </h3>
          <p className="text-text-secondary max-w-sm mb-4">
            Something went wrong fetching the standings data. Please try again.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-accent-primary text-white rounded-md text-sm font-medium hover:bg-accent-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-text-primary mb-6">
          League Standings
        </h1>
        <StandingsSkeleton />
      </div>
    );
  }

  // Empty
  if (!sorted.length) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-text-primary mb-6">
          League Standings
        </h1>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-surface-elevated flex items-center justify-center">
            <svg
              className="w-8 h-8 text-text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No Standings Available
          </h3>
          <p className="text-text-secondary max-w-sm">
            Standings data isn&apos;t available yet. Check back once the season
            is underway.
          </p>
        </div>
      </div>
    );
  }

  const thClass =
    "text-xs uppercase font-semibold text-text-secondary p-3 cursor-pointer select-none group";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">
          League Standings
        </h1>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-success" />
            Playoff
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent-info" />
            Bubble
          </span>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th
                className={`${thClass} text-center w-12`}
                onClick={() => toggleSort("rank")}
              >
                <span className="flex items-center justify-center gap-1">
                  Rk
                  <SortIcon
                    field="rank"
                    currentField={sortField}
                    currentDir={sortDir}
                  />
                </span>
              </th>
              <th
                className={`${thClass} text-left`}
                onClick={() => toggleSort("name")}
              >
                <span className="flex items-center gap-1">
                  Team
                  <SortIcon
                    field="name"
                    currentField={sortField}
                    currentDir={sortDir}
                  />
                </span>
              </th>
              <th
                className={`${thClass} text-center`}
                onClick={() => toggleSort("record")}
              >
                <span className="flex items-center justify-center gap-1">
                  W-L-T
                  <SortIcon
                    field="record"
                    currentField={sortField}
                    currentDir={sortDir}
                  />
                </span>
              </th>
              <th
                className={`${thClass} text-right`}
                onClick={() => toggleSort("percentage")}
              >
                <span className="flex items-center justify-end gap-1">
                  PCT
                  <SortIcon
                    field="percentage"
                    currentField={sortField}
                    currentDir={sortDir}
                  />
                </span>
              </th>
              {hasPoints && (
                <>
                  <th
                    className={`${thClass} text-right`}
                    onClick={() => toggleSort("pointsFor")}
                  >
                    <span className="flex items-center justify-end gap-1">
                      PF
                      <SortIcon
                        field="pointsFor"
                        currentField={sortField}
                        currentDir={sortDir}
                      />
                    </span>
                  </th>
                  <th
                    className={`${thClass} text-right`}
                    onClick={() => toggleSort("pointsAgainst")}
                  >
                    <span className="flex items-center justify-end gap-1">
                      PA
                      <SortIcon
                        field="pointsAgainst"
                        currentField={sortField}
                        currentDir={sortDir}
                      />
                    </span>
                  </th>
                </>
              )}
              {hasStreak && (
                <th className={`${thClass} text-center`} onClick={() => toggleSort("streak")}>
                  <span className="flex items-center justify-center gap-1">
                    Streak
                    <SortIcon
                      field="streak"
                      currentField={sortField}
                      currentDir={sortDir}
                    />
                  </span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sorted.map((team, i) => (
              <tr
                key={team.teamKey || team.teamId}
                className={`border-b border-border hover:bg-surface-elevated/50 transition-colors ${getRowIndicator(team.rank, playoffSpots)} ${
                  // Subtle divider between playoff and non-playoff
                  i > 0 &&
                  sorted[i - 1].rank <= playoffSpots &&
                  team.rank > playoffSpots
                    ? "border-t-2 border-t-accent-success/30"
                    : ""
                }`}
              >
                <td className="p-3 text-center">
                  <span
                    className={`font-bold font-mono text-sm ${getRankColor(team.rank)}`}
                  >
                    {team.rank}
                  </span>
                </td>
                <td className="p-3">
                  <Link
                    href={`/teams/${team.teamId}`}
                    className="flex items-center gap-2.5 hover:text-accent-primary transition-colors"
                  >
                    {team.logoUrl ? (
                      <img
                        src={team.logoUrl}
                        alt=""
                        className="w-7 h-7 rounded-full bg-surface-elevated shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-surface-elevated flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-medium text-text-muted">
                          {team.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-sm text-text-primary truncate">
                        {team.name}
                      </div>
                      {team.managerName && (
                        <div className="text-xs text-text-muted truncate">
                          {team.managerName}
                        </div>
                      )}
                    </div>
                  </Link>
                </td>
                <td className="p-3 text-center font-mono text-sm text-text-primary">
                  {team.wins}-{team.losses}-{team.ties}
                </td>
                <td className="p-3 text-right font-mono text-sm text-text-primary">
                  {team.percentage}
                </td>
                {hasPoints && (
                  <>
                    <td className="p-3 text-right font-mono text-sm text-text-primary">
                      {team.pointsFor.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-sm text-text-primary">
                      {team.pointsAgainst.toLocaleString()}
                    </td>
                  </>
                )}
                {hasStreak && (
                  <td className="p-3 text-center">
                    <StreakBadge
                      type={team.streakType}
                      value={team.streakValue}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        {sorted.map((team) => (
          <StandingCard
            key={team.teamKey || team.teamId}
            team={team}
            playoffSpots={playoffSpots}
            hasPoints={hasPoints}
          />
        ))}
      </div>
    </div>
  );
}
