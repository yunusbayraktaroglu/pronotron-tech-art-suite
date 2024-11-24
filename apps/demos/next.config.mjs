import { PHASE_PRODUCTION_BUILD }  from "next/constants.js";

export default ( phase, { defaultConfig }) => {

	if ( phase === PHASE_PRODUCTION_BUILD ){

		/** @type {import('next').NextConfig} */
		const nextConfig = {
			/**
			 * GitHub pages configuration
			 * @see https://github.com/nextjs/deploy-github-pages
			 */
			output: 'export',
			basePath: "/pronotron-tech-art-suite",
		};

		return nextConfig;
	}

	return defaultConfig;

}