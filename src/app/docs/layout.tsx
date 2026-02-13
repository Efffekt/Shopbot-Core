import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dokumentasjon",
  description:
    "Komplett guide til å integrere og tilpasse Preik sin AI-chatbot på din nettside.",
  openGraph: {
    title: "Dokumentasjon – Preik",
    description:
      "Komplett guide til å integrere og tilpasse Preik sin AI-chatbot.",
    url: "https://preik.ai/docs",
  },
  alternates: { canonical: "https://preik.ai/docs" },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
