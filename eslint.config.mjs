import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Interface en français : les apostrophes dans le JSX sont normales.
  { rules: { "react/no-unescaped-entities": "off" } },
];
