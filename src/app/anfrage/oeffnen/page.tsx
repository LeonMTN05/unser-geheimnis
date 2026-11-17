import { Metadata } from "next";
import { OpenStoredRequest } from "@/components/ui/OpenStoredRequest";
import { Footer } from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "Antwort öffnen | unser-geheimnis.de",
  robots: { index: false, follow: false },
};

export default async function OpenPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id = "" } = await searchParams;
  return (
    <>
      <main className="flex-grow flex flex-col items-center justify-center p-6 w-full min-h-[70vh]">
        <OpenStoredRequest id={/^[a-z0-9]{20,32}$/.test(id) ? id : null} />
      </main>
      <Footer />
    </>
  );
}
