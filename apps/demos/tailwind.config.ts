import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

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
			fontSize: {
				'xs': 'var( --fluid-1 )',
				'sm': 'var( --fluid-2 )',
				'base': [ 'var( --fluid-3 )', { letterSpacing: "-0.025em" } ],
				'lg': [ 'var( --fluid-4 )', { lineHeight: '1.75rem', letterSpacing: '-0.01em' } ],
				'xl': [ 'var( --fluid-5 )', { lineHeight: '2.1rem', letterSpacing: '-0.02em', fontWeight: '500' } ],
				'2xl': [ 'var( --fluid-6 )', { lineHeight: '2.5rem', letterSpacing: '-0.04em', fontWeight: '500' } ],
				'3xl': [ 'var( --fluid-7 )', { lineHeight: '2.5rem', letterSpacing: '-0.05em', fontWeight: '500' } ],
				'4xl': 'var( --fluid-8 )',
			},
		},
	},
	plugins: [
		plugin( function({ addBase, addComponents, addVariant, theme } ){

			/**
			 * Fluid typography old device support version
			 * @see https://css-tricks.com/snippets/css/fluid-typography/
			 */
			const min_width = 320; //px
			const max_width = 1650; //px
			const min_font = 10; //px

			const getFontSize = ( minFontSize: number, maxFontSize: number ) => {
				return `calc(${ minFontSize }px + (${ maxFontSize } - ${ minFontSize }) * ((100vw - ${ min_width }px) / (${ max_width } - ${ min_width })))`;
			};

			const fontSizes: { [ key:string ]: string } = {};

			let lastMax = min_font;

			for ( let i = 1; i < 10; i++ ){
				const min = lastMax;
				const max = lastMax + Math.round( i * 1.5 );
				lastMax = max;
				fontSizes[ `--fluid-${ i }` ] = getFontSize( min, max );
			}

			addBase({ 
				":root": fontSizes
			});

		})
	],
};
export default config;
