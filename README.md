# Pronotron Tech-Art Suite

A high-performance TypeScript suite designed to enhance interaction, UI, and UX without compromising web standards. Each package prioritizes minimal bundle size and blazing-fast performance, making it a reliable choice for developers focused on immersive, efficient and user-friendly web experiences.

<pre>npm i <a href="https://www.npmjs.com/package/@pronotron/io" target="_blank">@pronotron/io</a> <a href="https://www.npmjs.com/package/@pronotron/pointer" target="_blank">@pronotron/pointer</a> <a href="https://www.npmjs.com/package/@pronotron/utils" target="_blank">@pronotron/utils</a></pre>

## Packages

> ### [@pronotron/io](packages/pronotron-io)
>
> [![NPM Package][npm-io]][npm-url-io] [![Build Size][build-size-io]][build-size-url-io] [![Codecov][codecov-io]][codecov-url-io]
>
> Reliable viewport tracking without missed targets, unlike the default [IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API). Built on **NativeControlTable**, it can safely be used for parallax effects, lazy loading, or tracking when any part of an element enters or exits the screen. Suitable for implementing any custom scrolling application.

> ### [@pronotron/pointer](packages/pronotron-pointer)
>
> [![NPM Package][npm-pointer]][npm-url-pointer] [![Build Size][build-size-pointer]][build-size-url-pointer] [![Codecov][codecov-pointer]][codecov-url-pointer]
>
> Tracks mouse and touch pointers with custom states such as holding, tapping, idling, interacting, dragging, moving out, and moving in, providing enhanced interaction control.

> ### [@pronotron/utils](packages/pronotron-utils)
>
> [![NPM Package][npm-utils]][npm-url-utils] [![Build Size][build-size-utils]][build-size-url-utils] [![Codecov][codecov-utils]][codecov-url-utils]
>
> A set of helper modules used by other **@pronotron** packages, which can also be used individually:
> - **Animator**: Built on **NativeControlTable** and **Clock**, it provides per-frame normalized timeline data (ranging from 0 to 1), enabling developers to create any kind of animation.
> - **NativeControlTable**: Utilizes [TypedArrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#typedarray_objects) and a given Enum structure to store grouped data in direct-access memory, enabling blazing-fast, secure iterations and modifications.
> - **Clock**: Simultaneously tracks two types of time, continuous and pausable. Pausable time stops ticking when the screen is inactive.

<br><br>

live: [https://yunusbayraktaroglu.github.io/pronotron-tech-art-suite/](https://yunusbayraktaroglu.github.io/pronotron-tech-art-suite/)

https://github.com/user-attachments/assets/218bc7aa-2e91-49aa-a42b-8e7af9820e41

<br>

### Apps

- `demos`: Demonstrations using the packages, including stress tests.
- `docs`: Documentation on how to use the packages.

### Project philosophy

The packages are loosely coupled, allowing developers to decide how to integrate and leverage their features. The library emphasizes minimal bundle size over extendability, employing aggressive mangling for optimization. From a tech-art perspective, devices vary greatly, so a best-performance approach is essential for seamless integration.

See [CONTRIBUTING ↗](.github/CONTRIBUTING.md)

<div align="right">
	<sub>Created by <a href="https://www.linkedin.com/in/yunusbayraktaroglu/">Yunus Bayraktaroglu</a> with ❤️</sub>
</div>



[npm-io]: https://img.shields.io/npm/v/@pronotron/io
[npm-url-io]: https://www.npmjs.com/package/@pronotron/io
[build-size-io]: https://badgen.net/bundlephobia/minzip/@pronotron/io
[build-size-url-io]: https://bundlephobia.com/result?p=@pronotron/io
[codecov-io]: https://codecov.io/gh/yunusbayraktaroglu/pronotron-tech-art-suite/branch/main/graph/badge.svg?flag=pronotron-io&precision=1
[codecov-url-io]: https://app.codecov.io/gh/yunusbayraktaroglu/pronotron-tech-art-suite?flags%5B0%5D=pronotron-io

[npm-pointer]: https://img.shields.io/npm/v/@pronotron/pointer
[npm-url-pointer]: https://www.npmjs.com/package/@pronotron/pointer
[build-size-pointer]: https://badgen.net/bundlephobia/minzip/@pronotron/pointer
[build-size-url-pointer]: https://bundlephobia.com/result?p=@pronotron/pointer
[codecov-pointer]: https://codecov.io/gh/yunusbayraktaroglu/pronotron-tech-art-suite/branch/main/graph/badge.svg?flag=pronotron-pointer&precision=1
[codecov-url-pointer]: https://app.codecov.io/gh/yunusbayraktaroglu/pronotron-tech-art-suite?flags%5B0%5D=pronotron-pointer

[npm-utils]: https://img.shields.io/npm/v/@pronotron/utils
[npm-url-utils]: https://www.npmjs.com/package/@pronotron/utils
[build-size-utils]: https://badgen.net/bundlephobia/minzip/@pronotron/utils
[build-size-url-utils]: https://bundlephobia.com/result?p=@pronotron/utils
[codecov-utils]: https://codecov.io/gh/yunusbayraktaroglu/pronotron-tech-art-suite/branch/main/graph/badge.svg?flag=pronotron-utils&precision=1
[codecov-url-utils]: https://app.codecov.io/gh/yunusbayraktaroglu/pronotron-tech-art-suite?flags%5B0%5D=pronotron-utils