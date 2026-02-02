"use client";

import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-preik-bg/80 backdrop-blur-md border-b border-preik-border/50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left links - hidden on mobile */}
        <nav className="hidden md:flex items-center gap-8 flex-1">
          <a href="#losninger" className="text-sm text-preik-text-muted hover:text-preik-text transition-colors">
            Slik fungerer det
          </a>
          <a href="#hvordan" className="text-sm text-preik-text-muted hover:text-preik-text transition-colors">
            Demo
          </a>
          <a href="#priser" className="text-sm text-preik-text-muted hover:text-preik-text transition-colors">
            Priser
          </a>
        </nav>

        {/* Center - Logo */}
        <a href="/" className="preik-wordmark text-2xl md:text-3xl">
          preik
        </a>

        {/* Right links */}
        <div className="hidden md:flex items-center gap-8 flex-1 justify-end">
          <a href="#faq" className="text-sm text-preik-text-muted hover:text-preik-text transition-colors">
            FAQ
          </a>
          <a
            href="#kontakt"
            className="text-sm font-medium text-preik-accent hover:text-preik-accent-hover transition-colors"
          >
            Kontakt
          </a>
          <ThemeToggle />
        </div>

        {/* Mobile - just theme toggle */}
        <div className="md:hidden">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
