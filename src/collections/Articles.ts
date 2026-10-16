import type { Block, CollectionConfig } from "payload";

import { isAdmin, isAdminOrEditor } from "./Users";

/**
 * One block per ArticleBlock variant from src/lib/types.ts, so seeded bodies and
 * rendered bodies stay the same shape — no richtext conversion layer, and no
 * @payloadcms/richtext-lexical in the dependency tree.
 */
const bodyBlocks: Block[] = [
  {
    slug: "paragraph",
    labels: { singular: "Paragraph", plural: "Paragraphs" },
    fields: [{ name: "text", type: "textarea", required: true }],
  },
  {
    slug: "heading",
    labels: { singular: "Heading", plural: "Headings" },
    fields: [
      {
        name: "level",
        type: "number",
        required: true,
        // The site union is literally `2 | 3`; a select would store "2"/"3"
        // strings and force a Number() on every render.
        validate: (value: null | number | undefined) =>
          value === 2 || value === 3 ? true : "Heading level must be 2 or 3.",
      },
      { name: "text", type: "text", required: true },
    ],
  },
  {
    slug: "quote",
    labels: { singular: "Quote", plural: "Quotes" },
    fields: [
      { name: "text", type: "textarea", required: true },
      { name: "attribution", type: "text" },
    ],
  },
  {
    slug: "list",
    labels: { singular: "List", plural: "Lists" },
    fields: [
      { name: "ordered", type: "checkbox" },
      { name: "items", type: "text", hasMany: true, required: true },
    ],
  },
];

export const Articles: CollectionConfig = {
  slug: "articles",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "publishedAt"],
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
    { name: "excerpt", type: "textarea", required: true },
    { name: "category", type: "relationship", relationTo: "categories", required: true, index: true },
    { name: "author", type: "relationship", relationTo: "authors", required: true, index: true },
    { name: "publishedAt", type: "date", required: true, index: true },
    { name: "readingMinutes", type: "number", required: true, min: 1 },
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
    { name: "tags", type: "text", hasMany: true, required: true },
    { name: "featured", type: "checkbox" },
    { name: "breaking", type: "checkbox" },
    { name: "body", type: "blocks", blocks: bodyBlocks, required: true, minRows: 1 },
    // Article.updatedAt is intentionally not a field: Payload's automatic
    // `updatedAt` timestamp is the same name and ISO type, and stays true on edit.
    {
      name: "legacyId",
      type: "text",
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
        description: "Stable pre-CMS fixture id (e.g. art-water-emergency), set by the seed; never edited by hand.",
      },
    },
  ],
};
