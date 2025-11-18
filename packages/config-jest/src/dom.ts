import type { Config } from 'jest';

export const domConfig = {
	testMatch: [ "**/tests/**/*.test.ts" ],
	testEnvironment: "jsdom",
	collectCoverage: true,
	coverageReporters: [ 'text', 'cobertura' ],
} as const satisfies Config;