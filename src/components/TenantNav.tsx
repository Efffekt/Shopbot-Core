"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface TenantNavProps {
  tenantId: string;
  tenantName: string;
  isAdmin: boolean;
}

const tabs = [
  { href: "", label: "Oversikt" },
  { href: "/integrasjon", label: "Integrasjon" },
  { href: "/analytics", label: "Analyse" },
  { href: "/samtaler", label: "Samtaler" },
  { href: "/prompt", label: "Systemprompt", adminOnly: true },
  { href: "/content", label: "Innhold", adminOnly: true },
  { href: "/innstillinger", label: "Innstillinger" },
];

export default function TenantNav({ tenantId, tenantName, isAdmin }: TenantNavProps) {
  const pathname = usePathname();
  const basePath = `/dashboard/${tenantId}`;

  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || isAdmin);

  return (
    <div className="mb-8">
      {/* Breadcrumb */}
      <nav aria-label="Brødsmulesti" className="mb-4">
        <ol className="flex items-center gap-1.5 text-sm text-preik-text-muted">
          <li>
            <Link href="/dashboard" className="hover:text-preik-text transition-colors">
              Dashboard
            </Link>
          </li>
          <li aria-hidden="true">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </li>
          <li>
            <span className="text-preik-text font-medium">{tenantName}</span>
          </li>
        </ol>
      </nav>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 border-b border-preik-border">
        {visibleTabs.map((tab) => {
          const fullHref = `${basePath}${tab.href}`;
          const isActive =
            tab.href === ""
              ? pathname === basePath || pathname === `${basePath}/`
              : pathname.startsWith(fullHref);

          return (
            <Link
              key={tab.href}
              href={fullHref}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative ${
                isActive
                  ? "text-preik-accent"
                  : "text-preik-text-muted hover:text-preik-text hover:bg-preik-surface"
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-preik-accent rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
