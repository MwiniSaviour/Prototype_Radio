import type { CollectionConfig } from "payload";

import { isAdmin, isAdminOrEditor } from "./Users";

/**
 * Listener accounts for the Prototype Radio app. Deliberately not an auth
 * collection yet — the design ships a signed-in demo listener (Profile tab) and
 * the backend has no account story to share with the website. Making this
 * `auth: true` later keeps the same document shape.
 */
export const Listeners: CollectionConfig = {
  slug: "listeners",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "email", "notificationsEnabled"],
  },
  access: {
    create: isAdminOrEditor,
    delete: isAdmin,
    read: () => true,
    update: isAdminOrEditor,
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "email", type: "email", required: true, unique: true, index: true },
    { name: "avatarUrl", type: "text", required: true },
    {
      name: "favouriteStations",
      type: "relationship",
      relationTo: "stations",
      hasMany: true,
    },
    { name: "notificationsEnabled", type: "checkbox", defaultValue: true },
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
