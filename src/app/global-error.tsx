"use client";

// Next.js requires global-error.tsx to render its own <html>/<body> because
// it replaces the ENTIRE root layout (including [locale]/layout.tsx) when a
// root-level error occurs — e.g. an unhandled exception in a Server Component
// or Route Handler before the locale layout has mounted.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Something went wrong</h1>
        <p style={{ color: "#666", marginTop: "0.5rem" }}>
          Please try again, or go back to the homepage.
        </p>
        <button
          onClick={() => reset()}
          style={{
            marginTop: "1rem",
            padding: "0.6rem 1.5rem",
            background: "#dc2626",
            color: "#fff",
            borderRadius: "0.5rem",
            border: "none",
            fontWeight: 600,
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
