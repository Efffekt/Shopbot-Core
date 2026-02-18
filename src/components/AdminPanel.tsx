"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import CustomerManagement from "@/components/CustomerManagement";
import ContentIngestion from "@/components/ContentIngestion";
import AdminOverview from "@/components/AdminOverview";
import ConversationBrowser from "@/components/ConversationBrowser";
import GlobalUserManagement from "@/components/GlobalUserManagement";
import BlogManager from "@/components/BlogManager";
import AccountSettings from "@/components/AccountSettings";
import ContactSubmissions from "@/components/ContactSubmissions";
import AuditLogBrowser from "@/components/AuditLogBrowser";

const AnalyticsDashboard = dynamic(
  () => import("@/components/AnalyticsDashboard"),
  {
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-preik-accent" />
      </div>
    ),
  }
);

type Section = "oversikt" | "kunder" | "innhold" | "samtaler" | "analyse" | "brukere" | "articles" | "henvendelser" | "logg" | "innstillinger";

interface AdminPanelProps {
  isSuperAdmin: boolean;
  userEmail: string;
}

export default function AdminPanel({ isSuperAdmin, userEmail }: AdminPanelProps) {
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

  const sections: { key: Section; label: string; superAdminOnly?: boolean }[] = [
    { key: "oversikt", label: "Oversikt" },
    { key: "kunder", label: "Kunder", superAdminOnly: true },
    { key: "innhold", label: "Innhold", superAdminOnly: true },
    { key: "samtaler", label: "Samtaler", superAdminOnly: true },
    { key: "analyse", label: "Analyse" },
    { key: "articles", label: "Articles" },
    { key: "brukere", label: "Brukere", superAdminOnly: true },
    { key: "henvendelser", label: "Henvendelser" },
    { key: "logg", label: "Logg", superAdminOnly: true },
    { key: "innstillinger", label: "Innstillinger" },
  ];

  const visibleSections = sections.filter(
    (s) => !s.superAdminOnly || isSuperAdmin
  );

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
        {visibleSections.map((section) => (
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
      {activeSection === "kunder" && isSuperAdmin && (
        <CustomerManagement
          onSelectTenant={handleSelectTenant}
          onNavigateToContent={handleNavigateToContent}
        />
      )}
      {activeSection === "innhold" && isSuperAdmin && (
        <ContentIngestion
          selectedTenantId={selectedTenantId}
          selectedTenantName={selectedTenantName}
        />
      )}
      {activeSection === "samtaler" && isSuperAdmin && (
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
      {activeSection === "articles" && <BlogManager />}
      {activeSection === "brukere" && isSuperAdmin && <GlobalUserManagement />}
      {activeSection === "henvendelser" && <ContactSubmissions />}
      {activeSection === "logg" && isSuperAdmin && <AuditLogBrowser />}
      {activeSection === "innstillinger" && (
        <div className="bg-preik-surface rounded-2xl border border-preik-border p-6">
          <h2 className="text-xl font-semibold text-preik-text mb-6">Kontoinnstillinger</h2>
          <AccountSettings userEmail={userEmail} showBlogSettings />
        </div>
      )}
    </div>
  );
}
