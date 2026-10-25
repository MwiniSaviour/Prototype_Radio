import type { CollectionConfig } from "payload";

import { isAdmin, isAdminOrEditor } from "./Users";

/**
 * Prototype Radio station. The web app keeps its shows/podcasts in `shows`; this
 * collection is the dial list the mobile app's "Live Radio" rail reads, and it
 * is seeded from the same fixtures (src/data/stations.ts).
 */
export const Stations: CollectionConfig = {
  slug: "stations",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "frequency", "city", "live"],
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
    {
      name: "frequency",
      type: "text",
      required: true,
      admin: { description: 'Dial position as displayed, e.g. "102.5 FM".' },
    },
    { name: "city", type: "text", required: true },
    { name: "tagline", type: "text", required: true },
    {
      name: "artwork",
      type: "group",
      required: true,
      fields: [
        { name: "src", type: "text", required: true },
        { name: "alt", type: "text", required: true },
        { name: "credit", type: "text" },
      ],
    },
    {
      name: "streamUrl",
      type: "text",
      admin: {
        description:
          "Live stream for this station. Empty renders the player's accessible \"stream not configured\" state.",
      },
    },
    { name: "flagship", type: "checkbox", defaultValue: false },
    { name: "live", type: "checkbox", defaultValue: false },
    {
      name: "legacyId",
      type: "text",
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
        description: "Stable pre-CMS fixture id — set by the seed.",
      },
    },
  ],
};
