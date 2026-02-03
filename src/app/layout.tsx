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
  title: "Preik – AI som snakker ditt språk",
  description: "Skreddersydde AI-assistenter for norske bedrifter. Ikke mer leting. Bare gode svar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-mode', mode);
                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
                  document.documentElement.setAttribute('data-mode', e.matches ? 'dark' : 'light');
                });
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${fraunces.variable} ${jakarta.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
