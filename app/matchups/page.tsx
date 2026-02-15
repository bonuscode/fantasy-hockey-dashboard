"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

// --- Types ---

interface MatchupTeam {
  teamKey: string;
  teamId: string;
  name: string;
  logoUrl: string | null;
  managerName: string;
  stats: { statId: string; value: string }[];
}

interface StatWinner {
  statId: string;
  winnerTeamKey: string | null;
  isTied: boolean;
}

interface NormalizedMatchup {
  weekStart: string;
  weekEnd: string;
  status: "postevent" | "midevent" | "preevent";
  isPlayoffs: boolean;
  isConsolation: boolean;
  teams: [MatchupTeam, MatchupTeam];
  statWinners: StatWinner[];
  score: { team1Wins: number; team2Wins: number; ties: number };
}

interface NormalizedScoreboard {
  week: number;
  matchups: NormalizedMatchup[];
}

// --- Stat ID → label map (combined skater + goalie, BrewZoo league) ---

const STAT_LABEL_MAP: Record<string, string> = {
  "1": "G", "2": "A", "8": "PIM", "11": "SHG",
  "14": "SOG", "31": "HIT", "32": "BLK",
  "19": "W", "22": "GA", "23": "GAA",
  "24": "SA", "25": "SV", "26": "SV%", "27": "SO",
};

// Skater stat IDs in display order
const SKATER_STAT_IDS = ["1", "2", "14", "31", "32", "8", "11"];
// Goalie stat IDs in display order
const GOALIE_STAT_IDS = ["19", "22", "23", "25", "26", "27"];

// --- Normalization ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeTeam(raw: any): MatchupTeam {
  const managers = raw?.managers || [];
  const firstManager = Array.isArray(managers)
    ? managers[0]?.manager || managers[0]
    : managers;

  const logos = raw?.team_logos || raw?.teamLogos || [];
  const firstLogo = Array.isArray(logos)
    ? logos[0]?.team_logo?.url || logos[0]?.url || null
    : null;

  const rawStats = raw?.team_stats?.stats || raw?.stats || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stats = (Array.isArray(rawStats) ? rawStats : []).map((s: any) => ({
    statId: String(s?.stat?.stat_id || s?.stat_id || s?.statId || ""),
    value: String(s?.stat?.value ?? s?.value ?? ""),
  }));

  return {
    teamKey: raw?.team_key || raw?.teamKey || "",
    teamId: String(raw?.team_id || raw?.teamId || ""),
    name: raw?.name || "Unknown Team",
    logoUrl: firstLogo,
    managerName: firstManager?.nickname || firstManager?.name || "",
    stats,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeScoreboard(raw: any): NormalizedScoreboard {
  // Try multiple paths for the scoreboard data
  const scoreboard =
    raw?.scoreboard ||
    raw?.league?.scoreboard ||
    raw?.fantasy_content?.league?.scoreboard ||
    raw;

  const week = Number(scoreboard?.week || raw?.week || 0);

  let rawMatchups: unknown[] = [];
  if (scoreboard?.matchups) {
    rawMatchups = Array.isArray(scoreboard.matchups)
      ? scoreboard.matchups
      : Object.values(scoreboard.matchups).filter((v) => typeof v === "object");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchups: NormalizedMatchup[] = rawMatchups.map((m: any) => {
    const matchup = m?.matchup || m;

    // Teams
    const rawTeams = matchup?.teams || matchup?.matchup_teams || [];
    const teamsArr = Array.isArray(rawTeams)
      ? rawTeams
      : Object.values(rawTeams).filter((v) => typeof v === "object");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const teams = teamsArr.map((t: any) => normalizeTeam(t?.team || t)) as [MatchupTeam, MatchupTeam];

    // Stat winners
    const rawWinners = matchup?.stat_winners || matchup?.statWinners || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const statWinners: StatWinner[] = (Array.isArray(rawWinners) ? rawWinners : []).map((sw: any) => {
      const winner = sw?.stat_winner || sw;
      return {
        statId: String(winner?.stat_id || winner?.statId || ""),
        winnerTeamKey: winner?.winner_team_key || winner?.winnerTeamKey || null,
        isTied: winner?.is_tied === "1" || winner?.is_tied === 1 || winner?.isTied === true,
      };
    });

    // Compute score from stat winners
    let team1Wins = 0;
    let team2Wins = 0;
    let ties = 0;
    for (const sw of statWinners) {
      if (sw.isTied) {
        ties++;
      } else if (sw.winnerTeamKey === teams[0]?.teamKey) {
        team1Wins++;
      } else if (sw.winnerTeamKey === teams[1]?.teamKey) {
        team2Wins++;
      }
    }

    const status = (matchup?.status || "preevent") as "postevent" | "midevent" | "preevent";

    return {
      weekStart: matchup?.week_start || matchup?.weekStart || "",
      weekEnd: matchup?.week_end || matchup?.weekEnd || "",
      status,
      isPlayoffs: matchup?.is_playoffs === "1" || matchup?.is_playoffs === 1 || matchup?.isPlayoffs === true,
      isConsolation: matchup?.is_consolation === "1" || matchup?.is_consolation === 1 || matchup?.isConsolation === true,
      teams,
      statWinners,
      score: { team1Wins, team2Wins, ties },
    };
  });

  return { week, matchups };
}

// --- Helpers ---

function getStatusLabel(status: string) {
  switch (status) {
    case "postevent": return "Final";
    case "midevent": return "In Progress";
    default: return "Upcoming";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "postevent": return "bg-accent-success/15 text-accent-success";
    case "midevent": return "bg-accent-warning/15 text-accent-warning";
    default: return "bg-surface-elevated text-text-secondary";
  }
}

function formatDateRange(start: string, end: string) {
  if (!start) return "";
  try {
    const s = new Date(start + "T00:00:00");
    const e = end ? new Date(end + "T00:00:00") : s;
    const fmt = (d: Date) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${fmt(s)} – ${fmt(e)}`;
  } catch {
    return start;
  }
}

function getTeamStatValue(team: MatchupTeam, statId: string): string {
  const stat = team.stats.find((s) => s.statId === statId);
  return stat?.value || "-";
}

// --- Skeleton ---

function MatchupsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-surface border border-border rounded-lg overflow-hidden animate-pulse"
        >
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-elevated" />
                <div>
                  <div className="h-4 bg-surface-elevated rounded w-28 mb-1" />
                  <div className="h-3 bg-surface-elevated rounded w-16" />
                </div>
              </div>
              <div className="h-6 bg-surface-elevated rounded w-20" />
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="h-4 bg-surface-elevated rounded w-28 mb-1" />
                  <div className="h-3 bg-surface-elevated rounded w-16 ml-auto" />
                </div>
                <div className="w-8 h-8 rounded-full bg-surface-elevated" />
              </div>
            </div>
          </div>
          <div className="p-3 space-y-2">
            {Array.from({ length: 7 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between">
                <div className="h-3 bg-surface-elevated rounded w-8" />
                <div className="h-3 bg-surface-elevated rounded w-10" />
                <div className="h-3 bg-surface-elevated rounded w-8" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Team logo/initial ---

function TeamAvatar({ team, size = "md" }: { team: MatchupTeam; size?: "md" | "sm" }) {
  const px = size === "sm" ? "w-7 h-7" : "w-8 h-8";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  if (team.logoUrl) {
    return (
      <img
        src={team.logoUrl}
        alt=""
        className={`${px} rounded-full bg-surface-elevated shrink-0`}
      />
    );
  }
  return (
    <div className={`${px} rounded-full bg-surface-elevated flex items-center justify-center shrink-0`}>
      <span className={`${textSize} font-medium text-text-muted`}>
        {team.name.charAt(0)}
      </span>
    </div>
  );
}

// --- Matchup card ---

function MatchupCard({ matchup }: { matchup: NormalizedMatchup }) {
  const { teams, statWinners, score, status } = matchup;
  const [team1, team2] = teams;
  const [expanded, setExpanded] = useState(false);

  // Build ordered stat IDs from statWinners so we display exactly the league's scoring categories
  const statIds = statWinners.map((sw) => sw.statId);

  // Find divider index between skater and goalie stats
  const firstGoalieIdx = statIds.findIndex((id) => GOALIE_STAT_IDS.includes(id));
  const hasDivider = firstGoalieIdx > 0;

  // Determine leading team color for mobile collapsed view
  const t1Leading = score.team1Wins > score.team2Wins;
  const t2Leading = score.team2Wins > score.team1Wins;

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      {/* Header — tappable on mobile to expand/collapse */}
      <button
        className="w-full text-left p-4 md:cursor-default"
        onClick={() => setExpanded((e) => !e)}
        type="button"
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStatusColor(status)}`}>
            {getStatusLabel(status)}
          </span>
          <div className="flex items-center gap-1.5">
            {matchup.isPlayoffs && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent-primary/15 text-accent-primary">
                Playoffs
              </span>
            )}
            {matchup.isConsolation && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-elevated text-text-muted">
                Consolation
              </span>
            )}
            {/* Mobile expand chevron */}
            <svg
              className={`w-4 h-4 text-text-muted transition-transform duration-200 md:hidden ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <div className="flex items-center justify-between">
          {/* Team 1 */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <TeamAvatar team={team1} />
            <div className="min-w-0">
              <div className={`font-medium text-sm truncate ${t1Leading ? "text-accent-success" : "text-text-primary"}`}>
                {team1.name}
              </div>
              <div className="text-xs text-text-muted truncate hidden md:block">{team1.managerName}</div>
            </div>
          </div>
          {/* Score */}
          <div className="px-3 shrink-0 text-center">
            <div className="font-mono font-bold text-lg text-text-primary">
              {score.team1Wins}
              <span className="text-text-muted mx-1">-</span>
              {score.team2Wins}
              <span className="text-text-muted mx-1">-</span>
              {score.ties}
            </div>
          </div>
          {/* Team 2 */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 justify-end">
            <div className="min-w-0 text-right">
              <div className={`font-medium text-sm truncate ${t2Leading ? "text-accent-success" : "text-text-primary"}`}>
                {team2.name}
              </div>
              <div className="text-xs text-text-muted truncate hidden md:block">{team2.managerName}</div>
            </div>
            <TeamAvatar team={team2} />
          </div>
        </div>
      </button>

      {/* Stat comparison rows — always visible on desktop, collapsible on mobile */}
      <div className={`divide-y divide-border border-t border-border ${expanded ? "" : "hidden md:block"}`}>
        {statIds.map((statId, idx) => {
          const winner = statWinners.find((sw) => sw.statId === statId);
          const label = STAT_LABEL_MAP[statId] || `Stat ${statId}`;
          const val1 = getTeamStatValue(team1, statId);
          const val2 = getTeamStatValue(team2, statId);

          const t1Won = winner?.winnerTeamKey === team1.teamKey;
          const t2Won = winner?.winnerTeamKey === team2.teamKey;
          const tied = winner?.isTied ?? false;

          const t1Color = t1Won
            ? "text-accent-success font-semibold"
            : t2Won
              ? "text-accent-danger"
              : "text-text-secondary";
          const t2Color = t2Won
            ? "text-accent-success font-semibold"
            : t1Won
              ? "text-accent-danger"
              : "text-text-secondary";

          const showDivider = hasDivider && idx === firstGoalieIdx;

          return (
            <div key={statId}>
              {showDivider && (
                <div className="border-t-2 border-border" />
              )}
              <div
                className={`flex items-center justify-between px-4 py-1.5 text-sm ${
                  tied ? "bg-surface" : t1Won ? "bg-accent-success/[0.03]" : t2Won ? "bg-accent-success/[0.03]" : ""
                }`}
              >
                <span className={`font-mono w-12 text-left ${t1Color}`}>
                  {val1}
                </span>
                <span className="text-xs text-text-muted font-medium flex-1 text-center">
                  {label}
                </span>
                <span className={`font-mono w-12 text-right ${t2Color}`}>
                  {val2}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Main page ---

export default function MatchupsPage() {
  const [week, setWeek] = useState<number | undefined>(undefined);

  const {
    data: scoreboard,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["matchups", week],
    queryFn: async () => {
      const url = week != null ? `/api/matchups?week=${week}` : "/api/matchups";
      const res = await fetch(url);
      if (res.status === 401) throw new Error("NOT_AUTHENTICATED");
      if (!res.ok) throw new Error("Failed to fetch matchups");
      const raw = await res.json();
      return normalizeScoreboard(raw);
    },
  });

  // Once we get the current week from the API, use it for navigation
  const currentWeek = scoreboard?.week ?? week;

  const pageHeader = (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold text-text-primary">
        Weekly Matchups
      </h1>
    </div>
  );

  // Week navigation
  const weekNav = (
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={() => setWeek((currentWeek ?? 2) - 1)}
        disabled={!currentWeek || currentWeek <= 1}
        className="px-3 py-1.5 text-sm font-medium rounded-md bg-surface-elevated text-text-secondary hover:text-text-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Prev
        </span>
      </button>
      <div className="text-center">
        <div className="font-semibold text-text-primary">
          Week {currentWeek ?? "–"}
        </div>
        {scoreboard?.matchups?.[0] && (
          <div className="text-xs text-text-muted">
            {formatDateRange(
              scoreboard.matchups[0].weekStart,
              scoreboard.matchups[0].weekEnd
            )}
          </div>
        )}
      </div>
      <button
        onClick={() => setWeek((currentWeek ?? 0) + 1)}
        className="px-3 py-1.5 text-sm font-medium rounded-md bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
      >
        <span className="flex items-center gap-1">
          Next
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </button>
    </div>
  );

  // Unauthenticated
  const isUnauth = isError && error instanceof Error && error.message === "NOT_AUTHENTICATED";
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
          <p className="text-text-secondary max-w-sm mb-4">
            Connect your Yahoo Fantasy account to view weekly matchups.
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

  // Error
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
          <h3 className="text-lg font-semibold text-text-primary mb-2">Failed to Load Matchups</h3>
          <p className="text-text-secondary max-w-sm mb-4">
            Something went wrong fetching matchup data. Please try again.
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
        {pageHeader}
        {weekNav}
        <MatchupsSkeleton />
      </div>
    );
  }

  // Empty
  if (!scoreboard || scoreboard.matchups.length === 0) {
    return (
      <div>
        {pageHeader}
        {weekNav}
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-surface-elevated flex items-center justify-center">
            <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No Matchups Available</h3>
          <p className="text-text-secondary max-w-sm">
            No matchup data available for this week. Try a different week or check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {pageHeader}
      {weekNav}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scoreboard.matchups.map((matchup, i) => (
          <MatchupCard key={i} matchup={matchup} />
        ))}
      </div>
    </div>
  );
}
