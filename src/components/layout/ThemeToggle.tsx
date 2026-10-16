"use client";

import { useSyncExternalStore } from "react";
import { siteConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { IconMoon, IconSun } from "../ui/icons";

/*
 * The HTML element's class list is the source of truth (the bootstrap script in
 * the root layout applies it before first paint), so subscribe to it directly
 * instead of mirroring it in component state.
 */
function subscribeToDarkClass(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getDarkSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getDarkServerSnapshot() {
  return false;
}

export function ThemeToggle({ className }: { className?: string }) {
  const isDark = useSyncExternalStore(
    subscribeToDarkClass,
    getDarkSnapshot,
    getDarkServerSnapshot,
  );

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(siteConfig.themeStorageKey, next ? "dark" : "light");
    } catch {
      // Private-mode storage failures are non-fatal; the class is already set.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink",
        "transition-colors duration-150 hover:bg-surface-2 focus-visible:focus-ring",
        className,
      )}
    >
      <IconSun className="h-5 w-5 dark:hidden" aria-hidden="true" />
      <IconMoon className="hidden h-5 w-5 dark:block" aria-hidden="true" />
    </button>
  );
}
