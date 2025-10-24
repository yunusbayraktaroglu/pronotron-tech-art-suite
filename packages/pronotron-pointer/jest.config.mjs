import { createDefaultPreset } from "ts-jest";

const defaultPreset = createDefaultPreset();

export default {
	...defaultPreset,
	testMatch: [ "**/tests/*.test.ts" ],
	testEnvironment: "jsdom",
	collectCoverage: true,
	coverageReporters: [ "json" ],
};