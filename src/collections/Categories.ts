import type { CollectionConfig } from "payload";

import { isAdmin, isAdminOrEditor } from "./Users";

export const Categories: CollectionConfig = {
  slug: "categories",
  admin: {
    useAsTitle: "name",
  },
  access: {
    create: isAdminOrEditor,
    delete: isAdmin,
    read: () => true,
    update: isAdminOrEditor,
  },
  fields: [
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "name", type: "text", required: true },
    { name: "description", type: "textarea", required: true },
    {
      name: "icon",
      type: "text",
      required: true,
      admin: {
        description: "Stem of public/assets/icons/icon-<icon>.svg, e.g. map-pin.",
      },
    },
    {
      name: "accentToken",
      type: "select",
      required: true,
      options: [
        { label: "Brand", value: "brand" },
        { label: "Accent", value: "accent" },
        { label: "Ink", value: "ink" },
        { label: "Muted", value: "muted" },
      ],
    },
    // articleCount is intentionally absent: it is derived from the articles table,
    // never stored (src/data/categories.ts carries it only as a build-time check).
    {
      name: "legacyId",
      type: "text",
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
        description: "Stable pre-CMS fixture id (e.g. cat-local-news), set by the seed; never edited by hand.",
      },
    },
  ],
};
