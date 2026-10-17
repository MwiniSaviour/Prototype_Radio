import type {
  Block,
  CollectionBeforeValidateHook,
  CollectionConfig,
} from "payload";

import { createRevalidateHooks } from "./hooks/revalidate";
import { createSlugHook } from "./hooks/slug";
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

// readingMinutes is derived, never trusted from input. This must be a
// collection-level beforeValidate hook: field-level hooks and validation run
// later, so the required check would reject every editor save that omitted
// (or autosaved without) a value before we could fill it in.
const wordCount = (text: string): number =>
  text.trim().split(/\s+/).filter(Boolean).length;

const blockWords = (block: unknown): number => {
  if (typeof block !== "object" || block === null) return 0;
  const fields = block as Record<string, unknown>;
  if (
    fields.blockType === "paragraph" ||
    fields.blockType === "heading" ||
    fields.blockType === "quote"
  ) {
    return typeof fields.text === "string" ? wordCount(fields.text) : 0;
  }
  if (fields.blockType === "list") {
    return Array.isArray(fields.items)
      ? wordCount(fields.items.filter((item) => typeof item === "string").join(" "))
      : 0;
  }
  return 0;
};

// 200 wpm is the standard reading-speed assumption; round up to at least 1.
const deriveReadingMinutes: CollectionBeforeValidateHook = ({ data }) => {
  if (!data || !Array.isArray(data.body)) return;
  const words = data.body.reduce<number>((sum, block) => sum + blockWords(block), 0);
  data.readingMinutes = Math.max(1, Math.round(words / 200));
  return data;
};

const revalidateArticles = createRevalidateHooks((doc) => {
  const paths = ["/"];
  if (typeof doc.slug === "string" && doc.slug) paths.push(`/article/${doc.slug}`);
  // Relationships may arrive as raw ids, so the category page is purged only
  // when the relation resolved to a populated object with a string slug.
  const category =
    typeof doc.category === "object" && doc.category !== null
      ? (doc.category as Record<string, unknown>)
      : null;
  if (category && typeof category.slug === "string") {
    paths.push(`/category/${category.slug}`);
  }
  return paths;
});

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
  versions: {
    drafts: {
      autosave: true,
    },
  },
  hooks: {
    beforeValidate: [deriveReadingMinutes],
    afterChange: revalidateArticles.afterChange,
    afterDelete: revalidateArticles.afterDelete,
  },
  fields: [
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      hooks: { beforeValidate: [createSlugHook("title")] },
    },
    { name: "title", type: "text", required: true },
    { name: "excerpt", type: "textarea", required: true },
    { name: "category", type: "relationship", relationTo: "categories", required: true, index: true },
    { name: "author", type: "relationship", relationTo: "authors", required: true, index: true },
    { name: "publishedAt", type: "date", required: true, index: true },
    {
      name: "readingMinutes",
      type: "number",
      required: true,
      min: 1,
      admin: {
        readOnly: true,
        description: "Derived automatically from the body on save.",
      },
    },
    {
      name: "image",
      type: "group",
      required: true,
      fields: [
        {
          name: "src",
          type: "text",
          required: true,
          // ArticleCard and the hero render next/image against this; a remote
          // host not under our control breaks the fixed asset inventory.
          validate: (value: null | string | undefined) =>
            typeof value === "string" &&
            (value.startsWith("/") || value.startsWith("https://"))
              ? true
              : "Image src must be a local path (starting with /) or a full https:// URL.",
        },
        { name: "alt", type: "text", required: true },
        { name: "credit", type: "text" },
      ],
    },
    {
      name: "tags",
      type: "text",
      hasMany: true,
      required: true,
      admin: {
        // Payload commits a hasMany text value only on Enter; blur discards the
        // typed text. The description pre-empts the "my tag vanished" report.
        description: "Type a tag and press Enter to add it.",
      },
    },
    { name: "featured", type: "checkbox" },
    { name: "breaking", type: "checkbox" },
    { name: "body", type: "blocks", blocks: bodyBlocks, required: true, minRows: 1 },
    // Share-card overrides; blank values mean "fall back to title/excerpt"
    // (the fallback annotations describe what the FE does when these are empty).
    {
      name: "meta",
      type: "group",
      label: "SEO overrides",
      fields: [
        {
          name: "title",
          type: "text",
          maxLength: 60,
          admin: {
            description:
              "Overrides the browser-tab and share title. Defaults to the article title.",
          },
        },
        {
          name: "description",
          type: "textarea",
          maxLength: 160,
          admin: {
            description: "Overrides the share-card description. Defaults to the excerpt.",
          },
        },
      ],
    },
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
