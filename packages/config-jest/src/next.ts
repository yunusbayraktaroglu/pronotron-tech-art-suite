/**
 * Next.js Jest testing
 * @see https://nextjs.org/docs/app/guides/testing/jest
 */

import type { Config } from 'jest';

// unfortunately, need to disambiguate the `Config` namespace @jest/types uses (via next/jest) and the `Config` type we want for typing our config here
import type { Config as ConfigNamespace } from '@jest/types';

import nextJest from 'next/jest';
import { baseConfig } from './base';

const createJestConfig = nextJest({
	// Provide the path to your Next.js app to load next.config.js and .env files in your test environment
	dir: './',
});

//const moduleFileExtensions = ...baseConfig.moduleFileExtensions;
const moduleFileExtensions: string[] = [];

const config = {
	...baseConfig,
	moduleFileExtensions: [ ...moduleFileExtensions, 'jsx', 'tsx'],
} as const satisfies Config;

const nextConfig = createJestConfig( config );

export default nextConfig;