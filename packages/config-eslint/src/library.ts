import type { Linter } from "eslint";
import stylistic from '@stylistic/eslint-plugin';

import { baseConfig } from "./base.js";

/**
 * A shared TS library configuration for the packages.
 */
export const libraryConfig: Linter.Config[] = [
	...baseConfig,
	{
		plugins: {
			'@stylistic': stylistic
		},
		rules: {
			"@typescript-eslint/no-use-before-define": "off",
			"@typescript-eslint/no-unused-vars": [ "warn", { "argsIgnorePattern": "^_" }],
			"@typescript-eslint/no-var-requires": [ "off" ],
			"@typescript-eslint/no-non-null-assertion": [ "off" ],

			"@stylistic/type-annotation-spacing": [ "error", { "after": true } ],
			"@stylistic/space-in-parens": [ "error", "always" ],
			"@stylistic/semi": [ "error" ],
			"@stylistic/space-infix-ops": [ "warn" ],
			"@stylistic/object-curly-spacing": [ "error", "always" ],
			"@stylistic/array-bracket-spacing": [ "error", "always" ],
			"@stylistic/computed-property-spacing": [ "error", "always" ],
			"@stylistic/key-spacing": [ "error", { "afterColon": true } ],
			"@stylistic/comma-spacing": [ "warn" ],
			"@stylistic/max-len": [ "warn", {
				"code": 120,
				"tabWidth": 4,
				"ignoreUrls": true,
				"ignorePattern": "^import|^export"
			} ],
			//"@stylistic/brace-style": [ "error", "allman", { "allowSingleLine": true } ],
			
			"eqeqeq": [ "warn", "smart" ]
		},
	}
];