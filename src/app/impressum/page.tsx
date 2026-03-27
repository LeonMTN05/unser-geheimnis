import { Footer } from "@/components/ui/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum | unser-geheimnis.de",
};

export default function Impressum() {
  return (
    <>
      <main className="flex-grow flex flex-col items-start justify-start p-6 mx-auto w-full max-w-3xl mt-12">
        <h1 className="text-4xl font-serif text-text-primary mb-8">Impressum</h1>
        
        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Angaben gemäß § 5 TMG</h2>
            <p className="text-text-secondary">Max Mustermann</p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Postanschrift</h3>
            <p className="text-text-secondary">
              Musterstraße 1<br />
              12345 Musterstadt<br />
              Deutschland
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Kontakt</h3>
            <p className="text-text-secondary">
              Telefon: 0123 456789<br />
              E-Mail: <a href="mailto:impressum@example.de" className="text-accent hover:underline">impressum@example.de</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-3">Information gemäß § 36 VSBG</h2>
            <p className="text-text-secondary">
              Gemäß § 36 VSBG (Verbraucherstreitbeilegungsgesetz – Gesetz über die alternative Streitbeilegung in Verbrauchersachen) erklärt der Betreiber dieser Website:
            </p>
            <p className="text-text-secondary mt-2">
              Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
