import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-preik-bg flex items-center justify-center px-6">
      <div className="text-center">
        <p className="preik-wordmark text-6xl mb-4">404</p>
        <h1 className="text-2xl font-semibold text-preik-text mb-2">
          Siden finnes ikke
        </h1>
        <p className="text-preik-text-muted mb-8 max-w-md">
          Beklager, vi finner ikke siden du leter etter. Den kan ha blitt flyttet eller slettet.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-preik-accent text-white rounded-full hover:bg-preik-accent-hover transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Tilbake til forsiden
        </Link>
      </div>
    </div>
  );
}
