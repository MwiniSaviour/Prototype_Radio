import type { SVGProps } from "react";

/**
 * The app's icon set.
 *
 * Every glyph is drawn on a 24×24 grid with a 1.75 stroke, round caps and round
 * joins — the same optical weight as the mock's line icons — so icons and type
 * sit on the same visual footing at any size. Paths are inline (no icon font,
 * no sprite request) which keeps the Capacitor bundle offline-safe.
 */
export type IconName =
  | "home"
  | "live"
  | "explore"
  | "ticket"
  | "ticket-stub"
  | "profile"
  | "search"
  | "filter"
  | "chevron-right"
  | "chevron-left"
  | "arrow-right"
  | "share"
  | "heart"
  | "map-pin"
  | "clock"
  | "calendar"
  | "gift"
  | "crown"
  | "music"
  | "drink"
  | "check"
  | "check-circle"
  | "bell"
  | "settings"
  | "help"
  | "minus"
  | "plus"
  | "sparkle"
  | "close"
  | "play"
  | "pause"
  | "dot"
  | "user";

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  /** Renders a filled variant where the design calls for a solid glyph. */
  filled?: boolean;
}

const strokePaths: Record<Exclude<IconName, "dot" | "play" | "pause">, React.ReactNode> = {
  home: <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z" />,
  live: (
    <>
      <path d="M4.6 11.4v1.2" strokeWidth="2.1" />
      <path d="M8.1 8.4v7.2" strokeWidth="2.1" />
      <path d="M12 5.2v13.6" strokeWidth="2.1" />
      <path d="M15.9 8.4v7.2" strokeWidth="2.1" />
      <path d="M19.4 11.4v1.2" strokeWidth="2.1" />
    </>
  ),
  explore: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="m15.6 8.4-1.9 5.3-5.3 1.9 1.9-5.3z" />
      <path d="m12.9 11.1 2.7-2.7" />
      <circle cx="12" cy="12" r="0.95" fill="currentColor" stroke="none" />
    </>
  ),
  ticket: (
    <>
      <path d="M12 3.4c1.1 0 1.6.9 2.3 1.5.7.6 1.7.4 2.6.8.9.4 1.1 1.4 1.6 2.2.4.9 1.4 1.3 1.7 2.2.3.9-.3 1.8-.3 2.9s.6 2 .3 2.9c-.3.9-1.3 1.3-1.7 2.2-.5.8-.7 1.8-1.6 2.2-.9.4-1.9.2-2.6.8-.7.6-1.2 1.5-2.3 1.5s-1.6-.9-2.3-1.5c-.7-.6-1.7-.4-2.6-.8-.9-.4-1.1-1.4-1.6-2.2-.4-.9-1.4-1.3-1.7-2.2-.3-.9.3-1.8.3-2.9s-.6-2-.3-2.9c.3-.9 1.3-1.3 1.7-2.2.5-.8.7-1.8 1.6-2.2.9-.4 1.9-.2 2.6-.8C10.4 4.3 10.9 3.4 12 3.4z" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
    </>
  ),
  /** Ticket stub: the outline form the mock uses in the account list. */
  "ticket-stub": (
    <>
      <rect x="3.2" y="5.4" width="17.6" height="13.2" rx="3.2" />
      <path d="M7.4 9.6h4.2M7.4 12.4h6.4M7.4 15.2h3.2" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5.2 20c.6-3.6 3.4-5.6 6.8-5.6s6.2 2 6.8 5.6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.2" />
      <path d="m15.6 15.6 3.4 3.4" />
    </>
  ),
  filter: (
    <>
      <path d="M4 8h9" />
      <path d="M17 8h3" />
      <path d="M4 16h3" />
      <path d="M11 16h9" />
      <circle cx="15" cy="8" r="2" />
      <circle cx="9" cy="16" r="2" />
    </>
  ),
  "chevron-right": <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />,
  "chevron-left": <path d="M14.5 5.5 8 12l6.5 6.5" />,
  "arrow-right": (
    <>
      <path d="M4.5 12h14" />
      <path d="m13 6.5 5.5 5.5-5.5 5.5" />
    </>
  ),
  share: (
    <>
      <path d="M12 3.5v11" />
      <path d="m8 7.2 4-3.7 4 3.7" />
      <path d="M5.5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-6.5" />
    </>
  ),
  heart: (
    <path d="M12 20s-6.8-4.2-8.2-8A4.4 4.4 0 0 1 12 7.4 4.4 4.4 0 0 1 20.2 12c-1.4 3.8-8.2 8-8.2 8z" />
  ),
  "map-pin": (
    <>
      <path d="M12 21s6.5-5.6 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15.4 12 21 12 21z" />
      <circle cx="12" cy="10.4" r="2.4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="2.5" />
      <path d="M4 10h16" />
      <path d="M8.5 3.5v4" />
      <path d="M15.5 3.5v4" />
    </>
  ),
  gift: (
    <>
      <rect x="4" y="8.5" width="16" height="11.5" rx="2" />
      <path d="M3 8.5h18v3.2H3z" />
      <path d="M12 8.5V20" />
      <path d="M12 8.5S10.8 4 8.4 4a2.2 2.2 0 0 0 0 4.5z" />
      <path d="M12 8.5S13.2 4 15.6 4a2.2 2.2 0 0 1 0 4.5z" />
    </>
  ),
  crown: (
    <>
      <path d="M3.5 8.5 6 16h12l2.5-7.5-4.6 3.2L12 6l-3.9 5.7z" />
      <path d="M6.5 19h11" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V6.6l9-2v11" />
      <circle cx="6.6" cy="18" r="2.4" />
      <circle cx="15.6" cy="15.6" r="2.4" />
    </>
  ),
  drink: (
    <>
      <path d="M8 4h3.4v8.2A2.8 2.8 0 0 0 14.2 15h.3l1.3 4.2" />
      <path d="M6.4 3.6h6.6v2.2H6.4z" />
      <path d="M14.2 9.6h5.2l-1.4 6.4a2 2 0 0 1-2 1.6h-.4" />
      <path d="M14.2 9.6h5.2" />
    </>
  ),
  check: <path d="m5 12.8 4.2 4.2L19 7.2" />,
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.2 12.2 2.6 2.6 5-5.2" />
    </>
  ),
  bell: (
    <>
      <path d="M18 15.5V10a6 6 0 1 0-12 0v5.5L4.5 18h15z" />
      <path d="M10 20.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="2.9" />
      <path d="M19.2 14.2a1.6 1.6 0 0 0 .3 1.7l.1.1a1.9 1.9 0 1 1-2.7 2.7l-.1-.1a1.6 1.6 0 0 0-1.7-.3 1.6 1.6 0 0 0-1 1.4v.3a1.9 1.9 0 1 1-3.8 0v-.2a1.6 1.6 0 0 0-1-1.4 1.6 1.6 0 0 0-1.8.3l-.1.1a1.9 1.9 0 1 1-2.7-2.7l.1-.1a1.6 1.6 0 0 0 .3-1.7 1.6 1.6 0 0 0-1.4-1H3.4a1.9 1.9 0 1 1 0-3.8h.2a1.6 1.6 0 0 0 1.4-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a1.9 1.9 0 1 1 2.7-2.7l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.4V3.4a1.9 1.9 0 1 1 3.8 0v.2a1.6 1.6 0 0 0 1 1.4 1.6 1.6 0 0 0 1.7-.3l.1-.1a1.9 1.9 0 1 1 2.7 2.7l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.4 1h.3a1.9 1.9 0 1 1 0 3.8h-.2a1.6 1.6 0 0 0-1.4 1z" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M9.6 9.4a2.5 2.5 0 0 1 4.9.7c0 1.7-2.5 2.1-2.5 3.7" />
      <path d="M12 17.2h.01" />
    </>
  ),
  minus: <path d="M5.5 12h13" />,
  plus: (
    <>
      <path d="M12 5.5v13" />
      <path d="M5.5 12h13" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5c.9 4 2.5 5.6 6.5 6.5-4 .9-5.6 2.5-6.5 6.5-.9-4-2.5-5.6-6.5-6.5 4-.9 5.6-2.5 6.5-6.5z" />
      <path d="M17.6 16.2c.4 1.7 1.1 2.4 2.8 2.8-1.7.4-2.4 1.1-2.8 2.8-.4-1.7-1.1-2.4-2.8-2.8 1.7-.4 2.4-1.1 2.8-2.8z" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.2" r="3.7" />
      <path d="M4.8 20.2c.7-3.7 3.5-5.8 7.2-5.8s6.5 2.1 7.2 5.8" />
    </>
  ),
};

export function Icon({ name, size = 24, filled = false, ...props }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true as const,
    focusable: "false" as const,
    ...props,
  };

  if (name === "dot") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
    );
  }

  if (name === "play") {
    return (
      <svg {...common}>
        <path d="M8.4 5.6a1 1 0 0 1 1.52-.85l9.1 6.4a1 1 0 0 1 0 1.7l-9.1 6.4a1 1 0 0 1-1.52-.85z" fill="currentColor" />
      </svg>
    );
  }

  if (name === "pause") {
    return (
      <svg {...common}>
        <rect x="7" y="5.5" width="3.6" height="13" rx="1.5" fill="currentColor" />
        <rect x="13.4" y="5.5" width="3.6" height="13" rx="1.5" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg
      {...common}
      stroke="currentColor"
      strokeWidth={filled ? 2.1 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {strokePaths[name as keyof typeof strokePaths]}
    </svg>
  );
}
