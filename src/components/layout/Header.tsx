"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { Category, Show, ShowSlot } from "@/lib/types";
import { siteConfig } from "@/lib/constants";
import { formatClock, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Container } from "../ui/Container";
import { IconButtonLink } from "../ui/IconButton";
import { IconClose, IconHeadphones, IconMenu, IconSearch } from "../ui/icons";
import { MobileMenu } from "./MobileMenu";
import { ThemeToggle } from "./ThemeToggle";
import { Wordmark } from "./Wordmark";

/**
 * Stable id for the hamburger trigger. The drawer portals onto `document.body`,
 * so the panel cannot reach the trigger through the DOM tree; this id lets it
 * restore focus on close.
 */
const MENU_TRIGGER_ID = "mobile-menu-trigger";

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface SiteHeaderProps {
  currentShow: Show | null;
  nextShow: { show: Show; slot: ShowSlot } | null;
  categories: Category[];
}

function OnAirStrip({
  currentShow,
  nextShow,
}: {
  currentShow: Show | null;
  nextShow: { show: Show; slot: ShowSlot } | null;
}) {
  return (
    <div className="border-b border-line bg-surface">
      <Container className="flex h-9 items-center justify-between gap-4 text-xs text-muted">
        <p className="flex min-w-0 items-center gap-2">
          {currentShow ? (
            <>
              <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-brand opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
              </span>
              <span className="font-semibold uppercase tracking-[0.16em] text-brand">On air</span>
              <span className="truncate font-medium text-ink">{currentShow.name}</span>
            </>
          ) : nextShow ? (
            <span className="truncate">
              Off air — back with <span className="font-medium text-ink">{nextShow.show.name}</span>{" "}
              at {formatClock(nextShow.slot.start)}
            </span>
          ) : (
            <span>Off air</span>
          )}
        </p>
        <p className="hidden shrink-0 sm:block" aria-hidden="true">
          {formatDate(new Date().toISOString())}
        </p>
      </Container>
    </div>
  );
}

export function SiteHeader({ currentShow, nextShow, categories }: SiteHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/75">
      <OnAirStrip currentShow={currentShow} nextShow={nextShow} />

      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="rounded-md focus-visible:focus-ring"
          aria-current={pathname === "/" ? "page" : undefined}
        >
          <Wordmark />
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {siteConfig.nav.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-150",
                      "hover:bg-surface-2 focus-visible:focus-ring",
                      active ? "text-brand" : "text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5">
          <IconButtonLink href="/search" label="Search articles" className="hidden sm:inline-flex">
            <IconSearch className="h-5 w-5" aria-hidden="true" />
          </IconButtonLink>
          <ThemeToggle />
          <Link
            href="/shows"
            className="hidden h-9 items-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-brand-fg shadow-card transition-colors duration-150 hover:bg-brand-hover focus-visible:focus-ring sm:inline-flex"
          >
            <IconHeadphones className="h-4 w-4" aria-hidden="true" />
            Listen live
          </Link>
          <button
            type="button"
            id={MENU_TRIGGER_ID}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            title={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors duration-150 hover:bg-surface-2 focus-visible:focus-ring lg:hidden"
          >
            {menuOpen ? (
              <IconClose className="h-5 w-5" aria-hidden="true" />
            ) : (
              <IconMenu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </Container>

      {menuOpen ? (
        <MobileMenu onClose={closeMenu} triggerId={MENU_TRIGGER_ID} categories={categories} />
      ) : null}
    </header>
  );
}
