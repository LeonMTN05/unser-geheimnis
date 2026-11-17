import Link from "next/link";
import { Logo } from "./Icons";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-bg-secondary/40 pt-12 pb-8">
      <div className="max-w-5xl mx-auto px-6 h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="mb-4"><Logo /></div>
            <p className="text-text-secondary text-sm leading-relaxed max-w-sm">
              Sicherer Webdienst zum verschlüsselten Teilen von Passwörtern, 
              API-Keys und Zugangsdaten mittels Zero-Knowledge Architektur.
            </p>
          </div>
          
          <div>
            <h3 className="text-text-primary font-medium mb-4">Navigation</h3>
            <ul className="space-y-3 text-sm text-text-muted">
              <li><Link href="/" className="hover:text-accent transition-colors">Geheimnis erstellen</Link></li>
              <li><Link href="/so-funktionierts" className="hover:text-accent transition-colors">So funktioniert&apos;s</Link></li>
              <li><Link href="/fuer-unternehmen" className="hover:text-accent transition-colors">Für Unternehmen</Link></li>
              <li><Link href="/self-hosted" className="hover:text-accent transition-colors">Self-Hosted</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-text-primary font-medium mb-4">Rechtliches</h3>
            <ul className="space-y-3 text-sm text-text-muted">
              <li><Link href="/datenschutz" className="hover:text-accent transition-colors">Datenschutz</Link></li>
              <li><Link href="/impressum" className="hover:text-accent transition-colors">Impressum</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border flex justify-between items-center text-xs text-text-muted flex-col sm:flex-row gap-4 text-center sm:text-left">
          <p>© {new Date().getFullYear()} unser-geheimnis.de — Made in Germany</p>
          <div className="flex gap-4">
             <span className="flex items-center gap-1">
               <span className="w-2 h-2 rounded-full bg-success"></span>
               System online
             </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
