const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = {
	extends: [ 
		"eslint:recommended",
		"plugin:@typescript-eslint/eslint-recommended",
		"plugin:@typescript-eslint/recommended", 
		"prettier", 
		"turbo",
	],
	plugins: [ 
		"@typescript-eslint", 
		"only-warn" 
	],
	globals: {
		React: true,
		JSX: true,
	},
	env: {
		node: true,
	},
	settings: {
		"import/resolver": {
			typescript: {
				project,
			},
		},
	},
	ignorePatterns: [
		// Ignore dotfiles
		".*.js",
		"node_modules/",
		"dist/",
	],
	overrides: [
		{
			files: ["*.js?(x)", "*.ts?(x)"],
		},
	],
	rules: {
		"@typescript-eslint/no-use-before-define": "off",
		"@typescript-eslint/no-unused-vars": [ "warn", {
			"argsIgnorePattern": "^_"
		}],
		"@typescript-eslint/no-var-requires": [ "off" ],
		"@typescript-eslint/no-non-null-assertion": [ "off" ],
		"@typescript-eslint/type-annotation-spacing": [ "error", { "after": true } ],
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
};
