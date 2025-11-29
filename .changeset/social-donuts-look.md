---
"@pronotron/pointer": patch
"@pronotron/utils": patch
"@pronotron/io": patch
---

@pronotron/io
- Improved test coverage.
- Added `getNodePosition()`, which returns the position enum of the `IONode`.
- Documented `onScrollProgress`.
- Excluded `_eventNames` and `_scrollDirectionNames` from the `.d.ts` output.

@pronotron/pointer
- Exposed the pointer target publicly.
- Exported the `BaseSettings` type.

@pronotron/utils
- Improved animation types.
- `Clock` now expects a `now()` function via dependency injection.
- Improved test coverage.