import type { GlobalConfig } from "payload";

import { isAdmin } from "../collections/Users";

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
