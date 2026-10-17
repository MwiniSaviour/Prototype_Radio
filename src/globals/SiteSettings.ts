import { revalidatePath } from "next/cache";
import type { GlobalAfterChangeHook, GlobalConfig } from "payload";

import { isAdmin } from "../collections/Users";

// SiteSettings feeds nav, footer, socials and the breaking ticker, which render
// in the ROOT layout — so changes must drop the layout cache for every route
// ("layout"), not just the homepage path. revalidatePath throws outside a Next
// request context (e.g. `payload run scripts/seed.ts`); the hourly ISR window
// (revalidate = 3600) covers the missed purge.
const revalidateSite: GlobalAfterChangeHook = () => {
  try {
    revalidatePath("/", "layout");
  } catch {
    // Best effort only — see the note above.
  }
};

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  admin: {
    // Editors have no access to this global; hiding it avoids a nav entry that
    // would only ever return 403.
    hidden: ({ user }) => !user?.roles?.includes("admin"),
  },
  access: {
    // The public site renders nav, footer, socials and the ticker from here.
    read: () => true,
    update: isAdmin,
  },
  hooks: {
    // Payload 3 global hooks are arrays.
    afterChange: [revalidateSite],
  },
  fields: [
    { name: "siteName", type: "text", required: true },
    { name: "siteDescription", type: "textarea", required: true },
    {
      name: "primaryNav",
      type: "array",
      required: true,
      fields: [
        { name: "label", type: "text", required: true },
        { name: "href", type: "text", required: true },
        { name: "external", type: "checkbox" },
      ],
    },
    {
      name: "footerColumns",
      type: "array",
      required: true,
      fields: [
        { name: "heading", type: "text", required: true },
        {
          name: "links",
          type: "array",
          required: true,
          fields: [
            { name: "label", type: "text", required: true },
            { name: "href", type: "text", required: true },
            { name: "external", type: "checkbox" },
          ],
        },
      ],
    },
    {
      name: "socialLinks",
      type: "array",
      required: true,
      fields: [
        { name: "label", type: "text", required: true },
        { name: "href", type: "text", required: true },
      ],
    },
    // nav.ts keeps ticker lines as plain strings, so a hasMany text field
    // round-trips to string[] without a map step.
    { name: "breakingTicker", type: "text", hasMany: true, required: true },
  ],
};
