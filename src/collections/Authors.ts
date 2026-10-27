import type { CollectionConfig } from "payload";

import { isAdmin, isAdminOrEditor } from "./Users";

export const Authors: CollectionConfig = {
  slug: "authors",
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
    { name: "role", type: "text", required: true },
    {
      name: "avatarUrl",
      type: "text",
      admin: {
        description: "Served image path, e.g. /assets/images/avatar-abu-bakari-sule.jpg or /media/<file>.",
      },
    },
    { name: "bio", type: "textarea", required: true },
    { name: "location", type: "text", required: true },
    { name: "specialisms", type: "text", hasMany: true, required: true },
    {
      name: "social",
      type: "array",
      required: true,
      fields: [
        { name: "label", type: "text", required: true },
        { name: "href", type: "text", required: true },
      ],
    },
    {
      name: "legacyId",
      type: "text",
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
        description: "Stable pre-CMS fixture id (e.g. author-abu-sule), set by the seed; never edited by hand.",
      },
    },
  ],
};
