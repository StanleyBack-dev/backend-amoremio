import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["src/modules/**/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@nestjs/*",
                "typeorm",
                "src/modules/**/infrastructure/**",
                "src/modules/**/presentation/**",
              ],
              message:
                "Domain deve ser puro e nao pode depender de framework, persistencia ou camada de apresentacao.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/modules/**/application/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "src/modules/**/infrastructure/**",
                "src/modules/**/presentation/**",
              ],
              message:
                "Application deve depender de portas/contratos e nao de implementacoes concretas.",
            },
          ],
        },
      ],
    },
  },
];
