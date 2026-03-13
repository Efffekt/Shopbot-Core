"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

export function Header({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when clicking a link
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Focus trap for mobile menu
  const handleMenuKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;

      const menu = menuRef.current;
      if (!menu) return;

      const focusable = menu.querySelectorAll<HTMLElement>(
        'a[href], button, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    []
  );

  // Focus first menu item when opening
  useEffect(() => {
    if (isMobileMenuOpen) {
      const menu = menuRef.current;
      if (!menu) return;
      const firstLink = menu.querySelector<HTMLElement>("a[href], button");
      // Small delay to let the transition start
      const timer = setTimeout(() => firstLink?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          isScrolled ? "bg-preik-bg/80 backdrop-blur-md border-b border-preik-border" : ""
        }`}
      >
        <div
          className={`max-w-6xl mx-auto transition-all duration-200 ${
            isScrolled ? "sm:border-l sm:border-r border-preik-border" : ""
          }`}
        >
          <div className="px-6 py-4 flex items-center justify-between">
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

            {/* Mobile menu button */}
            <button
              ref={menuButtonRef}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 -ml-2 text-preik-text-muted hover:text-preik-text transition-colors"
              aria-label="Meny"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Center - Logo */}
            <Link href="/" className="preik-wordmark text-3xl md:text-4xl">
              preik
            </Link>

            {/* Right links - desktop */}
            <div className="hidden md:flex items-center gap-6 flex-1 justify-end">
              <a href="#faq" className="text-sm text-preik-text-muted hover:text-preik-text transition-colors">
                FAQ
              </a>
              <a href="#kontakt" className="text-sm text-preik-text-muted hover:text-preik-text transition-colors">
                Kontakt
              </a>
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="text-sm text-preik-text-muted hover:text-preik-text transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="text-sm text-preik-text-muted hover:text-preik-text transition-colors"
                >
                  Logg inn
                </Link>
              )}
              <Link
                href="/registrer"
                className="text-sm font-medium bg-preik-accent text-white px-4 py-2 rounded-full hover:bg-preik-accent-hover transition-colors"
              >
                Kom i gang
              </Link>
            </div>

            {/* Mobile - placeholder for balance */}
            <div className="md:hidden w-10" />
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div
        ref={menuRef}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Navigasjonsmeny"
        className={`fixed inset-0 z-40 bg-preik-bg/95 backdrop-blur-md transition-all duration-300 md:hidden ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onKeyDown={isMobileMenuOpen ? handleMenuKeyDown : undefined}
      >
        <nav className="flex flex-col items-center justify-center h-full gap-8">
          <a
            href="#losninger"
            onClick={handleLinkClick}
            className="text-2xl text-preik-text-muted hover:text-preik-text transition-colors"
          >
            Slik fungerer det
          </a>
          <a
            href="#hvordan"
            onClick={handleLinkClick}
            className="text-2xl text-preik-text-muted hover:text-preik-text transition-colors"
          >
            Demo
          </a>
          <a
            href="#priser"
            onClick={handleLinkClick}
            className="text-2xl text-preik-text-muted hover:text-preik-text transition-colors"
          >
            Priser
          </a>
          <a
            href="#faq"
            onClick={handleLinkClick}
            className="text-2xl text-preik-text-muted hover:text-preik-text transition-colors"
          >
            FAQ
          </a>
          <a
            href="#kontakt"
            onClick={handleLinkClick}
            className="text-2xl text-preik-text-muted hover:text-preik-text transition-colors"
          >
            Kontakt
          </a>
          <div className="flex flex-col gap-4 mt-8">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                onClick={handleLinkClick}
                className="text-lg text-preik-text-muted hover:text-preik-text transition-colors text-center"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={handleLinkClick}
                className="text-lg text-preik-text-muted hover:text-preik-text transition-colors text-center"
              >
                Logg inn
              </Link>
            )}
            <Link
              href="/registrer"
              onClick={handleLinkClick}
              className="text-lg font-medium bg-preik-accent text-white px-8 py-3 rounded-full hover:bg-preik-accent-hover transition-colors text-center"
            >
              Kom i gang
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
