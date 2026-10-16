/**
 * Resolve hook for running TypeScript entry points under Node's native type
 * stripping on this host.
 *
 * Payload's CLI runs with `--disable-transpile`, which hands module loading to
 * Node instead of tsx (tsx crashes here: it double-loads undici's internal
 * symbols and dies with "Illegal constructor"). Native stripping erases types
 * but does not do extensionless resolution, so `import "./collections/Articles"`
 * fails with ERR_MODULE_NOT_FOUND. This retries failed relative resolutions
 * with the TypeScript extensions and directory-index forms.
 */

import { registerHooks } from "node:module";

const CANDIDATES = [".ts", ".tsx", ".mts", "/index.ts", "/index.tsx"];

registerHooks({
  resolve(specifier, context, nextResolve) {
    const isRelative = specifier.startsWith("./") || specifier.startsWith("../");
    if (!isRelative) return nextResolve(specifier, context);

    try {
      return nextResolve(specifier, context);
    } catch (error) {
      for (const candidate of CANDIDATES) {
        try {
          return nextResolve(specifier + candidate, context);
        } catch {
          // Try the next candidate form before giving up.
        }
      }
      throw error;
    }
  },
});
