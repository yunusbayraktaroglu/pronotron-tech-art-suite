import type { Config } from 'jest';

export const baseConfig = {
	testMatch: [ "**/tests/**/*.test.ts" ],
	testEnvironment: "node",
	collectCoverage: true,
	coverageReporters: [ 'text', 'cobertura' ],
} as const satisfies Config;