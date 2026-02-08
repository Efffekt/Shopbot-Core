"use client";

import { useState } from "react";
import CustomerManagement from "@/components/CustomerManagement";
import ContentIngestion from "@/components/ContentIngestion";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import AdminOverview from "@/components/AdminOverview";
import ConversationBrowser from "@/components/ConversationBrowser";

type Section = "oversikt" | "kunder" | "innhold" | "samtaler" | "analyse";

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState<Section>("oversikt");
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [selectedTenantName, setSelectedTenantName] = useState<string | null>(null);

  function handleSelectTenant(id: string, name: string) {
    setSelectedTenantId(id);
    setSelectedTenantName(name);
  }

  function handleNavigateToContent() {
    setActiveSection("innhold");
  }

  const sections: { key: Section; label: string }[] = [
    { key: "oversikt", label: "Oversikt" },
    { key: "kunder", label: "Kunder" },
    { key: "innhold", label: "Innhold" },
    { key: "samtaler", label: "Samtaler" },
    { key: "analyse", label: "Analyse" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-brand font-light text-preik-text">Admin</h1>
        <p className="mt-1 text-preik-text-muted">
          Administrer kunder, innhold, samtaler og analyse
        </p>
      </div>

      {/* Pill Navigation */}
      <div className="flex items-center gap-3 mb-8">
        {sections.map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key)}
            className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-colors ${
              activeSection === section.key
                ? "bg-preik-accent text-white"
                : "bg-preik-surface border border-preik-border text-preik-text-muted hover:text-preik-text hover:bg-preik-bg"
            }`}
          >
            {section.label}
          </button>
        ))}

        {/* Active tenant indicator */}
        {selectedTenantName && (
          <div className="ml-auto flex items-center gap-2 text-sm text-preik-text-muted">
            <div className="w-2 h-2 rounded-full bg-preik-accent" />
            <span>{selectedTenantName}</span>
          </div>
        )}
      </div>

      {/* Sections */}
      {activeSection === "oversikt" && <AdminOverview />}
      {activeSection === "kunder" && (
        <CustomerManagement
          onSelectTenant={handleSelectTenant}
          onNavigateToContent={handleNavigateToContent}
        />
      )}
      {activeSection === "innhold" && (
        <ContentIngestion
          selectedTenantId={selectedTenantId}
          selectedTenantName={selectedTenantName}
        />
      )}
      {activeSection === "samtaler" && (
        <ConversationBrowser
          selectedTenantId={selectedTenantId}
          selectedTenantName={selectedTenantName}
        />
      )}
      {activeSection === "analyse" && (
        <AnalyticsDashboard
          selectedTenantId={selectedTenantId}
          selectedTenantName={selectedTenantName}
        />
      )}
    </div>
  );
}
