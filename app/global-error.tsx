"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-[#0a0a0f] text-[#e4e4e7] flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#ef4444]/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#ef4444]"
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
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-[#a1a1aa] mb-6 text-sm">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-[#6366f1] text-white rounded-lg text-sm font-medium hover:bg-[#6366f1]/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
