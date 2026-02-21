"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

// ————— Types —————

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

interface RecordsData {
  currentWeek: number;
  records: StatRecord[];
}

// ————— Card config —————

const SKATER_CARD_CONFIG = [
  { statId: "1", accent: "text-accent-primary", badge: "/badges/goal_badge.png" },
  { statId: "2", accent: "text-accent-info", badge: "/badges/assist_badge.png" },
  { statId: "8", accent: "text-accent-warning", badge: "/badges/ppp_badge.png" },
  { statId: "11", accent: "text-emerald-400", badge: "/badges/shp_badge.png" },
  { statId: "14", accent: "text-sky-400", badge: "/badges/sog_badge.png" },
  { statId: "31", accent: "text-accent-danger", badge: "/badges/hit_badge.png" },
  { statId: "32", accent: "text-purple-400", badge: "/badges/blk_badge.png" },
];

const GOALIE_CARD_CONFIG = [
  { statId: "19", accent: "text-accent-success" },
  { statId: "23", accent: "text-accent-info" },
  { statId: "26", accent: "text-teal-400" },
  { statId: "27", accent: "text-amber-400" },
];

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

function CardHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center px-5 pt-4 pb-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">
        {title}
      </h2>
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

// ————— Record Card —————

function RecordCard({
  record,
  accent,
  delay = 0,
  isLoading,
  badge,
}: {
  record: StatRecord | undefined;
  accent: string;
  delay?: number;
  isLoading: boolean;
  badge?: string;
}) {
  // Loading state
  if (isLoading || !record) {
    return (
      <CardShell delay={delay}>
        <CardHeader title={record?.label || "Loading..."} />
        <div className="px-5 pb-5">
          <div className="flex flex-col items-center py-2">
            <Shimmer className="h-10 w-16 rounded mb-2" />
            <Shimmer className="h-3 w-24 rounded mb-4" />
            <div className="w-full space-y-2">
              <div className="flex items-center gap-2.5">
                <Shimmer className="w-7 h-7 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Shimmer className="h-4 w-28 rounded" />
                  <Shimmer className="h-3 w-14 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardShell>
    );
  }

  // No records yet (e.g., all values are 0 for a "higher is better" stat)
  const hasRecord =
    record.holders.length > 0 &&
    !(record.holders[0].value === 0 && !record.lowerIsBetter);

  if (!hasRecord) {
    return (
      <CardShell delay={delay}>
        <CardHeader title={record.label} />
        <div className="px-5 pb-5 flex flex-col items-center py-4">
          <div
            className={`text-3xl font-mono font-bold ${accent} opacity-15 mb-1`}
          >
            --
          </div>
          <p className="text-[11px] text-text-muted">No records set yet</p>
        </div>
      </CardShell>
    );
  }

  const primary = record.holders[0];
  const isTied = record.holders.length > 1;

  return (
    <CardShell delay={delay}>
      <CardHeader title={record.label} />
      <div className="px-5 pb-5">
        {/* Badge + record value */}
        {badge ? (
          <div className="flex items-center gap-4 mb-3">
            <img
              src={badge}
              alt=""
              className="w-14 h-14 shrink-0"
            />
            <div>
              <div
                className={`text-4xl font-mono font-bold ${accent} leading-none`}
              >
                {primary.displayValue}
              </div>
              <div className="text-[10px] text-text-muted uppercase tracking-wide mt-1">
                in a single week
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center mb-3">
            <div
              className={`text-4xl font-mono font-bold ${accent} leading-none`}
            >
              {primary.displayValue}
            </div>
            <div className="text-[10px] text-text-muted uppercase tracking-wide mt-1">
              in a single week
            </div>
          </div>
        )}

        {/* Tied badge */}
        {isTied && (
          <div className="flex justify-center mb-3">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent-warning/15 text-accent-warning">
              {record.holders.length}-WAY TIE
            </span>
          </div>
        )}

        {/* Record holder(s) */}
        <div className="space-y-2">
          {record.holders.map((h) => (
            <div
              key={h.teamKey}
              className="flex items-center gap-2.5"
            >
              {h.logoUrl ? (
                <img
                  src={h.logoUrl}
                  alt=""
                  className="w-7 h-7 rounded-full bg-surface-elevated shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-surface-elevated flex items-center justify-center shrink-0">
                  <span className="text-[10px] text-text-muted">
                    {h.teamName.charAt(0)}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <Link
                  href={`/teams/${h.teamKey.split(".t.")[1]}`}
                  className="text-sm font-medium text-text-primary truncate hover:text-accent-primary transition-colors"
                >
                  {h.teamName}
                </Link>
                <div className="text-xs text-text-muted">
                  Week {(h.weeks ?? []).join(" & ")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  );
}

// ————— Skeleton Grid —————

function RecordsSkeleton() {
  return (
    <>
      <div className="mb-3">
        <Shimmer className="h-4 w-32 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {Array.from({ length: 7 }).map((_, i) => (
          <CardShell key={i} delay={i * 50}>
            <div className="px-5 pt-4 pb-3">
              <Shimmer className="h-3 w-28 rounded" />
            </div>
            <div className="px-5 pb-5 flex flex-col items-center py-2">
              <Shimmer className="h-10 w-16 rounded mb-2" />
              <Shimmer className="h-3 w-24 rounded mb-4" />
              <div className="w-full flex items-center gap-2.5">
                <Shimmer className="w-7 h-7 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Shimmer className="h-4 w-28 rounded" />
                  <Shimmer className="h-3 w-14 rounded" />
                </div>
              </div>
            </div>
          </CardShell>
        ))}
      </div>
      <div className="mb-3">
        <Shimmer className="h-4 w-32 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardShell key={i} delay={(7 + i) * 50}>
            <div className="px-5 pt-4 pb-3">
              <Shimmer className="h-3 w-28 rounded" />
            </div>
            <div className="px-5 pb-5 flex flex-col items-center py-2">
              <Shimmer className="h-10 w-16 rounded mb-2" />
              <Shimmer className="h-3 w-24 rounded mb-4" />
              <div className="w-full flex items-center gap-2.5">
                <Shimmer className="w-7 h-7 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Shimmer className="h-4 w-28 rounded" />
                  <Shimmer className="h-3 w-14 rounded" />
                </div>
              </div>
            </div>
          </CardShell>
        ))}
      </div>
    </>
  );
}

// ————— Main Page —————

export default function RecordsPage() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["records"],
    queryFn: async () => {
      const res = await fetch("/api/records");
      if (res.status === 401) throw new Error("NOT_AUTHENTICATED");
      if (!res.ok) throw new Error("Failed to fetch records");
      return res.json() as Promise<RecordsData>;
    },
  });

  const getRecord = (statId: string) =>
    data?.records.find((r) => r.statId === statId);

  const pageHeader = (
    <div className="mb-8 pt-2">
      <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight mb-1">
        League Records
        <span className="text-accent-primary">.</span>
      </h1>
      <p className="text-text-secondary text-sm md:text-base">
        Best single-week team performances across the season
        {data?.currentWeek ? ` through Week ${data.currentWeek}` : ""}.
      </p>
    </div>
  );

  // Unauthenticated
  const isUnauth =
    isError && error instanceof Error && error.message === "NOT_AUTHENTICATED";
  if (isUnauth) {
    return (
      <div>
        {pageHeader}
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
            Connect your Yahoo Fantasy account to view league records.
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
            Failed to Load Records
          </h3>
          <p className="text-text-secondary max-w-sm mb-4">
            Something went wrong fetching record data. Please try again.
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
        <RecordsSkeleton />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes bentoCardIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {pageHeader}

      {/* Skater Records */}
      <div className="mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          Skater Records
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {SKATER_CARD_CONFIG.map((cfg, i) => (
          <RecordCard
            key={cfg.statId}
            record={getRecord(cfg.statId)}
            accent={cfg.accent}
            badge={"badge" in cfg ? cfg.badge : undefined}
            delay={i * 50}
            isLoading={false}
          />
        ))}
      </div>

      {/* Goalie Records */}
      <div className="mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          Goalie Records
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {GOALIE_CARD_CONFIG.map((cfg, i) => (
          <RecordCard
            key={cfg.statId}
            record={getRecord(cfg.statId)}
            accent={cfg.accent}
            delay={(SKATER_CARD_CONFIG.length + i) * 50}
            isLoading={false}
          />
        ))}
      </div>
    </>
  );
}
