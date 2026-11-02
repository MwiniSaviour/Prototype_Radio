import type { CollectionConfig } from "payload";

import { isAdmin, isAdminOrEditor } from "./Users";

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    useAsTitle: "alt",
  },
  access: {
    create: isAdminOrEditor,
    delete: isAdmin,
    // Public site pages embed these files, so anonymous reads must succeed.
    read: () => true,
    update: isAdminOrEditor,
  },
  upload: {
    /*
     * Local disk for development on this Termux host, where there is no cloud
     * storage: Payload serves the files back out of public/media.
     *
     * On Vercel the filesystem is read-only and does not survive between
     * invocations, so @payloadcms/storage-vercel-blob (enabled in
     * payload.config.ts when BLOB_READ_WRITE_TOKEN is set) takes over and sets
     * disableLocalStorage itself. staticDir then goes unused.
     */
    staticDir: "public/media",
    mimeTypes: ["image/*"],
    imageSizes: [
      { name: "thumbnail", width: 400 },
      { name: "card", width: 640 },
      { name: "hero", width: 1280 },
    ],
    adminThumbnail: "thumbnail",
    crop: false,
    focalPoint: false,
  },
  fields: [
    { name: "alt", type: "text", required: true },
    { name: "credit", type: "text" },
    {
      name: "legacyId",
      type: "text",
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
        description: "Stable pre-CMS fixture id, set by the seed; never edited by hand.",
      },
    },
  ],
};
