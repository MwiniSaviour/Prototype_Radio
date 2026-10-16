"use client";

import { useEffect, useRef } from "react";

export interface RevealProps {
  children: React.ReactNode;
  /** Stagger in milliseconds. */
  delay?: number;
  className?: string;
}

/*
 * Scroll-triggered fade/rise that never hides content from anyone who is not
 * meant to see the animation: the pending state is written to the DOM only
 * after mount, only when motion is allowed, and only when IntersectionObserver
 * exists — so no-JS, reduced-motion and ancient browsers all render plain
 * visible content. The states are styled in globals.css.
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    node.dataset.reveal = "pending";

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          node.dataset.reveal = "visible";
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={className}
    >
      {children}
    </div>
  );
}
