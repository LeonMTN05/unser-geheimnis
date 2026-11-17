import { Footer } from "@/components/ui/Footer";
import { Metadata } from "next";
import { getLegal } from "@/server/legal";

export const metadata: Metadata = {
  title: "Impressum | unser-geheimnis.de",
};

// Angaben kommen zur Laufzeit aus der .env (siehe src/server/legal.ts)
export const dynamic = "force-dynamic";

export default function Impressum() {
  const legal = getLegal();

  return (
    <>
      <main className="flex-grow flex flex-col items-start justify-start p-6 mx-auto w-full max-w-3xl mt-12">
        <h1 className="text-4xl font-serif text-text-primary mb-8">Impressum</h1>

        {!legal ? (
          <div className="w-full rounded-xl border border-warning/30 bg-warning/5 p-5 text-sm text-text-secondary">
            <p className="font-semibold text-warning mb-1">Betreiberangaben nicht konfiguriert</p>
            <p>
              Bitte <code className="font-mono">LEGAL_NAME</code>, <code className="font-mono">LEGAL_ADDRESS</code> und{" "}
              <code className="font-mono">LEGAL_EMAIL</code> in der <code className="font-mono">.env</code> setzen und den Dienst neu starten.
            </p>
          </div>
        ) : (
          <div className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-text-primary mb-3">Angaben gemäß § 5 DDG</h2>
              <p className="text-text-secondary">{legal.name}</p>
              {legal.representative && <p className="text-text-secondary mt-1">Vertreten durch: {legal.representative}</p>}
            </section>

            <section>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Postanschrift</h3>
              <p className="text-text-secondary">
                {legal.address.map((line, i) => (
                  <span key={i}>{line}<br /></span>
                ))}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-text-primary mb-2">Kontakt</h3>
              <p className="text-text-secondary">
                {legal.phone && <>Telefon: {legal.phone}<br /></>}
                E-Mail: <a href={`mailto:${legal.email}`} className="text-accent hover:underline">{legal.email}</a>
              </p>
            </section>

            {(legal.register || legal.vatId) && (
              <section>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Register &amp; Steuern</h3>
                <p className="text-text-secondary">
                  {legal.register && <>{legal.register}<br /></>}
                  {legal.vatId && <>USt-IdNr.: {legal.vatId}</>}
                </p>
              </section>
            )}

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
        )}
      </main>
      <Footer />
    </>
  );
}
