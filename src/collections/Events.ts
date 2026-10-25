import type { CollectionConfig, Option } from "payload";

import { isAdmin, isAdminOrEditor } from "./Users";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

const validateClock = (value: null | string | undefined) =>
  typeof value === "string" && HHMM.test(value) ? true : "Use 24-hour HH:MM (00:00–23:59).";

const TAGS: Option[] = [
  { label: "Music", value: "Music" },
  { label: "Comedy", value: "Comedy" },
  { label: "Food & Drink", value: "Food & Drink" },
  { label: "Community", value: "Community" },
  { label: "Festival", value: "Festival" },
  { label: "Party", value: "Party" },
  { label: "Live Show", value: "Live Show" },
];

const AMENITY_ICONS: Option[] = [
  { label: "Music", value: "music" },
  { label: "Drink", value: "drink" },
  { label: "Heart", value: "heart" },
  { label: "Star", value: "star" },
];

const TIER_ICONS: Option[] = [
  { label: "Ticket", value: "ticket" },
  { label: "Crown", value: "crown" },
];

/**
 * Ticketed events for the Explore tab and the event detail page. Ticket tiers
 * are embedded because they only ever exist as part of an event and always load
 * with it.
 */
export const Events: CollectionConfig = {
  slug: "events",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "date", "venue", "featured"],
  },
  access: {
    create: isAdminOrEditor,
    delete: isAdmin,
    read: () => true,
    update: isAdminOrEditor,
  },
  fields: [
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "title", type: "text", required: true },
    { name: "subtitle", type: "text", required: true },
    { name: "description", type: "textarea", required: true },
    { name: "venue", type: "text", required: true },
    { name: "city", type: "text", required: true },
    { name: "distanceKm", type: "number", required: true, min: 0 },
    { name: "date", type: "date", required: true, index: true },
    { name: "startTime", type: "text", required: true, validate: validateClock },
    { name: "endTime", type: "text", required: true, validate: validateClock },
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
    { name: "tags", type: "select", hasMany: true, required: true, options: TAGS },
    { name: "featured", type: "checkbox", defaultValue: false },
    {
      name: "priceFrom",
      type: "number",
      required: true,
      min: 0,
      admin: { description: "Lowest tier price in whole cedis (GHC)." },
    },
    {
      name: "tiers",
      type: "array",
      required: true,
      minRows: 1,
      labels: { singular: "Ticket tier", plural: "Ticket tiers" },
      fields: [
        { name: "tierId", type: "text", required: true },
        { name: "name", type: "text", required: true },
        { name: "description", type: "text", required: true },
        { name: "price", type: "number", required: true, min: 0 },
        { name: "perks", type: "text", hasMany: true },
        { name: "icon", type: "select", required: true, options: TIER_ICONS },
      ],
    },
    {
      name: "amenities",
      type: "array",
      fields: [
        { name: "label", type: "text", required: true },
        { name: "icon", type: "select", required: true, options: AMENITY_ICONS },
      ],
    },
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
