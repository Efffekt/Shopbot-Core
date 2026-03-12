"use client";

import { useRef, useCallback } from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  /** Higher = more prominent glass effect */
  intensity?: "subtle" | "medium" | "strong";
}

export function GlassCard({ children, className = "", intensity = "medium" }: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--shine-x", `${x}%`);
    el.style.setProperty("--shine-y", `${y}%`);
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty("--shine-x", "50%");
    el.style.setProperty("--shine-y", "50%");
  }, []);

  return (
    <div
      ref={cardRef}
      className={`glass-card glass-${intensity} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ "--shine-x": "50%", "--shine-y": "50%" } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
