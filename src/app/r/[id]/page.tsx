import { Metadata } from "next";
import { RequestResponder } from "@/components/ui/RequestResponder";
import { Footer } from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "Datenanfrage | unser-geheimnis.de",
  robots: { index: false, follow: false },
};

export default async function RespondPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <main className="flex-grow flex flex-col items-center justify-center p-6 w-full max-w-5xl mx-auto min-h-[70vh]">
        <RequestResponder id={id} />
      </main>
      <Footer />
    </>
  );
}
