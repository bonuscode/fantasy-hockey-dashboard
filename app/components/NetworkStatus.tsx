"use client";

import { useEffect, useState } from "react";

export default function NetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    // Only set offline if we're actually offline on mount
    if (!navigator.onLine) setIsOffline(true);

    function handleOffline() {
      setShowBackOnline(false);
      setIsOffline(true);
    }

    function handleOnline() {
      setIsOffline(false);
      setShowBackOnline(true);
      const timer = setTimeout(() => setShowBackOnline(false), 3000);
      return () => clearTimeout(timer);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline && !showBackOnline) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300 ${
        isOffline
          ? "bg-accent-warning/15 text-accent-warning border-b border-accent-warning/20"
          : "bg-accent-success/15 text-accent-success border-b border-accent-success/20 animate-pulse"
      }`}
    >
      {isOffline ? (
        <>
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M12 12h.01"
            />
          </svg>
          You&apos;re offline — some data may be stale
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Back online
        </>
      )}
    </div>
  );
}
