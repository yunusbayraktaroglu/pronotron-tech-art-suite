import type { NextConfig } from 'next';
import { PHASE_PRODUCTION_BUILD }  from "next/constants.js";

const nextConfig = ( phase: string ): NextConfig => {
	
	if ( phase === PHASE_PRODUCTION_BUILD ) {
		return {
			output: 'export',
			basePath: '/pronotron-tech-art-suite',
            env: {
				/**
				 * Solving image path issues in 'subdirectories'
				 * 
				 * @example
				 * `${ process.env.NEXT_PUBLIC_BASE_PATH }/image-url.png`
				 */
                NEXT_PUBLIC_BASE_PATH: '/pronotron-tech-art-suite',
            },
		};
	}

	return {
		env: {
			NEXT_PUBLIC_BASE_PATH: '',
		},
	};
};

export default nextConfig;