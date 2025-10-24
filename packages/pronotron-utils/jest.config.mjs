import { createDefaultPreset } from "ts-jest";

const defaultPreset = createDefaultPreset();

export default {
	...defaultPreset,
	testMatch: [ "**/tests/*.test.ts" ],
	testEnvironment: "node",
	collectCoverage: true,
	coverageReporters: [ "json" ],
};