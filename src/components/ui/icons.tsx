import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

/*
 * Inline icon set — hand-drawn on a 24px grid, stroke-based, inherits
 * currentColor. Decorative by default: callers rely on aria-label from the
 * surrounding control.
 */
function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </Icon>
  );
}

export function IconMenu(props: IconProps) {
  return (
    <Icon {...props}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </Icon>
  );
}

export function IconClose(props: IconProps) {
  return (
    <Icon {...props}>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </Icon>
  );
}

export function IconSun(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="4.5" />
      <line x1="12" y1="19.5" x2="12" y2="22" />
      <line x1="2" y1="12" x2="4.5" y2="12" />
      <line x1="19.5" y1="12" x2="22" y2="12" />
      <line x1="5" y1="5" x2="6.8" y2="6.8" />
      <line x1="17.2" y1="17.2" x2="19" y2="19" />
      <line x1="5" y1="19" x2="6.8" y2="17.2" />
      <line x1="17.2" y1="6.8" x2="19" y2="5" />
    </Icon>
  );
}

export function IconMoon(props: IconProps) {
  return <Icon {...props}>
    <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
  </Icon>;
}

export function IconPlay(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
    </Icon>
  );
}

export function IconPause(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="7" y="5.5" width="3.5" height="13" rx="1.2" fill="currentColor" stroke="none" />
      <rect x="13.5" y="5.5" width="3.5" height="13" rx="1.2" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function IconVolume(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 9.5h3L11.5 6v12L7.5 14.5h-3z" />
      <path d="M15 9.5a4 4 0 0 1 0 5" />
      <path d="M17.8 7a8 8 0 0 1 0 10" />
    </Icon>
  );
}

export function IconShare(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <line x1="8.3" y1="10.9" x2="15.7" y2="6.6" />
      <line x1="8.3" y1="13.1" x2="15.7" y2="17.4" />
    </Icon>
  );
}

export function IconLink(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 14a4.5 4.5 0 0 0 6.4.4l2.6-2.6a4.5 4.5 0 0 0-6.4-6.4l-1.3 1.3" />
      <path d="M14 10a4.5 4.5 0 0 0-6.4-.4L5 12.2a4.5 4.5 0 0 0 6.4 6.4l1.3-1.3" />
    </Icon>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 5l7 7-7 7" />
    </Icon>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <Icon {...props}>
      <line x1="4" y1="12" x2="19" y2="12" />
      <path d="M13 6l6 6-6 6" />
    </Icon>
  );
}

export function IconClock(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Icon>
  );
}

export function IconMail(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M3.5 7.5l8.5 6 8.5-6" />
    </Icon>
  );
}

export function IconHeadphones(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2" />
      <rect x="3" y="13.5" width="4" height="6" rx="1.75" />
      <rect x="17" y="13.5" width="4" height="6" rx="1.75" />
    </Icon>
  );
}

export function IconWaves(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12c2.5 0 2.5 3 5 3s2.5-3 5-3 2.5 3 5 3 2.5-3 3-3" />
      <path d="M3 17c2.5 0 2.5 3 5 3s2.5-3 5-3 2.5 3 5 3 2.5-3 3-3" />
      <path d="M3 7c2.5 0 2.5 3 5 3s2.5-3 5-3 2.5 3 5 3 2.5-3 3-3" />
    </Icon>
  );
}

/** The broadcaster's pulse mark: six rounded bars around the centre line. */
export function IconWaveform(props: IconProps) {
  return (
    <Icon {...props}>
      <line x1="2.5" y1="12" x2="5" y2="12" />
      <line x1="7.5" y1="8" x2="7.5" y2="16" />
      <line x1="11" y1="4.5" x2="11" y2="19.5" />
      <line x1="14.5" y1="7.5" x2="14.5" y2="16.5" />
      <line x1="18" y1="10" x2="18" y2="14" />
      <line x1="21" y1="11" x2="21" y2="13" />
    </Icon>
  );
}

export function IconInbox(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 12.5L6 5.5h12l2.5 7v5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
      <path d="M3.5 12.5H9l1 2.5h4l1-2.5h5.5" />
    </Icon>
  );
}

export function IconXSocial(props: IconProps) {
  return (
    <Icon {...props}>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </Icon>
  );
}

export function IconFacebook(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.5 8.5h2.5V5.8h-2.7c-2.3 0-3.6 1.4-3.6 3.7v1.7H8.5v2.8H12.7V21h2.9v-7h2.3l.4-2.8h-2.7V9.4c0-.6.3-.9.9-.9z" />
    </Icon>
  );
}

export function IconInstagram(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="0.9" fill="currentColor" />
    </Icon>
  );
}

export function IconYouTube(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="6" width="19" height="12" rx="3.5" />
      <path d="M10.5 9.5l5 2.5-5 2.5z" fill="currentColor" />
    </Icon>
  );
}

export function IconRss(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="6" cy="18" r="1.6" fill="currentColor" />
      <path d="M4.5 4.5a15 15 0 0 1 15 15" />
      <path d="M4.5 9.5a10 10 0 0 1 10 10" />
    </Icon>
  );
}
