import Link from "next/link";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg-primary/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl">🔒</span>
          <span className="font-semibold text-text-primary text-sm hidden sm:block">
            unser-geheimnis<span className="text-accent">.de</span>
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-1">
          <Link
            href="/so-funktionierts"
            className="px-3 py-2 text-sm text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-white/5"
          >
            So funktioniert&apos;s
          </Link>
          <Link
            href="/fuer-unternehmen"
            className="px-3 py-2 text-sm text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-white/5"
          >
            Für Unternehmen
          </Link>
          <Link
            href="/"
            className="ml-2 px-4 py-2 text-sm font-semibold bg-accent hover:bg-accent-hover text-bg-primary rounded-lg transition-colors"
          >
            Geheimnis erstellen
          </Link>
        </nav>
      </div>
    </header>
  );
}
