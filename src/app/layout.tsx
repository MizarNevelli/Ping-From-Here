import type { Metadata } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { LocationProvider } from "@/features/ping-from-here/providers/LocationProvider";
import { SiteHeader } from "@/features/ping-from-here/components/SiteHeader";
import { SiteFooter } from "@/features/ping-from-here/components/SiteFooter";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ping From Here",
  description:
    "Measure your estimated latency to major cloud regions from wherever you're connected right now.",
  openGraph: {
    title: "Ping From Here",
    description: "How far are you from the cloud?",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ping From Here",
    description: "How far are you from the cloud?",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${ibmPlexMono.variable}`}
    >
      <body className="min-h-dvh font-sans">
        <LocationProvider>
          <SiteHeader />

          {children}
          <SiteFooter />
        </LocationProvider>
        <Analytics />
      </body>
    </html>
  );
}
