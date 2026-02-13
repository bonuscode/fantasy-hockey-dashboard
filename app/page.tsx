"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";

// ————— Types —————

interface TeamStanding {
  teamKey: string;
  teamId: string;
  name: string;
  logoUrl: string | null;
  rank: number;
  wins: number;
  losses: number;
  ties: number;
  percentage: string;
}

interface PlayerStat {
  statId: string;
  value: string;
}

interface LeaderPlayer {
  name: string;
  nhlTeam: string;
  position: string;
  imageUrl: string | null;
  fantasyTeam: string;
  stats: PlayerStat[];
}

interface MatchupTeam {
  name: string;
  logoUrl: string | null;
  managerName: string;
  teamKey: string;
  stats: { statId: string; value: string }[];
}

interface StatWinnerInfo {
  statId: string;
  winnerTeamKey: string | null;
  isTied: boolean;
}

interface MatchupPreview {
  team1: MatchupTeam;
  team2: MatchupTeam;
  score: { team1Wins: number; team2Wins: number; ties: number };
  statWinners: StatWinnerInfo[];
  status: string;
}

interface MatchupsData {
  week: number;
  matchups: MatchupPreview[];
}

interface StandingsHistoryTeam {
  teamKey: string;
  name: string;
}

interface WeekRecord {
  wins: number;
  losses: number;
  ties: number;
}

interface WeekStandings {
  week: number;
  records: Record<string, WeekRecord>;
}

interface StandingsHistoryData {
  currentWeek: number;
  teams: StandingsHistoryTeam[];
  weeklyStandings: WeekStandings[];
}

// ————— Stat maps (BrewZoo league-specific) —————

const GOALIE_STAT_MAP: Record<string, string> = {
  "19": "W",
  "22": "GA",
  "23": "GAA",
  "24": "SA",
  "25": "SV",
  "26": "SV%",
  "27": "SO",
};

const STAT_LABEL_MAP: Record<string, string> = {
  "1": "G", "2": "A", "8": "PIM", "11": "SHG",
  "14": "SOG", "31": "HIT", "32": "BLK",
  "19": "W", "22": "GA", "23": "GAA",
  "24": "SA", "25": "SV", "26": "SV%", "27": "SO",
};

// ————— Normalization —————

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeStandings(raw: any): TeamStanding[] {
  let teams: unknown[] = [];
  if (Array.isArray(raw)) teams = raw;
  else if (raw?.standings)
    teams = Array.isArray(raw.standings) ? raw.standings : [];
  else if (raw?.league?.standings)
    teams = Array.isArray(raw.league.standings) ? raw.league.standings : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return teams
    .map((team: any) => {
      const ts = team.standings || team.team_standings || {};
      const outcomes = ts.outcome_totals || ts.outcomeTotals || {};
      const logos = team.team_logos || team.teamLogos || [];
      const firstLogo = Array.isArray(logos)
        ? logos[0]?.team_logo?.url || logos[0]?.url || null
        : null;

      return {
        teamKey: team.team_key || team.teamKey || "",
        teamId: String(team.team_id || team.teamId || ""),
        name: team.name || "Unknown Team",
        logoUrl: firstLogo,
        rank: Number(ts.rank || 0),
        wins: Number(outcomes.wins || 0),
        losses: Number(outcomes.losses || 0),
        ties: Number(outcomes.ties || 0),
        percentage: String(outcomes.percentage || ".000"),
      };
    })
    .sort((a, b) => a.rank - b.rank);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAllPlayers(data: any): LeaderPlayer[] {
  const teams = data?.teams || [];
  const allPlayers: LeaderPlayer[] = [];

  for (const team of teams) {
    const teamName = team.teamName || "Unknown Team";
    const raw = team.roster;
    if (!raw) continue;

    let players: unknown[] = [];
    if (Array.isArray(raw)) players = raw;
    else if (raw?.roster?.players) {
      const p = raw.roster.players;
      players = Array.isArray(p)
        ? p
        : Object.values(p).filter((v) => typeof v === "object");
    } else if (raw?.roster) {
      players = Array.isArray(raw.roster) ? raw.roster : [];
    } else if (raw?.players) {
      const p = raw.players;
      players = Array.isArray(p)
        ? p
        : Object.values(p).filter((v) => typeof v === "object");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const p of players as any[]) {
      const player = p?.player || p;
      const name = player?.name || {};
      const fullName =
        name?.full ||
        name?.ascii_full ||
        `${name?.first || ""} ${name?.last || ""}`.trim() ||
        "Unknown";

      const eligiblePositions = (
        player?.eligible_positions ||
        player?.eligiblePositions ||
        []
      )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((ep: any) => ep?.position || ep)
        .filter(Boolean);

      const headshot =
        player?.headshot?.url ||
        player?.image_url ||
        player?.imageUrl ||
        null;

      const rawStats = player?.player_stats?.stats || player?.stats || [];
      const stats: PlayerStat[] = (
        Array.isArray(rawStats) ? rawStats : []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ).map((s: any) => ({
        statId: String(s?.stat?.stat_id || s?.stat_id || s?.statId || ""),
        value: String(s?.stat?.value ?? s?.value ?? ""),
      }));

      allPlayers.push({
        name: fullName,
        nhlTeam: player?.editorial_team_abbr || player?.team || "",
        position:
          player?.display_position ||
          player?.primary_position ||
          eligiblePositions[0] ||
          "",
        imageUrl: headshot,
        fantasyTeam: teamName,
        stats,
      });
    }
  }

  return allPlayers;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeMatchups(raw: any): MatchupsData | null {
  const scoreboard =
    raw?.scoreboard || raw?.league?.scoreboard || raw;
  const week = Number(scoreboard?.week || raw?.week || 0);

  let rawMatchups: unknown[] = [];
  if (scoreboard?.matchups) {
    rawMatchups = Array.isArray(scoreboard.matchups)
      ? scoreboard.matchups
      : Object.values(scoreboard.matchups).filter(
          (v) => typeof v === "object"
        );
  }

  if (rawMatchups.length === 0) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractTeam = (raw: any): MatchupTeam => {
    const t = raw?.team || raw;
    const managers = t?.managers || [];
    const firstManager = Array.isArray(managers)
      ? managers[0]?.manager || managers[0]
      : managers;
    const logos = t?.team_logos || t?.teamLogos || [];
    const firstLogo = Array.isArray(logos)
      ? logos[0]?.team_logo?.url || logos[0]?.url || null
      : null;
    const rawStats = t?.team_stats?.stats || t?.stats || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stats = (Array.isArray(rawStats) ? rawStats : []).map((s: any) => ({
      statId: String(s?.stat?.stat_id || s?.stat_id || s?.statId || ""),
      value: String(s?.stat?.value ?? s?.value ?? ""),
    }));
    return {
      name: t?.name || "Unknown Team",
      logoUrl: firstLogo,
      managerName: firstManager?.nickname || firstManager?.name || "",
      teamKey: t?.team_key || t?.teamKey || "",
      stats,
    };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchups: MatchupPreview[] = rawMatchups.map((m: any) => {
    const matchup = m?.matchup || m;
    const rawTeams = matchup?.teams || matchup?.matchup_teams || [];
    const teamsArr = Array.isArray(rawTeams)
      ? rawTeams
      : Object.values(rawTeams).filter((v) => typeof v === "object");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const teams = teamsArr.map((t: any) => extractTeam(t?.team || t));

    const rawWinners = matchup?.stat_winners || matchup?.statWinners || [];
    let team1Wins = 0,
      team2Wins = 0,
      ties = 0;

    const statWinners: StatWinnerInfo[] = [];
    for (const sw of Array.isArray(rawWinners) ? rawWinners : []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const winner = (sw as any)?.stat_winner || sw;
      const isTied =
        winner?.is_tied === "1" || winner?.is_tied === 1;
      const winnerKey =
        winner?.winner_team_key || winner?.winnerTeamKey || null;
      const statId = String(winner?.stat_id || winner?.statId || "");
      statWinners.push({ statId, winnerTeamKey: winnerKey, isTied });
      if (isTied) ties++;
      else if (winnerKey === teams[0]?.teamKey) team1Wins++;
      else if (winnerKey === teams[1]?.teamKey) team2Wins++;
    }

    return {
      team1: teams[0] || { name: "TBD", logoUrl: null, managerName: "", teamKey: "" },
      team2: teams[1] || { name: "TBD", logoUrl: null, managerName: "", teamKey: "" },
      score: { team1Wins, team2Wins, ties },
      statWinners,
      status: matchup?.status || "preevent",
    };
  });

  return { week, matchups };
}

// ————— Helpers —————

function getStatValue(stats: PlayerStat[], statId: string): number {
  const stat = stats.find((s) => s.statId === statId);
  if (!stat || stat.value === "" || stat.value === "-") return 0;
  return parseFloat(stat.value) || 0;
}

function getRankColor(rank: number) {
  if (rank === 1) return "text-amber-400";
  if (rank === 2) return "text-gray-300";
  if (rank === 3) return "text-amber-600";
  return "text-text-muted";
}

function getStatusLabel(status: string) {
  switch (status) {
    case "postevent":
      return "Final";
    case "midevent":
      return "Live";
    default:
      return "Upcoming";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "postevent":
      return "bg-accent-success/15 text-accent-success";
    case "midevent":
      return "bg-accent-warning/15 text-accent-warning";
    default:
      return "bg-surface-elevated text-text-secondary";
  }
}

// ————— Shared Components —————

function CardShell({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={`relative bg-surface border border-border rounded-xl overflow-hidden transition-all duration-300 hover:border-accent-primary/20 ${className}`}
      style={{
        animationDelay: `${delay}ms`,
        animation: "bentoCardIn 0.5s ease-out both",
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({
  title,
  href,
  badge,
}: {
  title: string;
  href?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-5 pt-4 pb-3">
      <div className="flex items-center gap-2.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
          {title}
        </h2>
        {badge}
      </div>
      {href && (
        <Link
          href={href}
          className="text-[11px] text-text-muted hover:text-accent-primary transition-colors flex items-center gap-1 group/link"
        >
          View all
          <svg
            className="w-3 h-3 transition-transform group-hover/link:translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      )}
    </div>
  );
}

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-surface-elevated/60 rounded animate-pulse ${className}`}
    />
  );
}

function CardError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="w-9 h-9 rounded-full bg-accent-danger/10 flex items-center justify-center mb-2">
        <svg
          className="w-4.5 h-4.5 text-accent-danger"
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
      <p className="text-xs text-text-secondary mb-2">Failed to load</p>
      <button
        onClick={onRetry}
        className="text-xs font-medium text-accent-primary hover:text-accent-primary/80 transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

function PlaceholderState({
  icon,
  text,
}: {
  icon: string;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="w-10 h-10 rounded-full bg-surface-elevated/60 flex items-center justify-center mb-3">
        <svg
          className="w-5 h-5 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d={icon}
          />
        </svg>
      </div>
      <p className="text-sm text-text-secondary">{text}</p>
    </div>
  );
}

// ————— Standings Card —————

function StandingsCard({
  standings,
  isLoading,
  isUnauth,
  isError,
  onRetry,
}: {
  standings: TeamStanding[] | undefined;
  isLoading: boolean;
  isUnauth: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  if (isError) {
    return (
      <CardShell className="md:col-span-2" delay={0}>
        <CardHeader title="Standings" href="/standings" />
        <div className="px-5 pb-5">
          <CardError onRetry={onRetry} />
        </div>
      </CardShell>
    );
  }

  if (isUnauth) {
    return (
      <CardShell className="md:col-span-2" delay={0}>
        <CardHeader title="Standings" href="/standings" />
        <div className="px-5 pb-5">
          <PlaceholderState
            icon="M3 4h18M3 8h18M3 12h18M3 16h10"
            text="Connect Yahoo to see live standings"
          />
        </div>
      </CardShell>
    );
  }

  if (isLoading || !standings) {
    return (
      <CardShell className="md:col-span-2" delay={0}>
        <CardHeader title="Standings" href="/standings" />
        <div className="px-5 pb-5 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Shimmer className="w-5 h-5 rounded" />
              <Shimmer className="w-6 h-6 rounded-full" />
              <Shimmer className="flex-1 h-4 rounded" />
              <Shimmer className="w-16 h-4 rounded" />
              <Shimmer className="w-20 h-2 rounded-full" />
            </div>
          ))}
        </div>
      </CardShell>
    );
  }

  const top = standings.slice(0, 6);

  return (
    <CardShell className="md:col-span-2" delay={0}>
      <CardHeader title="Standings" href="/standings" />
      <div className="px-5 pb-5 space-y-1">
        {top.map((team) => {
          const total = team.wins + team.losses + team.ties;
          const wPct = total > 0 ? (team.wins / total) * 100 : 0;
          const tPct = total > 0 ? (team.ties / total) * 100 : 0;
          const lPct = total > 0 ? (team.losses / total) * 100 : 0;
          return (
            <Link
              key={team.teamKey || team.teamId}
              href={`/teams/${team.teamId}`}
              className="flex items-center gap-3 -mx-2 px-2 py-2 rounded-lg hover:bg-surface-elevated/50 transition-colors group/row"
            >
              <span
                className={`text-xs font-bold font-mono w-5 text-center shrink-0 ${getRankColor(team.rank)}`}
              >
                {team.rank}
              </span>
              {team.logoUrl ? (
                <img
                  src={team.logoUrl}
                  alt=""
                  className="w-6 h-6 rounded-full bg-surface-elevated shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center shrink-0">
                  <span className="text-[9px] text-text-muted">
                    {team.name.charAt(0)}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium text-text-primary truncate min-w-0 flex-1 group-hover/row:text-accent-primary transition-colors">
                {team.name}
              </span>
              <span className="text-xs font-mono text-text-secondary shrink-0 w-16 text-right">
                {team.wins}-{team.losses}-{team.ties}
              </span>
              <div className="w-24 shrink-0 hidden sm:block">
                <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden flex">
                  {wPct > 0 && (
                    <div
                      className="h-full bg-accent-success transition-all duration-700 ease-out"
                      style={{ width: `${wPct}%` }}
                    />
                  )}
                  {tPct > 0 && (
                    <div
                      className="h-full bg-accent-warning transition-all duration-700 ease-out"
                      style={{ width: `${tPct}%` }}
                    />
                  )}
                  {lPct > 0 && (
                    <div
                      className="h-full bg-accent-danger transition-all duration-700 ease-out"
                      style={{ width: `${lPct}%` }}
                    />
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </CardShell>
  );
}

// ————— Player Leader Card —————

function PlayerLeaderCard({
  title,
  statId,
  statLabel,
  accentClass,
  players,
  isLoading,
  isUnauth,
  isError,
  onRetry,
  count = 1,
  delay = 0,
}: {
  title: string;
  statId: string;
  statLabel: string;
  accentClass: string;
  players: LeaderPlayer[] | undefined;
  isLoading: boolean;
  isUnauth: boolean;
  isError: boolean;
  onRetry: () => void;
  count?: number;
  delay?: number;
}) {
  const leaders = useMemo(() => {
    if (!players) return null;
    const isGoalieStat = !!GOALIE_STAT_MAP[statId];
    const filtered = players.filter((p) => {
      const isG = p.position === "G" || p.position.includes("G");
      return isGoalieStat ? isG : !isG;
    });
    if (filtered.length === 0) return null;
    const lowerBetter = statId === "23" || statId === "22";
    return [...filtered]
      .sort((a, b) => {
        const va = getStatValue(a.stats, statId);
        const vb = getStatValue(b.stats, statId);
        return lowerBetter ? va - vb : vb - va;
      })
      .slice(0, count);
  }, [players, statId, count]);

  if (isError) {
    return (
      <CardShell delay={delay}>
        <CardHeader title={title} />
        <div className="px-5 pb-5">
          <CardError onRetry={onRetry} />
        </div>
      </CardShell>
    );
  }

  if (isUnauth) {
    return (
      <CardShell delay={delay}>
        <CardHeader title={title} />
        <div className="px-5 pb-5 flex flex-col items-center py-4">
          <div
            className={`text-4xl font-mono font-bold ${accentClass} opacity-15 mb-1`}
          >
            --
          </div>
          <p className="text-[11px] text-text-muted uppercase tracking-wide">
            {statLabel}
          </p>
        </div>
      </CardShell>
    );
  }

  if (isLoading || !leaders || leaders.length === 0) {
    return (
      <CardShell delay={delay}>
        <CardHeader title={title} />
        <div className="px-5 pb-5 space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Shimmer className="w-9 h-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Shimmer className="h-4 w-24 rounded" />
                <Shimmer className="h-3 w-16 rounded" />
              </div>
              <Shimmer className="h-7 w-12 rounded" />
            </div>
          ))}
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell delay={delay}>
      <CardHeader title={title} href="/players" />
      <div className="px-5 pb-5 space-y-2.5">
        {leaders.map((leader, i) => {
          const stat = leader.stats.find((s) => s.statId === statId);
          const value = stat?.value || "-";
          const isFirst = i === 0;

          return (
            <div
              key={leader.name + leader.nhlTeam}
              className={`flex items-center gap-3 ${!isFirst ? "-mx-2 px-2 py-1 rounded-lg" : ""}`}
            >
              {count > 1 && (
                <span
                  className={`text-xs font-bold font-mono w-4 text-center shrink-0 ${
                    i === 0
                      ? "text-amber-400"
                      : i === 1
                        ? "text-gray-300"
                        : "text-amber-600"
                  }`}
                >
                  {i + 1}
                </span>
              )}
              {leader.imageUrl ? (
                <img
                  src={leader.imageUrl}
                  alt=""
                  className={`rounded-full bg-surface-elevated shrink-0 ${isFirst ? "w-11 h-14 ring-2 ring-border" : "w-8 h-10"}`}
                />
              ) : (
                <div
                  className={`rounded-full bg-surface-elevated flex items-center justify-center shrink-0 ${isFirst ? "w-11 h-14 ring-2 ring-border" : "w-8 h-10"}`}
                >
                  <span
                    className={`text-text-muted ${isFirst ? "text-sm" : "text-xs"}`}
                  >
                    {leader.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div
                  className={`font-medium text-text-primary truncate ${isFirst ? "text-sm" : "text-xs"}`}
                >
                  {leader.name}
                </div>
                <div
                  className={`text-text-muted ${isFirst ? "text-xs" : "text-[11px]"}`}
                >
                  {leader.nhlTeam} · {leader.position}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div
                  className={`font-mono font-bold ${accentClass} leading-none ${isFirst ? "text-2xl" : "text-base"}`}
                >
                  {value}
                </div>
                {isFirst && (
                  <div className="text-[10px] text-text-muted uppercase tracking-wide mt-0.5">
                    {statLabel}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}

// ————— Matchup Preview Card —————

function TeamLogo({ team }: { team: MatchupTeam }) {
  if (team.logoUrl) {
    return (
      <img
        src={team.logoUrl}
        alt=""
        className="w-10 h-10 rounded-full bg-surface-elevated shrink-0"
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center shrink-0">
      <span className="text-sm text-text-muted">
        {team.name.charAt(0)}
      </span>
    </div>
  );
}

function MatchupSlide({ matchup }: { matchup: MatchupPreview }) {
  const { team1, team2, score, statWinners } = matchup;

  return (
    <div className="space-y-3">
      {/* Teams + Score */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <TeamLogo team={team1} />
          <div className="min-w-0">
            <div className="text-sm font-medium text-text-primary truncate">
              {team1.name}
            </div>
            {team1.managerName && (
              <div className="text-xs text-text-muted truncate">
                {team1.managerName}
              </div>
            )}
          </div>
        </div>

        <div className="px-3 shrink-0 text-center">
          <div className="font-mono font-bold text-xl text-text-primary leading-none">
            <span className={score.team1Wins > score.team2Wins ? "text-accent-success" : ""}>
              {score.team1Wins}
            </span>
            <span className="text-text-muted mx-1.5 text-base">-</span>
            <span className={score.team2Wins > score.team1Wins ? "text-accent-success" : ""}>
              {score.team2Wins}
            </span>
            <span className="text-text-muted mx-1.5 text-base">-</span>
            <span className="text-text-secondary">{score.ties}</span>
          </div>
          <div className="text-[10px] text-text-muted mt-1">W - L - T</div>
        </div>

        <div className="flex items-center gap-3 min-w-0 flex-1 justify-end">
          <div className="min-w-0 text-right">
            <div className="text-sm font-medium text-text-primary truncate">
              {team2.name}
            </div>
            {team2.managerName && (
              <div className="text-xs text-text-muted truncate">
                {team2.managerName}
              </div>
            )}
          </div>
          <TeamLogo team={team2} />
        </div>
      </div>

      {/* Category rows */}
      {statWinners.length > 0 && (
        <div className="border-t border-border pt-2">
          <div className="border border-border rounded-md overflow-hidden divide-y divide-border">
            {statWinners.map((sw) => {
              const label = STAT_LABEL_MAP[sw.statId] || sw.statId;
              const t1Won = !sw.isTied && sw.winnerTeamKey === team1.teamKey;
              const t2Won = !sw.isTied && sw.winnerTeamKey === team2.teamKey;
              return (
                <div key={sw.statId} className="flex items-center">
                  <div
                    className={`flex-1 h-5 ${t1Won ? "bg-accent-success/10" : ""}`}
                  >
                    {t1Won && (
                      <div className="h-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-success" />
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-mono font-semibold w-10 text-center shrink-0 border-x border-border ${
                      sw.isTied ? "text-text-muted" : "text-text-primary"
                    }`}
                  >
                    {label}
                  </span>
                  <div
                    className={`flex-1 h-5 ${t2Won ? "bg-accent-success/10" : ""}`}
                  >
                    {t2Won && (
                      <div className="h-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-success" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MatchupPreviewCard({
  matchupsData,
  isLoading,
  isUnauth,
  isError,
  onRetry,
}: {
  matchupsData: MatchupsData | null | undefined;
  isLoading: boolean;
  isUnauth: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [animKey, setAnimKey] = useState(0);

  const matchups = matchupsData?.matchups ?? [];
  const week = matchupsData?.week ?? 0;
  const current = matchups[index] ?? null;
  const total = matchups.length;

  function goLeft() {
    if (index <= 0) return;
    setDirection("left");
    setAnimKey((k) => k + 1);
    setIndex((i) => i - 1);
  }

  function goRight() {
    if (index >= total - 1) return;
    setDirection("right");
    setAnimKey((k) => k + 1);
    setIndex((i) => i + 1);
  }

  if (isError) {
    return (
      <CardShell className="md:col-span-2" delay={200}>
        <CardHeader title="This Week" href="/matchups" />
        <div className="px-5 pb-5">
          <CardError onRetry={onRetry} />
        </div>
      </CardShell>
    );
  }

  if (isUnauth) {
    return (
      <CardShell className="md:col-span-2" delay={200}>
        <CardHeader title="This Week" href="/matchups" />
        <div className="px-5 pb-5">
          <PlaceholderState
            icon="M13 10V3L4 14h7v7l9-11h-7z"
            text="Connect to view live matchups"
          />
        </div>
      </CardShell>
    );
  }

  if (isLoading || !current) {
    return (
      <CardShell className="md:col-span-2" delay={200}>
        <CardHeader title="This Week" href="/matchups" />
        <div className="px-5 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shimmer className="w-10 h-10 rounded-full" />
              <div className="space-y-1.5">
                <Shimmer className="h-4 w-28 rounded" />
                <Shimmer className="h-3 w-16 rounded" />
              </div>
            </div>
            <Shimmer className="h-8 w-24 rounded" />
            <div className="flex items-center gap-3">
              <div className="space-y-1.5">
                <Shimmer className="h-4 w-28 rounded ml-auto" />
                <Shimmer className="h-3 w-16 rounded ml-auto" />
              </div>
              <Shimmer className="w-10 h-10 rounded-full" />
            </div>
          </div>
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell className="md:col-span-2" delay={200}>
      <CardHeader
        title={`Week ${week}`}
        href="/matchups"
        badge={
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStatusColor(current.status)}`}
          >
            {getStatusLabel(current.status)}
          </span>
        }
      />
      <div className="px-2 pb-4">
        <div className="flex items-center gap-1">
          {/* Left arrow */}
          <button
            onClick={goLeft}
            disabled={index <= 0}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated disabled:opacity-20 disabled:cursor-not-allowed transition-colors shrink-0"
            aria-label="Previous matchup"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Matchup content */}
          <div className="flex-1 overflow-hidden px-2">
            <div
              key={animKey}
              className="matchup-slide"
              style={{
                animation: `matchupSlide${direction === "right" ? "Right" : "Left"} 0.25s ease-out both`,
              }}
            >
              <MatchupSlide matchup={current} />
            </div>
          </div>

          {/* Right arrow */}
          <button
            onClick={goRight}
            disabled={index >= total - 1}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated disabled:opacity-20 disabled:cursor-not-allowed transition-colors shrink-0"
            aria-label="Next matchup"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Dot indicators */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {matchups.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setDirection(i > index ? "right" : "left");
                  setAnimKey((k) => k + 1);
                  setIndex(i);
                }}
                className={`rounded-full transition-all duration-200 ${
                  i === index
                    ? "w-4 h-1.5 bg-accent-primary"
                    : "w-1.5 h-1.5 bg-border hover:bg-text-muted"
                }`}
                aria-label={`Matchup ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </CardShell>
  );
}

// ————— Weekly Stat Pie Chart Card —————

const PIE_COLORS = [
  "#0ea5e9", "#f59e0b", "#10b981", "#ef4444",
  "#06b6d4", "#f97316", "#8b5cf6", "#ec4899",
  "#14b8a6", "#eab308", "#3b82f6", "#e11d48",
];

function aggregateTeamStat(
  matchups: MatchupPreview[],
  statId: string
): { name: string; value: number }[] {
  const seen = new Set<string>();
  const result: { name: string; value: number }[] = [];
  for (const m of matchups) {
    for (const team of [m.team1, m.team2]) {
      if (seen.has(team.teamKey)) continue;
      seen.add(team.teamKey);
      const stat = team.stats.find((s) => s.statId === statId);
      const val = stat ? parseFloat(stat.value) || 0 : 0;
      result.push({ name: team.name, value: val });
    }
  }
  return result.sort((a, b) => b.value - a.value);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PieTooltipContent({ active, payload }: any) {
  if (!active || !payload?.[0]) return null;
  const { name, value } = payload[0].payload;
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-text-primary">{name}</p>
      <p className="text-sm font-mono font-bold text-text-primary">{value}</p>
    </div>
  );
}

function WeeklyStatPieCard({
  title,
  statId,
  statLabel,
  matchupsData,
  isLoading,
  isUnauth,
  isError,
  onRetry,
  teamColorMap,
  delay = 0,
}: {
  title: string;
  statId: string;
  statLabel: string;
  matchupsData: MatchupsData | null | undefined;
  isLoading: boolean;
  isUnauth: boolean;
  isError: boolean;
  onRetry: () => void;
  teamColorMap: Record<string, string>;
  delay?: number;
}) {
  const data = useMemo(() => {
    if (!matchupsData?.matchups) return [];
    return aggregateTeamStat(matchupsData.matchups, statId);
  }, [matchupsData, statId]);

  const allZero = data.length === 0 || data.every((d) => d.value === 0);

  if (isError) {
    return (
      <CardShell delay={delay}>
        <CardHeader title={title} href="/matchups" />
        <div className="px-5 pb-5">
          <CardError onRetry={onRetry} />
        </div>
      </CardShell>
    );
  }

  if (isUnauth) {
    return (
      <CardShell delay={delay}>
        <CardHeader title={title} href="/matchups" />
        <div className="px-5 pb-5">
          <PlaceholderState
            icon="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
            text={`Connect to view ${statLabel.toLowerCase()}`}
          />
        </div>
      </CardShell>
    );
  }

  if (isLoading) {
    return (
      <CardShell delay={delay}>
        <CardHeader title={title} href="/matchups" />
        <div className="px-5 pb-5 flex items-center justify-center py-6">
          <Shimmer className="w-28 h-28 rounded-full" />
        </div>
      </CardShell>
    );
  }

  if (allZero) {
    return (
      <CardShell delay={delay}>
        <CardHeader title={title} href="/matchups" />
        <div className="px-5 pb-5">
          <PlaceholderState
            icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            text={`No ${statLabel.toLowerCase()} yet this week`}
          />
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell delay={delay}>
      <CardHeader title={title} href="/matchups" />
      <div className="flex items-start px-3 pb-4">
        {/* Pie chart — prominent left */}
        <div className="shrink-0 w-[120px] h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={56}
                innerRadius={22}
                paddingAngle={2}
                strokeWidth={0}
              >
                {data.map((d) => (
                  <Cell
                    key={d.name}
                    fill={teamColorMap[d.name] || PIE_COLORS[0]}
                  />
                ))}
              </Pie>
              <Tooltip content={<PieTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Team list — tight right column */}
        <div className="flex-1 min-w-0 space-y-0.5 pt-1 pl-1">
          {data.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: teamColorMap[d.name] || PIE_COLORS[0] }}
              />
              <span className="text-[10px] text-text-muted truncate min-w-0 flex-1 leading-tight">
                {d.name}
              </span>
              <span className="text-[10px] font-mono font-semibold text-text-primary shrink-0 tabular-nums">
                {d.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  );
}

// ————— Standings Over Time Card —————

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LineTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  // Sort by wins descending in tooltip
  const sorted = [...payload].sort(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: any, b: any) => (b.value as number) - (a.value as number)
  );
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2.5 shadow-lg max-h-64 overflow-y-auto">
      <p className="text-[11px] font-semibold text-text-muted mb-1.5">
        Week {label}
      </p>
      <div className="space-y-1">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {sorted.map((entry: any) => {
          const record = entry.payload?.[`_record_${entry.dataKey?.replace("_wins", "")}`];
          return (
            <div key={entry.dataKey} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-[11px] text-text-primary truncate min-w-0 flex-1">
                {entry.name}
              </span>
              <span className="text-[11px] font-mono font-semibold text-text-primary shrink-0">
                {record
                  ? `${record.wins}-${record.losses}-${record.ties}`
                  : entry.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StandingsOverTimeCard({
  historyData,
  isLoading,
  isUnauth,
  teamColorMap,
}: {
  historyData: StandingsHistoryData | null | undefined;
  isLoading: boolean;
  isUnauth: boolean;
  teamColorMap: Record<string, string>;
}) {
  const chartData = useMemo(() => {
    if (!historyData?.weeklyStandings?.length || !historyData?.teams?.length) return [];

    return historyData.weeklyStandings.map((ws) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const point: Record<string, any> = { week: ws.week };
      for (const team of historyData.teams) {
        const record = ws.records[team.teamKey];
        if (record) {
          // Use teamKey as data key (sanitized) and store wins
          const key = team.teamKey.replace(/\./g, "_");
          point[`${key}_wins`] = record.wins;
          // Stash full record for tooltip
          point[`_record_${key}`] = record;
        }
      }
      return point;
    });
  }, [historyData]);

  const teamLines = useMemo(() => {
    if (!historyData?.teams) return [];
    return historyData.teams.map((team) => ({
      teamKey: team.teamKey,
      dataKey: `${team.teamKey.replace(/\./g, "_")}_wins`,
      name: team.name,
      color: teamColorMap[team.name] || PIE_COLORS[0],
    }));
  }, [historyData, teamColorMap]);

  if (isUnauth) {
    return (
      <CardShell className="md:col-span-3" delay={400}>
        <CardHeader title="Season Trend" href="/standings" />
        <div className="px-5 pb-5">
          <PlaceholderState
            icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            text="Connect Yahoo to see season trends"
          />
        </div>
      </CardShell>
    );
  }

  if (isLoading || !chartData.length) {
    return (
      <CardShell className="md:col-span-3" delay={400}>
        <CardHeader title="Season Trend" href="/standings" />
        <div className="px-5 pb-5 flex items-center justify-center py-8">
          <Shimmer className="w-full h-48 rounded-lg" />
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell className="md:col-span-3" delay={400}>
      <CardHeader title="Season Trend" href="/standings" />
      <div className="px-2 pb-4 pr-5">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: -12 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              opacity={0.5}
            />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
              label={{ value: "Week", position: "insideBottomRight", offset: -4, fontSize: 10, fill: "var(--color-text-muted)" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
              tickLine={false}
              axisLine={{ stroke: "var(--color-border)" }}
              allowDecimals={false}
              label={{ value: "Wins", angle: -90, position: "insideLeft", offset: 20, fontSize: 10, fill: "var(--color-text-muted)" }}
            />
            <Tooltip content={<LineTooltipContent />} />
            <Legend
              wrapperStyle={{ fontSize: "10px", paddingTop: "8px" }}
              iconType="circle"
              iconSize={6}
            />
            {teamLines.map((tl) => (
              <Line
                key={tl.dataKey}
                type="monotone"
                dataKey={tl.dataKey}
                name={tl.name}
                stroke={tl.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardShell>
  );
}

// ————— Main Page —————

export default function Home() {
  const { data: authStatus, isLoading: authLoading } = useQuery({
    queryKey: ["auth-status"],
    queryFn: async () => {
      const res = await fetch("/api/auth/status");
      return res.json() as Promise<{ authenticated: boolean }>;
    },
  });

  const isAuthenticated = authStatus?.authenticated ?? false;
  const isUnauth = !authLoading && !isAuthenticated;

  const {
    data: standings,
    isLoading: standingsLoading,
    isError: standingsError,
    refetch: refetchStandings,
  } = useQuery({
    queryKey: ["standings"],
    queryFn: async () => {
      const res = await fetch("/api/league/standings");
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch standings");
      const raw = await res.json();
      return normalizeStandings(raw);
    },
    enabled: isAuthenticated,
  });

  const {
    data: allPlayers,
    isLoading: playersLoading,
    isError: playersError,
    refetch: refetchPlayers,
  } = useQuery({
    queryKey: ["all-players"],
    queryFn: async () => {
      const res = await fetch("/api/players/stats");
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch players");
      const raw = await res.json();
      return normalizeAllPlayers(raw);
    },
    enabled: isAuthenticated,
  });

  const {
    data: matchupsData,
    isLoading: matchupsLoading,
    isError: matchupsError,
    refetch: refetchMatchups,
  } = useQuery({
    queryKey: ["matchup-preview"],
    queryFn: async () => {
      const res = await fetch("/api/matchups");
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch matchups");
      const raw = await res.json();
      return normalizeMatchups(raw);
    },
    enabled: isAuthenticated,
  });

  const { data: standingsHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["standings-history"],
    queryFn: async () => {
      const res = await fetch("/api/league/standings-history");
      if (res.status === 401) return null;
      if (!res.ok) return null;
      return (await res.json()) as StandingsHistoryData;
    },
    enabled: isAuthenticated,
  });

  // Stable team→color mapping so pie charts and line chart use the same color per team
  const teamColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    let idx = 0;
    // Seed from matchups data first (original source)
    if (matchupsData?.matchups) {
      for (const m of matchupsData.matchups) {
        for (const team of [m.team1, m.team2]) {
          if (!map[team.name]) {
            map[team.name] = PIE_COLORS[idx % PIE_COLORS.length];
            idx++;
          }
        }
      }
    }
    // Also seed from standings history (in case matchups hasn't loaded yet)
    if (standingsHistory?.teams) {
      for (const team of standingsHistory.teams) {
        if (!map[team.name]) {
          map[team.name] = PIE_COLORS[idx % PIE_COLORS.length];
          idx++;
        }
      }
    }
    return map;
  }, [matchupsData, standingsHistory]);

  return (
    <>
      <style>{`
        @keyframes bentoCardIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes matchupSlideRight {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes matchupSlideLeft {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Hero */}
      <div className="mb-8 pt-2">
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight mb-1">
          League Dashboard
          <span className="text-accent-primary">.</span>
        </h1>
        <p className="text-text-secondary text-sm md:text-base">
          Live stats, standings, and matchups for your league.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Row 1: Standings (2 cols) + Goals Leader */}
        <StandingsCard
          standings={standings ?? undefined}
          isLoading={isAuthenticated && standingsLoading}
          isUnauth={isUnauth}
          isError={standingsError}
          onRetry={() => refetchStandings()}
        />
        <PlayerLeaderCard
          title="Goal Leader"
          statId="1"
          statLabel="Goals"
          accentClass="text-accent-primary"
          players={allPlayers ?? undefined}
          isLoading={isAuthenticated && playersLoading}
          isUnauth={isUnauth}
          isError={playersError}
          onRetry={() => refetchPlayers()}
          count={3}
          delay={100}
        />

        {/* Row 2: Assists Leader + Matchup Preview (2 cols) */}
        <PlayerLeaderCard
          title="Assist Leader"
          statId="2"
          statLabel="Assists"
          accentClass="text-accent-info"
          players={allPlayers ?? undefined}
          isLoading={isAuthenticated && playersLoading}
          isUnauth={isUnauth}
          isError={playersError}
          onRetry={() => refetchPlayers()}
          count={3}
          delay={150}
        />
        <MatchupPreviewCard
          matchupsData={matchupsData}
          isLoading={isAuthenticated && matchupsLoading}
          isUnauth={isUnauth}
          isError={matchupsError}
          onRetry={() => refetchMatchups()}
        />

        {/* Row 3: Top Goalie + Goals Pie + Assists Pie */}
        <PlayerLeaderCard
          title="Top Goalie"
          statId="26"
          statLabel="SV%"
          accentClass="text-accent-success"
          players={allPlayers ?? undefined}
          isLoading={isAuthenticated && playersLoading}
          isUnauth={isUnauth}
          isError={playersError}
          onRetry={() => refetchPlayers()}
          count={3}
          delay={250}
        />
        <WeeklyStatPieCard
          title={matchupsData?.week ? `Week ${matchupsData.week} Goals` : "Goals by Team"}
          statId="1"
          statLabel="Goals"
          matchupsData={matchupsData}
          isLoading={isAuthenticated && matchupsLoading}
          isUnauth={isUnauth}
          isError={matchupsError}
          onRetry={() => refetchMatchups()}
          teamColorMap={teamColorMap}
          delay={300}
        />
        <WeeklyStatPieCard
          title={matchupsData?.week ? `Week ${matchupsData.week} Assists` : "Assists by Team"}
          statId="2"
          statLabel="Assists"
          matchupsData={matchupsData}
          isLoading={isAuthenticated && matchupsLoading}
          isUnauth={isUnauth}
          isError={matchupsError}
          onRetry={() => refetchMatchups()}
          teamColorMap={teamColorMap}
          delay={350}
        />

        {/* Row 4: Standings Over Time (full width) */}
        <StandingsOverTimeCard
          historyData={standingsHistory}
          isLoading={isAuthenticated && historyLoading}
          isUnauth={isUnauth}
          teamColorMap={teamColorMap}
        />
      </div>
    </>
  );
}
