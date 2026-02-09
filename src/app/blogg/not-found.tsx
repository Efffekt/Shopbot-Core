import Link from "next/link";

export default function BlogNotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-lg text-gray-600 mb-6">
          Denne bloggartikkelen finnes ikke.
        </p>
        <Link
          href="/blogg"
          className="inline-block px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
        >
          Tilbake til bloggen
        </Link>
      </div>
    </main>
  );
}
