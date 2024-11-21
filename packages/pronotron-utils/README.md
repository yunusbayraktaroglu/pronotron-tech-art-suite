# @pronotron/utils

Helper packages used by other @pronotron packages.

- **Clock**: Tracks two types of time—continuous and pausable at the same time. Pausable time stops ticking when the screen is inactive.
- **NativeControlTable**: Uses [TypedArrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#typedarray_objects) and a given Enum structure to store grouped data in direct-access memory. This enables blazing-fast, secure iterations and modifications.
- **AnimationController**: Built on **NativeControlTable** and **Clock**. It provides, per frame, three types of timeline data normalized between 0 and 1, sufficient to create any kind of animation on the client side.