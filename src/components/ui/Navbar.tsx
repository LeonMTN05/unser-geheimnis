import Link from "next/link";
import { Logo } from "./Icons";

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg-primary/75 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link href="/" aria-label="unser-geheimnis.de Startseite" className="text-sm">
          <Logo />
        </Link>

        {/* Nav Links */}
        <nav className="flex items-center gap-1">
          <Link
            href="/so-funktionierts"
            className="hidden md:block px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-white/5"
          >
            So funktioniert&apos;s
          </Link>
          <Link
            href="/fuer-unternehmen"
            className="hidden md:block px-3 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-white/5"
          >
            Für Unternehmen
          </Link>
          <Link
            href="/"
            className="ml-2 px-4 py-2 text-sm font-semibold whitespace-nowrap bg-accent hover:bg-accent-hover text-bg-primary rounded-lg transition-colors"
          >
            <span className="sm:hidden">Erstellen</span>
            <span className="hidden sm:inline">Geheimnis erstellen</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
