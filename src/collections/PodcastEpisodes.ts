import type { CollectionConfig } from "payload";

import { createRevalidateHooks } from "./hooks/revalidate";
import { createSlugHook } from "./hooks/slug";
import { isAdmin, isAdminOrEditor } from "./Users";

// Episodes live under /podcasts; there is no per-episode URL yet.
const revalidateEpisodes = createRevalidateHooks(() => ["/", "/podcasts", "/feeds/w93-5.xml"]);

export const PodcastEpisodes: CollectionConfig = {
  slug: "podcast-episodes",
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
  hooks: {
    afterChange: revalidateEpisodes.afterChange,
    afterDelete: revalidateEpisodes.afterDelete,
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
    { name: "description", type: "textarea", required: true },
    // PodcastEpisode.showId is a relation, not a string: the seed resolves the
    // fixture showId (e.g. show-the-long-listen) to the Shows document.
    { name: "show", type: "relationship", relationTo: "shows", required: true, index: true },
    { name: "season", type: "number", required: true, min: 1 },
    { name: "episodeNumber", type: "number", required: true, min: 1 },
    { name: "publishedAt", type: "date", required: true, index: true },
    { name: "durationSeconds", type: "number", required: true, min: 1 },
    // Optional hosted-audio metadata for the RSS feed; values stay null until
    // a real audio host is configured (AUDIO_SAMPLE_BASE_URL) — plan §3.
    {
      name: "audioUrl",
      type: "text",
      validate: (value: string | null | undefined) => {
        if (value == null || value === "") return true;
        try {
          const url = new URL(value);
          if (url.protocol === "http:" || url.protocol === "https:") return true;
          return "audioUrl must be an http:// or https:// URL";
        } catch {
          return "audioUrl must be a valid absolute URL";
        }
      },
    },
    {
      name: "audioMimeType",
      type: "text",
      validate: (value: string | null | undefined) =>
        value == null || value === "" || /^audio\/(mpeg|mp4|aac|ogg|opus|wav)$/.test(value)
          ? true
          : "audioMimeType must be audio/(mpeg, mp4, aac, ogg, opus or wav)",
    },
    {
      name: "audioByteLength",
      type: "number",
      validate: (value: number | null | undefined) =>
        value == null || (Number.isInteger(value) && value > 0)
          ? true
          : "audioByteLength must be a positive whole number of bytes",
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
    {
      name: "tags",
      type: "text",
      hasMany: true,
      required: true,
      // Same Enter-to-commit behavior as article tags — see Articles.ts.
      admin: {
        description: "Type a tag and press Enter to add it.",
      },
    },
    {
      name: "legacyId",
      type: "text",
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
        description: "Stable pre-CMS fixture id (e.g. ep-wa-files-12), set by the seed; never edited by hand.",
      },
    },
  ],
};
