import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
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
    icon: "/favicon.png",
  },
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
        {children}
      </body>
    </html>
  );
}
