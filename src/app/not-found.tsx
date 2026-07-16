// Root-level 404 fallback. Only used when a path is hit that falls entirely
// outside the [locale] segment (e.g. middleware doesn't match it), so it
// needs its own <html>/<body> — see global-error.tsx for why.
export default function RootNotFound() {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Page not found</h1>
        <a href="/" style={{ color: "#dc2626", fontWeight: 600 }}>
          Go to homepage
        </a>
      </body>
    </html>
  );
}
