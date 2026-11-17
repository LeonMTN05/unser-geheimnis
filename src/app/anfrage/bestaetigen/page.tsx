import { Metadata } from "next";
import { ConfirmAction } from "@/components/ui/ConfirmAction";
import { Footer } from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "Anfrage bestätigen | unser-geheimnis.de",
  robots: { index: false, follow: false },
};

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ id?: string; t?: string }> }) {
  const { id = "", t = "" } = await searchParams;
  const valid = /^[a-z0-9]{20,32}$/.test(id) && /^[A-Za-z0-9_-]{43}$/.test(t);
  return (
    <>
      <main className="flex-grow flex flex-col items-center justify-center p-6 w-full min-h-[70vh]">
        {valid ? (
          <VerifyClient id={id} token={t} />
        ) : (
          <p className="text-danger">Ungültiger Bestätigungslink.</p>
        )}
      </main>
      <Footer />
    </>
  );
}

function VerifyClient({ id, token }: { id: string; token: string }) {
  return (
    <ConfirmAction
      title="Datenanfrage bestätigen"
      description="Mit der Bestätigung wird die Einladung an den Empfänger versendet. Du hast diese Anfrage nicht erstellt? Dann schließe diese Seite einfach. Es wird nichts versendet."
      button="Bestätigen & Einladung senden"
      endpoint={`/api/requests/${id}/verify`}
      body={{ token }}
      kind="verify"
    />
  );
}
