/**
 * Betreiberangaben für Impressum und Datenschutzerklärung.
 * Bewusst NICHT im Code, sondern in der .env — jede Instanz trägt ihre eigenen
 * Angaben ein (install.sh fragt danach), und persönliche Daten landen nicht in Git.
 *
 *   LEGAL_NAME="Max Mustermann"            (oder Firma)
 *   LEGAL_ADDRESS="Musterstraße 1|12345 Musterstadt|Deutschland"   (Zeilen mit | trennen)
 *   LEGAL_EMAIL="impressum@example.de"
 *   LEGAL_PHONE="+49 123 456789"           (optional)
 *   LEGAL_REPRESENTATIVE="…"               (optional, z. B. Geschäftsführer)
 *   LEGAL_REGISTER="Amtsgericht …, HRB …"  (optional)
 *   LEGAL_VAT_ID="DE…"                     (optional)
 */
export interface LegalInfo {
  name: string;
  address: string[];
  email: string;
  phone?: string;
  representative?: string;
  register?: string;
  vatId?: string;
}

const val = (k: string) => process.env[k]?.trim() || undefined;

export function getLegal(): LegalInfo | null {
  const name = val("LEGAL_NAME");
  const address = val("LEGAL_ADDRESS");
  const email = val("LEGAL_EMAIL");
  if (!name || !address || !email) return null;
  return {
    name,
    address: address.split("|").map((l) => l.trim()).filter(Boolean),
    email,
    phone: val("LEGAL_PHONE"),
    representative: val("LEGAL_REPRESENTATIVE"),
    register: val("LEGAL_REGISTER"),
    vatId: val("LEGAL_VAT_ID"),
  };
}
