"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <main id="main-content" className="error-screen">
          <section className="error-card">
            <p className="shell__eyebrow">Global error boundary</p>
            <h1>Something interrupted the web foundation route.</h1>
            <p>
              This is the root App Router error surface. Downstream stories can
              add route-specific recovery, but the platform now has a truthful
              global fallback.
            </p>
            <p>
              <strong>Error:</strong> {error.message}
            </p>
            {error.digest ? (
              <p>
                <strong>Digest:</strong> {error.digest}
              </p>
            ) : null}
            <button type="button" onClick={() => reset()}>
              Retry route
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
