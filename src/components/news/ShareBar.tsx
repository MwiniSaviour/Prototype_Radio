"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { IconLink, IconShare, IconXSocial } from "../ui/icons";

export interface ShareBarProps {
  url: string;
  title: string;
  className?: string;
}

const shareTargets = [
  {
    label: "X",
    Icon: IconXSocial,
    href: (url: string, title: string) =>
      `https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    label: "Facebook",
    Icon: IconShare,
    href: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
];

export function ShareBar({ url, title, className }: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Share</span>
      {shareTargets.map(({ label, Icon, href }) => (
        <a
          key={label}
          href={href(url, title)}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors duration-150 hover:bg-surface-2 focus-visible:focus-ring"
        >
          <span className="sr-only">Share on {label}</span>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors duration-150 hover:bg-surface-2 focus-visible:focus-ring"
      >
        <IconLink className="h-4 w-4" aria-hidden="true" />
        {copied ? "Copied" : "Copy link"}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </div>
  );
}
