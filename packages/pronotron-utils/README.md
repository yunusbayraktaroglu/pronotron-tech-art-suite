# @pronotron/utils

A set of helper modules used by other @pronotron packages, which can also be used individually.

- **NativeControlTable**: Utilizes [TypedArrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#typedarray_objects) and a given Enum structure to store grouped data in direct-access memory, enabling blazing-fast, secure iterations and modifications.
- **Clock**: Simultaneously tracks two types of time—continuous and pausable. Pausable time stops ticking when the screen is inactive.
- **AnimationController**: Built on **NativeControlTable** and @clock, it provides per-frame normalized timeline data (ranging from 0 to 1), enabling developers to create any kind of animation.