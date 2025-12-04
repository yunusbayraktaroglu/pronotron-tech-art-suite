import type { NextConfig } from 'next';
import { PHASE_PRODUCTION_BUILD }  from "next/constants.js";

const nextConfig = ( phase: string ): NextConfig => {
	
	if ( phase === PHASE_PRODUCTION_BUILD ) {
		return {
			output: 'export',
			basePath: '/pronotron-tech-art-suite',
		};
	}

	return {};
};

export default nextConfig;