import type { CollectionConfig, Option } from "payload";

import { isAdmin, isAdminOrEditor } from "./Users";

const STATUSES: Option[] = [
  { label: "Confirmed", value: "confirmed" },
  { label: "Pending", value: "pending" },
  { label: "Past", value: "past" },
];

/**
 * A listener's ticket wallet. There is no listener auth yet (the app ships a
 * single seeded demo listener), so ownership is a plain email field that the
 * mobile client filters on; swapping it for a relationship to an auth
 * collection is a one-field change when accounts land.
 */
export const Tickets: CollectionConfig = {
  slug: "tickets",
  admin: {
    useAsTitle: "reference",
    defaultColumns: ["reference", "event", "tierName", "status"],
  },
  access: {
    create: isAdminOrEditor,
    delete: isAdmin,
    read: () => true,
    update: isAdminOrEditor,
  },
  fields: [
    { name: "event", type: "relationship", relationTo: "events", required: true, index: true },
    {
      name: "ownerEmail",
      type: "email",
      required: true,
      index: true,
      admin: { description: "Listenship owner; the mobile wallet filters by this address." },
    },
    { name: "tierId", type: "text", required: true },
    { name: "tierName", type: "text", required: true },
    { name: "quantity", type: "number", required: true, min: 1, defaultValue: 1 },
    { name: "status", type: "select", required: true, options: STATUSES, defaultValue: "confirmed" },
    { name: "reference", type: "text", required: true, unique: true },
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
