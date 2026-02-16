"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/standings", label: "Standings" },
  { href: "/players", label: "Players" },
  { href: "/matchups", label: "Matchups" },
  { href: "/records", label: "Records" },
];

export default function Navigation() {
  const pathname = usePathname();

  const { data: authStatus, isLoading: authLoading } = useQuery({
    queryKey: ["auth-status"],
    queryFn: async () => {
      const res = await fetch("/api/auth/status");
      return res.json() as Promise<{ authenticated: boolean }>;
    },
  });

  const isAuthenticated = authStatus?.authenticated ?? false;

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-border">
      <nav className="max-w-[1280px] mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg md:text-xl font-semibold text-text-primary">
              Brew Zoo Hockey
            </span>
          </Link>

          {/* Desktop Nav + Auth */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent-primary/10 text-accent-primary"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Divider */}
            <div className="w-px h-6 bg-border mx-3" />

            {/* Auth Status */}
            {authLoading ? (
              <div className="flex items-center gap-2 px-3 py-1.5">
                <div className="w-2 h-2 rounded-full bg-accent-warning animate-pulse" />
                <span className="text-xs text-text-muted">Checking...</span>
              </div>
            ) : (
              <a
                href={isAuthenticated ? "/api/auth/logout" : "/api/auth/login"}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isAuthenticated
                    ? "text-text-secondary hover:text-accent-danger hover:bg-accent-danger/10"
                    : "bg-accent-primary text-white hover:bg-accent-primary/90"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isAuthenticated ? "bg-accent-success" : "bg-accent-danger"
                  }`}
                />
                {isAuthenticated ? "Yahoo Connected" : "Connect Yahoo"}
              </a>
            )}
          </div>

          {/* Mobile Auth Status (compact) */}
          <div className="md:hidden">
            {authLoading ? (
              <div className="w-2.5 h-2.5 rounded-full bg-accent-warning animate-pulse" />
            ) : (
              <a
                href={isAuthenticated ? "/api/auth/logout" : "/api/auth/login"}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isAuthenticated
                    ? "text-text-secondary"
                    : "bg-accent-primary text-white"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isAuthenticated ? "bg-accent-success" : "bg-accent-danger"
                  }`}
                />
                {isAuthenticated ? "Connected" : "Connect"}
              </a>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
