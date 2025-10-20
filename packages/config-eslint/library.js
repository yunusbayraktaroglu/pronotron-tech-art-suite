import stylistic from '@stylistic/eslint-plugin';

import { config as baseConfig } from "./base.js";

/**
 * A shared TS library configuration for the packages.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
	...baseConfig,
	{
		plugins: {
			'@stylistic': stylistic
		},
		rules: {
			"@typescript-eslint/no-use-before-define": "off",
			"@typescript-eslint/no-unused-vars": [ "warn", {
				"argsIgnorePattern": "^_"
			}],
			"@typescript-eslint/no-var-requires": [ "off" ],
			"@typescript-eslint/no-non-null-assertion": [ "off" ],
			"@stylistic/type-annotation-spacing": [ "error", { "after": true } ],
			"max-len": [ "warn", {
				"code": 120,
				"tabWidth": 4,
				"ignoreUrls": true,
				"ignorePattern": "^import|^export"
			} ],
			"semi": [ "error" ],
			"eqeqeq": [ "warn", "smart" ],
			"space-infix-ops": [ "warn" ],
			"space-in-parens": [ "error", "always" ],
			"object-curly-spacing": [ "error", "always" ],
			"array-bracket-spacing": [ "error", "always" ],
			"key-spacing": [ "error", { "afterColon": true } ],
			"no-irregular-whitespace": [ "warn" ],
			"comma-spacing": [ "warn" ]
		},
	}
];