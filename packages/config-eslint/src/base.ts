import type { Linter } from "eslint";

import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

// @ts-expect-error No declarations file
import onlyWarn from "eslint-plugin-only-warn";

/**
 * A shared ESLint configuration for the repository.
 */
export const baseConfig: Linter.Config[] = [
	eslint.configs.recommended,
	eslintConfigPrettier,
	...tseslint.configs.recommended,
	{
		plugins: {
			turbo: turboPlugin,
		},
		rules: {
			"turbo/no-undeclared-env-vars": "warn",
		},
	},
	{
		plugins: {
			onlyWarn,
		},
	},
	{
		ignores: [ "dist/**" ],
	},
];