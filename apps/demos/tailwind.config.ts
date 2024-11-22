import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	corePlugins: {
		container: false
	},
	theme: {
		screens: {
			portrait: '(orientation: portrait)',
			landscape: '(orientation: landscape)'
		},
		extend: {
			spacing: {
				'content-outside-width': 'var( --content-outside-width )',
				'spacing-xs': 'var( --spacing-xs )',
				'spacing-sm': 'var( --spacing-sm )',
				'spacing-base': 'var( --spacing-base )',
				'spacing-lg': 'var( --spacing-lg )',
				'spacing-xl': 'var( --spacing-xl )',
				'spacing-2xl': 'var( --spacing-2xl )',
				'spacing-3xl': 'var( --spacing-3xl )',
			},
			colors: {
				background: "var(--background)",
				foreground: "var(--foreground)",
			},
		},
	},
	plugins: [],
};
export default config;
