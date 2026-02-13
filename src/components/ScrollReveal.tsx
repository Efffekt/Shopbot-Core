"use client";

import { useScrollReveal } from "@/hooks/useScrollReveal";

type Animation = "up" | "left" | "right" | "scale";

interface ScrollRevealProps {
  children: React.ReactNode;
  animation?: Animation;
  delay?: number;
  stagger?: number;
  className?: string;
  as?: "div" | "section" | "footer";
}

const animationClass: Record<Animation, string> = {
  up: "reveal-up",
  left: "reveal-left",
  right: "reveal-right",
  scale: "reveal-scale",
};

export function ScrollReveal({
  children,
  animation = "up",
  delay,
  stagger,
  className = "",
  as: Tag = "div",
}: ScrollRevealProps) {
  const ref = useScrollReveal<HTMLDivElement>();

  const staggerClass = stagger ? `stagger-${stagger}` : "";

  // Use CSS custom property so mobile media query can scale it down
  const style = delay
    ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties)
    : undefined;

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`scroll-reveal ${animationClass[animation]} ${staggerClass} ${className}`.trim()}
      style={style}
    >
      {children}
    </Tag>
  );
}
