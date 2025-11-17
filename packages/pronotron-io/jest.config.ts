import { createDefaultPreset } from "ts-jest";
import { baseConfig } from "@pronotron/config-jest";

/**
 * @see https://kulshekhar.github.io/ts-jest/docs/getting-started/presets#createdefaultpresetoptions
 */
const defaultPreset = createDefaultPreset();

export default { ...defaultPreset, ...baseConfig };