import type { AccessArgs, CollectionConfig } from "payload";

/**
 * Role predicates live on the auth collection so every other collection imports a
 * single definition of "admin" and "editor" instead of redeclaring the rule.
 *
 * The role shape is declared locally rather than derived from the generated
 * `User` type: `AccessArgs["user"]` is Payload's runtime user, which is not
 * structurally assignable to the generated type (their `sessions` fields differ
 * by nullability). Only `roles` is read, so narrowing here keeps every consumer
 * type-safe without casts or narrow parameter shapes at each call site.
 *
 * The explicit `boolean` return matters: the collection verbs accept the wider
 * `Access` (which may return a query `Where`), but the Users collection's
 * `access.admin` slot demands a plain boolean, and `boolean` satisfies both.
 */
type RoleUser = { roles?: null | (string | null)[] } | null | undefined;

const hasRole = (user: unknown, role: "admin" | "editor") =>
  Boolean((user as RoleUser)?.roles?.includes(role));

export const isAdmin = ({ req }: AccessArgs): boolean => hasRole(req.user, "admin");

export const isAdminOrEditor = ({ req }: AccessArgs): boolean =>
  hasRole(req.user, "admin") || hasRole(req.user, "editor");

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "name",
    // Editors have zero access to this collection, so don't show them a nav entry
    // that would answer every request with a 403.
    hidden: ({ user }) => !user?.roles?.includes("admin"),
  },
  auth: true,
  access: {
    // Who may open /admin at all: both staff roles log in.
    admin: isAdminOrEditor,
    // The role list itself is admin-only, for every verb.
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "roles",
      type: "select",
      hasMany: true,
      required: true,
      defaultValue: ["editor"],
      options: [
        { label: "Admin", value: "admin" },
        { label: "Editor", value: "editor" },
      ],
    },
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
