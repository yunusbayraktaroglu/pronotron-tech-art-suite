# @pronotron/utils

[![NPM Package][npm]][npm-url]
[![Build Size][build-size]][build-size-url]

A set of helper modules used by other @pronotron packages, which can also be used individually.

- `Animator`: Built on `NativeControlTable` and `Clock`, provides a lightweight yet powerful system for managing large-scale animations with high efficiency.
- `NativeControlTable`: Utilizes [TypedArrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#typedarray_objects) and a given Enum structure to store grouped data in direct-access memory, enabling blazing-fast, secure iterations and modifications.
- `Clock`: Simultaneously tracks two types of time, continuous and pausable. Pausable time stops ticking when the screen is inactive.

[npm]: https://img.shields.io/npm/v/@pronotron/utils
[npm-url]: https://www.npmjs.com/package/@pronotron/utils
[build-size]: https://badgen.net/bundlephobia/minzip/@pronotron/utils
[build-size-url]: https://bundlephobia.com/result?p=@pronotron/utils