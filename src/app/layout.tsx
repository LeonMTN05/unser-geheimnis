import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import { Navbar } from "@/components/ui/Navbar";
import "./globals.css";

// next/font/google hostet Fonts lokal, sendet keine HTTP-Requests an Google (DSGVO-konform!)
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "unser-geheimnis.de — Passwörter & Zugangsdaten sicher teilen",
  description: "Teile Passwörter, API-Keys und Dateien verschlüsselt und DSGVO-konform. Ende-zu-Ende-Verschlüsselung, automatische Löschung, kein Tracking. Made in Germany.",
  keywords: [
    "Passwort sicher teilen",
    "Zugangsdaten verschlüsselt senden",
    "DSGVO Passwort-Sharing",
    "sichere Datenübertragung",
    "One-Time Secret deutsch",
    "verschlüsselter Link",
  ],
  alternates: {
    canonical: "https://unser-geheimnis.de",
  },
  openGraph: {
    title: "unser-geheimnis.de — Geheimnisse sicher teilen",
    description: "Ende-zu-Ende verschlüsselt. Automatische Löschung. DSGVO-konform. Kein Tracking.",
    url: "https://unser-geheimnis.de",
    siteName: "unser-geheimnis.de",
    locale: "de_DE",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${inter.variable} ${playfair.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col pt-16 bg-primary text-foreground">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
