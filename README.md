# Pronotron Tech-Art Suite

A high-performance TypeScript suite designed to enhance interaction, UI, and UX without compromising web standards. Each package prioritizes minimal bundle size and blazing-fast performance, making it a reliable choice for developers focused on immersive, efficient and user-friendly web experiences.

<pre>npm i <a href="https://www.npmjs.com/package/@pronotron/io">@pronotron/io</a> <a href="https://www.npmjs.com/package/@pronotron/pointer">@pronotron/pointer</a> <a href="https://www.npmjs.com/package/@pronotron/utils">@pronotron/utils</a></pre>

### Packages

- `@pronotron/io`: Reliable viewport tracking without missed targets, unlike the default [IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API). Built on **NativeControlTable**, it can safely be used for parallax effects, lazy loading, or tracking when any part of an element enters or exits the screen. Suitable for implementing any custom scrolling application.
- `@pronotron/pointer`: Tracks mouse and touch pointers with custom states such as holding, tapping, idling, interacting, moving out, and moving in, providing enhanced interaction control.
- `@pronotron/utils`: A set of helper modules used by other @pronotron packages, which can also be used individually.
	- **Animator**: Built on **NativeControlTable** and **Clock**, it provides per-frame normalized timeline data (ranging from 0 to 1), enabling developers to create any kind of animation.
	- **NativeControlTable**: Utilizes [TypedArrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#typedarray_objects) and a given Enum structure to store grouped data in direct-access memory, enabling blazing-fast, secure iterations and modifications.
	- **Clock**: Simultaneously tracks two types of time—continuous and pausable. Pausable time stops ticking when the screen is inactive.

### Apps

- `demos`: Demonstrations using the packages, including stress tests.
- `docs`: Documentation on how to use the packages.

### How to contribute?

The packages are loosely coupled, allowing developers to decide how to integrate and leverage their features. The library emphasizes minimal bundle size over extendability, employing aggressive mangling for optimization. From a tech-art perspective, devices vary greatly, so a best-performance approach is essential for seamless integration.

<div align="right">
	<sub>Created by <a href="https://www.linkedin.com/in/yunusbayraktaroglu/">Yunus Bayraktaroglu</a> with ❤️</sub>
</div>