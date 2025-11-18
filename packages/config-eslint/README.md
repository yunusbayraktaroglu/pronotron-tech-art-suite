# `@pronotron/config-eslint`

Collection of internal eslint configurations.

#### TODO

- Remove unnecessary tidi workflow from the TypeScript ESLint configuration.The current config expects the tidi package to be installed, but we use tsup via our custom config-tsup and config-jest packages, so the tidi workflow is redundant.