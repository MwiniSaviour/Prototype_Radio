"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Category } from "@/lib/types";
import { siteConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { IconClose, IconSearch } from "../ui/icons";
import { IconButton } from "../ui/IconButton";
import { Wordmark } from "./Wordmark";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

const noopSubscribe = () => () => {};

/**
 * Slide-over mobile navigation with full dialog semantics: focus moves in on
 * open and back to the trigger on close, Tab cycles inside the panel, Escape
 * closes, background scroll is locked, and route changes dismiss it.
 *
 * Rendered through a portal onto `document.body`. The header sets
 * `backdrop-filter`, which makes it a containing block for `position: fixed`
 * descendants — as an in-tree child, `fixed inset-0` would resolve against the
 * header's box and the drawer would be clipped to the header's height.
 */
export function MobileMenu({
  onClose,
  triggerId,
  categories,
}: {
  onClose: () => void;
  triggerId: string;
  categories: Category[];
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const onCloseRef = useRef(onClose);
  /** The path the drawer was opened on; a change from it means "navigated". */
  const previousPath = useRef(pathname);
  // `document` does not exist during prerender, so the portal target must only
  // be touched on the client. The server snapshot keeps the first render
  // portal-free; `document` exists for every subsequent client render.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  /*
   * Close on navigation — but only when the path actually changed.
   *
   * A "first run" boolean does not survive React StrictMode, which mounts every
   * effect twice in development: the second pass saw the flag already consumed
   * and closed the drawer in the same commit that opened it, so the menu only
   * blinked. Comparing against the previous path is idempotent, so a double
   * mount is a no-op and a real route change still dismisses the panel.
   */
  useEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    onCloseRef.current();
  }, [pathname]);

  useEffect(() => {
    if (!mounted) return;
    const panel = panelRef.current;
    if (!panel) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    focusables()[0]?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !panel?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      // The trigger lives in the header, outside this portal, so look it up by
      // its stable id. iOS Safari does not focus buttons on tap, which would
      // otherwise leave `previouslyFocused` pointing at <body>.
      const trigger = document.getElementById(triggerId);
      (trigger ?? previouslyFocused)?.focus?.();
    };
  }, [mounted, triggerId]);

  const linkClasses = "rounded-[3px] px-3 py-2.5 text-[15px] font-medium text-ink hover:bg-surface-2";

  if (!mounted) return null;

  return createPortal(
    <div id="mobile-menu" className="fixed inset-0 z-50 lg:hidden">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        className="absolute inset-y-0 right-0 flex w-[min(21rem,88vw)] flex-col gap-6 overflow-y-auto border-l border-line bg-paper p-5 shadow-pop motion-safe:animate-slide-in-right"
      >
        <div className="flex items-center justify-between gap-4">
          <Wordmark />
          <IconButton label="Close menu" onClick={onClose} variant="outline">
            <IconClose className="h-5 w-5" aria-hidden="true" />
          </IconButton>
        </div>

        <nav aria-label="Mobile primary" className="flex flex-col gap-1">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={cn(linkClasses, pathname === item.href && "bg-surface-2 text-brand")}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/search" className={linkClasses}>
            <IconSearch className="mr-2 inline h-4 w-4" aria-hidden="true" />
            Search
          </Link>
        </nav>

        <div>
          <h2 className="mb-2 px-3 text-[10px] font-bold tracking-[0.14em] text-muted uppercase">
            Categories
          </h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="rounded-[3px] border border-line px-2.5 py-1.5 text-[11.5px] font-semibold tracking-[0.04em] text-ink uppercase hover:border-line-strong hover:bg-surface-2"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
