import { Metadata } from "next";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { Footer } from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "Abmelden | unser-geheimnis.de",
  robots: { index: false, follow: false },
};

export default async function OptOutPage({ searchParams }: { searchParams: Promise<{ e?: string; s?: string }> }) {
  const { e = "", s = "" } = await searchParams;
  const valid = /^[0-9a-f]{64}$/.test(e) && /^[0-9a-f]{32}$/.test(s);
  return (
    <>
      <main className="flex-grow flex flex-col items-center justify-center p-6 w-full min-h-[70vh]">
        {valid ? (
          <ConfirmAction
            title="Keine Datenanfragen mehr erhalten"
            description="Nach der Abmeldung verschickt unser-geheimnis.de keine E-Mails mehr an diese Adresse, weder Einladungen noch Bestätigungscodes. Wir speichern dafür nur einen nicht umkehrbaren Hash deiner Adresse."
            button="Jetzt abmelden"
            endpoint="/api/requests/optout"
            body={{ e, s }}
            success={() => "Erledigt. An diese Adresse werden keine E-Mails mehr versendet."}
          />
        ) : (
          <p className="text-danger">Ungültiger Abmelde-Link.</p>
        )}
      </main>
      <Footer />
    </>
  );
}
