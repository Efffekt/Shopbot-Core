import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "opsz"],
  style: ["normal", "italic"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Preik – AI som snakker ditt språk",
    template: "%s | Preik",
  },
  description: "Skreddersydde AI-assistenter for norske bedrifter. Ikke mer leting. Bare gode svar.",
  metadataBase: new URL("https://preik.no"),
  openGraph: {
    type: "website",
    locale: "nb_NO",
    url: "https://preik.no",
    siteName: "Preik",
    title: "Preik – AI som snakker ditt språk",
    description: "Skreddersydde AI-assistenter for norske bedrifter. Ikke mer leting. Bare gode svar.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Preik – AI-chatbot for norske bedrifter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Preik – AI som snakker ditt språk",
    description: "Skreddersydde AI-assistenter for norske bedrifter. Ikke mer leting. Bare gode svar.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  alternates: {
    types: {
      "application/rss+xml": "/blogg/feed.xml",
    },
  },
  other: { "theme-color": "#ffffff" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no" data-mode="light">
      <body
        className={`${fraunces.variable} ${jakarta.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-preik-accent focus:text-white focus:rounded-xl focus:text-sm focus:font-medium"
        >
          Hopp til hovedinnhold
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
