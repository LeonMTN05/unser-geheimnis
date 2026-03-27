import { SecretRevealer } from "@/components/ui/SecretRevealer";
import { Footer } from "@/components/ui/Footer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ein Geheimnis wartet auf dich | unser-geheimnis.de",
  robots: {
    index: false, // WICHTIG: Diese URLs nicht bei Google indexieren!
    follow: false,
  }
};

export default async function SecretPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <>
      <main className="flex-grow flex flex-col items-center justify-center p-6 w-full max-w-5xl mx-auto min-h-[70vh]">
        <SecretRevealer id={id} />
      </main>
      <Footer />
    </>
  );
}
