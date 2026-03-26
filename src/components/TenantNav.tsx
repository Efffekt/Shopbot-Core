"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || isAdmin);

  const activeTab = visibleTabs.find((tab) => {
    const fullHref = `${basePath}${tab.href}`;
    return tab.href === ""
      ? pathname === basePath || pathname === `${basePath}/`
      : pathname.startsWith(fullHref);
  });

  // Close menu on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [mobileMenuOpen]);

  // Close menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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

      {/* Mobile: dropdown nav */}
      <div className="sm:hidden relative" ref={menuRef}>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-preik-surface border border-preik-border rounded-xl text-sm font-medium text-preik-text"
        >
          <span>{activeTab?.label || "Navigasjon"}</span>
          <svg
            className={`w-4 h-4 text-preik-text-muted transition-transform ${mobileMenuOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-preik-surface border border-preik-border rounded-xl shadow-lg z-30 overflow-hidden">
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
                  className={`block px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-preik-accent bg-preik-accent/5"
                      : "text-preik-text-muted hover:text-preik-text hover:bg-preik-bg"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop: tab bar */}
      <div className="hidden sm:flex flex-nowrap gap-1 border-b border-preik-border overflow-x-auto scrollbar-hide">
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
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative whitespace-nowrap ${
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
