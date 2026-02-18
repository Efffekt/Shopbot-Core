import Link from "next/link";

export default function BlogNotFound() {
  return (
    <main className="min-h-screen bg-preik-bg flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-preik-text mb-4">404</h1>
        <p className="text-lg text-preik-text-muted mb-6">
          Denne artikkelen finnes ikke.
        </p>
        <Link
          href="/articles"
          className="inline-block px-6 py-3 bg-preik-accent text-white rounded-xl hover:opacity-90 transition-opacity"
        >
          Alle artikler
        </Link>
      </div>
    </main>
  );
}
