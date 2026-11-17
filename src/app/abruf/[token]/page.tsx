import { Metadata } from "next";
import { RequestRetriever } from "@/components/ui/RequestRetriever";
import { Footer } from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "Antwort abrufen | unser-geheimnis.de",
  robots: { index: false, follow: false },
};

export default async function RetrievePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <>
      <main className="flex-grow flex flex-col items-center justify-center p-6 w-full max-w-5xl mx-auto min-h-[70vh]">
        <RequestRetriever token={token} />
      </main>
      <Footer />
    </>
  );
}
