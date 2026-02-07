import Link from "next/link";

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

      {/* Status */}
      <div className="mt-8 bg-surface border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-accent-warning animate-pulse" />
          <span className="text-sm font-medium text-text-primary">
            API Connection
          </span>
        </div>
        <p className="text-sm text-text-secondary">
          Connect your Yahoo Fantasy account to start viewing live league data.
          Visit{" "}
          <code className="text-accent-primary font-mono text-xs bg-surface-elevated px-1.5 py-0.5 rounded">
            /api/auth/login
          </code>{" "}
          to authenticate.
        </p>
      </div>
    </div>
  );
}
