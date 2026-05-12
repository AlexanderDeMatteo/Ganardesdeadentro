import coreWebVitals from "eslint-config-next/core-web-vitals";

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "backend/**", "public/**"],
  },
  ...coreWebVitals,
  {
    rules: {
      // React Compiler-oriented rules bundled with eslint-plugin-react-hooks v7;
      // they reject common patterns (localStorage hydration, shadcn carousel, MQL).
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
    },
  },
];

export default eslintConfig;
