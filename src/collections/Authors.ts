import type { CollectionConfig } from "payload";

import { createRevalidateHooks } from "./hooks/revalidate";
import { createSlugHook } from "./hooks/slug";
import { isAdmin, isAdminOrEditor } from "./Users";

// There is no author-facing route; author data renders inside article pages.
const revalidateAuthors = createRevalidateHooks(() => ["/"]);

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
  hooks: {
    afterChange: revalidateAuthors.afterChange,
    afterDelete: revalidateAuthors.afterDelete,
  },
  fields: [
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      hooks: { beforeValidate: [createSlugHook("name")] },
    },
    { name: "name", type: "text", required: true },
    { name: "role", type: "text", required: true },
    {
      name: "avatarUrl",
      type: "text",
      admin: {
        description: "Served image path, e.g. /assets/images/avatar-abu-bakari-sule.svg or /media/<file>.",
      },
    },
    { name: "bio", type: "textarea", required: true },
    { name: "location", type: "text", required: true },
    {
      name: "specialisms",
      type: "text",
      hasMany: true,
      required: true,
      // Same Enter-to-commit behavior as article tags — see Articles.ts.
      admin: {
        description: "Type a specialism and press Enter to add it.",
      },
    },
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
