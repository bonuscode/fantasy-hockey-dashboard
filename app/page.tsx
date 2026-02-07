"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

const features = [
  {
    title: "League Standings",
    description: "View current rankings, W-L-T records, and points totals.",
    href: "/standings",
  },
  {
    title: "Player Stats",
    description:
      "Leaderboards, hot/cold players, and performance trends.",
    href: "/players",
  },
  {
    title: "Weekly Matchups",
    description: "Head-to-head comparisons and scoring breakdowns.",
    href: "/matchups",
  },
];

export default function Home() {
  const { data: authStatus, isLoading } = useQuery({
    queryKey: ["auth-status"],
    queryFn: async () => {
      const res = await fetch("/api/auth/status");
      return res.json() as Promise<{ authenticated: boolean }>;
    },
  });

  const isAuthenticated = authStatus?.authenticated ?? false;

  return (
    <div>
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Fantasy Hockey Dashboard
        </h1>
        <p className="text-text-secondary text-lg">
          Enhanced stats and insights for your Yahoo Fantasy NHL league.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="bg-surface border border-border rounded-lg p-6 hover:bg-surface-elevated hover:shadow-lg transition-all group"
          >
            <h2 className="text-xl font-semibold text-text-primary mb-2 group-hover:text-accent-primary transition-colors">
              {feature.title}
            </h2>
            <p className="text-text-secondary text-sm">{feature.description}</p>
          </Link>
        ))}
      </div>

      {/* Auth Status */}
      <div className="mt-8 bg-surface border border-border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isLoading
                    ? "bg-accent-warning animate-pulse"
                    : isAuthenticated
                      ? "bg-accent-success"
                      : "bg-accent-danger"
                }`}
              />
              <span className="text-sm font-medium text-text-primary">
                {isLoading
                  ? "Checking connection..."
                  : isAuthenticated
                    ? "Connected to Yahoo Fantasy"
                    : "Not connected"}
              </span>
            </div>
            <p className="text-sm text-text-secondary">
              {isAuthenticated
                ? "Your Yahoo Fantasy account is linked. Live league data is available."
                : "Connect your Yahoo Fantasy account to start viewing live league data."}
            </p>
          </div>
          {!isLoading && (
            <a
              href={isAuthenticated ? "/api/auth/logout" : "/api/auth/login"}
              className={`shrink-0 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isAuthenticated
                  ? "text-text-secondary hover:text-accent-danger hover:bg-accent-danger/10"
                  : "bg-accent-primary text-white hover:bg-accent-primary/90"
              }`}
            >
              {isAuthenticated ? "Disconnect" : "Connect Yahoo"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
