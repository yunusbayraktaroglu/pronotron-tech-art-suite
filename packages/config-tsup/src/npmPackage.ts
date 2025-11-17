import type { Options } from "tsup";

export const baseOptions = {
	entry: [ 'src/index.ts' ],
	dts: true,
	outDir: 'dist',
	clean: true,
	format: [ 'cjs', 'esm' ],
	treeshake: true,
	splitting: false,
	cjsInterop: true,
	terserOptions: {
		mangle: {
			properties: { regex: /^_/ },
		},
	},
} as const satisfies Options;