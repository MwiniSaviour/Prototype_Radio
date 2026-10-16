import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// eslint-config-next v16 ships native ESLint flat configs — no FlatCompat shim needed.
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [".next/", "node_modules/", "next-env.d.ts"],
  },
];

export default eslintConfig;
