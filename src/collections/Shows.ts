import type { CollectionConfig, Option } from "payload";

import { createRevalidateHooks } from "./hooks/revalidate";
import { createSlugHook } from "./hooks/slug";
import { isAdmin, isAdminOrEditor } from "./Users";

// No per-show URL yet: /shows lists every show on one page.
const revalidateShows = createRevalidateHooks(() => ["/", "/shows"]);

const WEEKDAYS: Option[] = [
  { label: "Monday", value: "monday" },
  { label: "Tuesday", value: "tuesday" },
  { label: "Wednesday", value: "wednesday" },
  { label: "Thursday", value: "thursday" },
  { label: "Friday", value: "friday" },
  { label: "Saturday", value: "saturday" },
  { label: "Sunday", value: "sunday" },
];

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
// Slots are consumed verbatim as 24h "HH:MM" strings by the schedule UI, and
// overnight shows legitimately end at 24:00 (the fixtures do), so ends get one
// extra accepted value.
const HHMM_END = /^(24:00|([01]\d|2[0-3]):[0-5]\d)$/;

const validateStart = (value: null | string | undefined) =>
  typeof value === "string" && HHMM.test(value) ? true : "Use 24-hour HH:MM (00:00–23:59).";

const validateEnd = (value: null | string | undefined) =>
  typeof value === "string" && HHMM_END.test(value)
    ? true
    : "Use 24-hour HH:MM, or 24:00 for a midnight end.";

export const Shows: CollectionConfig = {
  slug: "shows",
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
    afterChange: revalidateShows.afterChange,
    afterDelete: revalidateShows.afterDelete,
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
    { name: "tagline", type: "text", required: true },
    { name: "description", type: "textarea", required: true },
    {
      name: "hosts",
      type: "relationship",
      relationTo: "authors",
      hasMany: true,
      required: true,
      minRows: 1,
    },
    {
      name: "schedule",
      type: "array",
      required: true,
      minRows: 1,
      labels: { singular: "Slot", plural: "Slots" },
      fields: [
        { name: "day", type: "select", required: true, options: WEEKDAYS },
        {
          name: "start",
          type: "text",
          required: true,
          validate: validateStart,
          admin: { placeholder: "06:30" },
        },
        {
          name: "end",
          type: "text",
          required: true,
          validate: validateEnd,
          admin: { placeholder: "09:00" },
        },
      ],
    },
    {
      name: "image",
      type: "group",
      required: true,
      fields: [
        { name: "src", type: "text", required: true },
        { name: "alt", type: "text", required: true },
        { name: "credit", type: "text" },
      ],
    },
    { name: "category", type: "relationship", relationTo: "categories" },
    {
      name: "legacyId",
      type: "text",
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
        description: "Stable pre-CMS fixture id (e.g. show-good-morning-wa), set by the seed; never edited by hand.",
      },
    },
  ],
};
