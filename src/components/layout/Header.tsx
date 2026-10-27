"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { Category, Show, ShowSlot } from "@/lib/types";
import { siteConfig } from "@/lib/constants";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Container } from "../ui/Container";
import { IconClose, IconMenu, IconSearch, IconWaveform } from "../ui/icons";
import { MobileMenu } from "./MobileMenu";
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
  /** Kept for the on-air line in the utility bar; the layout already resolves it. */
  currentShow: Show | null;
  nextShow: { show: Show; slot: ShowSlot } | null;
  categories: Category[];
}

const dateline = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function UtilityBar() {
  const today = dateline.format(new Date()).toUpperCase();

  return (
    <div className="hidden border-b border-line/80 md:block">
      <Container className="flex h-[30px] items-center justify-between gap-6 text-[10.5px] font-medium tracking-[0.1em] text-muted uppercase">
        <p className="flex min-w-0 items-center gap-2">
          <span className="truncate">{today}</span>
          <span aria-hidden="true" className="text-line-strong">
            ·
          </span>
          <span className="shrink-0">Wa, Ghana</span>
        </p>

        <div className="flex shrink-0 items-center gap-5">
          <Link href="/about" className="hidden transition-colors hover:text-ink sm:block">
            Advertise
          </Link>
          <Link
            href="/about#reach-the-newsroom"
            className="hidden transition-colors hover:text-ink sm:block"
          >
            Contact
          </Link>
          <Link
            href="/search"
            aria-label="Search Prototype Radio"
            className="grid h-5 w-5 place-items-center text-ink/70 transition-colors hover:text-ink"
          >
            <IconSearch className="h-[15px] w-[15px]" aria-hidden="true" />
          </Link>
        </div>
      </Container>
    </div>
  );
}

export function SiteHeader({ categories }: SiteHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
      <UtilityBar />

      <Container className="flex h-[58px] items-center justify-between gap-6 sm:h-[72px]">
        <Link
          href="/"
          className="shrink-0 rounded-sm focus-visible:focus-ring"
          aria-current={pathname === "/" ? "page" : undefined}
          aria-label="Prototype Radio — home"
        >
          <Wordmark />
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-0.5 xl:gap-2">
            {siteConfig.nav.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative block px-2.5 py-6 text-[13.5px] font-medium whitespace-nowrap transition-colors duration-150 xl:px-3",
                      "after:absolute after:inset-x-2.5 after:bottom-[18px] after:h-[2px] after:rounded-full after:bg-brand after:transition-opacity after:duration-150",
                      active
                        ? "text-ink after:opacity-100"
                        : "text-ink/85 after:opacity-0 hover:text-brand hover:after:opacity-40",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <Link
            href="/search"
            aria-label="Search articles"
            className="hidden h-8 w-8 place-items-center text-ink transition-colors hover:text-brand sm:grid"
          >
            <IconSearch className="h-[18px] w-[18px]" aria-hidden="true" />
          </Link>
          <Link
            href="/shows"
            className="group hidden h-10 items-center gap-2.5 rounded-[4px] bg-panel px-4 text-[12.5px] font-semibold tracking-[0.02em] text-white transition-colors duration-150 hover:bg-black sm:inline-flex"
          >
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-brand" />
            Listen Live
            <IconWaveform className="h-4 w-4 text-white/55" aria-hidden="true" />
          </Link>

          <button
            type="button"
            id={MENU_TRIGGER_ID}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-line text-ink transition-colors hover:bg-surface-2 focus-visible:focus-ring lg:hidden"
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

/** Small helper used by the app shell's on-air copy (kept next to the header). */
export function onAirLine(currentShow: Show | null, nextShow: { show: Show; slot: ShowSlot } | null) {
  if (currentShow) return `On air now · ${currentShow.name}`;
  if (nextShow) return `Back at ${formatClock(nextShow.slot.start)} with ${nextShow.show.name}`;
  return "Off air";
}
