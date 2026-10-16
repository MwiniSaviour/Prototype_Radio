import type { CollectionConfig } from "payload";

import { isAdmin, isAdminOrEditor } from "./Users";

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
  fields: [
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "title", type: "text", required: true },
    { name: "description", type: "textarea", required: true },
    // PodcastEpisode.showId is a relation, not a string: the seed resolves the
    // fixture showId (e.g. show-the-long-listen) to the Shows document.
    { name: "show", type: "relationship", relationTo: "shows", required: true, index: true },
    { name: "season", type: "number", required: true, min: 1 },
    { name: "episodeNumber", type: "number", required: true, min: 1 },
    { name: "publishedAt", type: "date", required: true, index: true },
    { name: "durationSeconds", type: "number", required: true, min: 1 },
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
