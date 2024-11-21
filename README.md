# Pronotron Tech-Art Suite

A high-performance TypeScript-based library suite designed to enhance interaction, UI, and UX without compromising web standards. Each package prioritizes minimal bundle sizes and blazing-fast performance, making it a reliable choice for developers focused on immersive, efficient and user-friendly web experiences.

### Packages

- `@pronotron/io`: Reliable viewport tracking without missed targets, unlike the default [IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API). Built on @native-control-table, it can safely be used for parallax effects, lazy loading, or tracking when any part of an element enters or exits the screen. Suitable for implementing any custom scrolling application.
- `@pronotron/pointer`: Tracks mouse and touch pointers with custom states such as holding, tapping, idling, interacting, moving out, and moving in, providing enhanced interaction control.
- `@pronotron/utils`: A set of helper modules used by other @pronotron packages, which can also be used individually.
	- @native-control-table: Utilizes [TypedArrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#typedarray_objects) and a given Enum structure to store grouped data in direct-access memory, enabling blazing-fast, secure iterations and modifications.
	- @clock: Simultaneously tracks two types of time—continuous and pausable. Pausable time stops ticking when the screen is inactive.
	- @animation-controller: Built on @native-control-table and @clock, it provides per-frame normalized timeline data (ranging from 0 to 1), enabling developers to create any kind of animation.

### Apps

- `demos`: Demonstrations using the packages, including stress tests.
- `docs`: Documentation on how to use the packages.

### How to contribute?

The packages are loosely coupled, allowing developers to decide how to integrate and leverage their features. The library emphasizes minimal bundle size over extendability, employing aggressive mangling for optimization. From a tech-art perspective, devices vary greatly, so a best-performance approach is essential for seamless integration.

### TODOS
- IO: Add horizontal check

### Useful commands

- `yarn build` - Build all packages and the docs site
- `yarn dev` - Develop all packages and the docs site
- `yarn lint` - Lint all packages
- `yarn changeset` - Generate a changeset
- `yarn clean` - Clean up all `node_modules` and `dist` folders (runs each package's clean script)

## Versioning and Publishing packages

Package publishing has been configured using [Changesets](https://github.com/changesets/changesets). Please review their [documentation](https://github.com/changesets/changesets#documentation) to familiarize yourself with the workflow.

This example comes with automated npm releases setup in a [GitHub Action](https://github.com/changesets/action). To get this working, you will need to create an `NPM_TOKEN` and `GITHUB_TOKEN` in your repository settings. You should also install the [Changesets bot](https://github.com/apps/changeset-bot) on your GitHub repository as well.

For more information about this automation, refer to the official [changesets documentation](https://github.com/changesets/changesets/blob/main/docs/automating-changesets.md)

### npm

If you want to publish package to the public npm registry and make them publicly available, this is already setup.

To publish packages to a private npm organization scope, **remove** the following from each of the `package.json`'s

```diff
- "publishConfig": {
-  "access": "public"
- },
```

### GitHub Package Registry

See [Working with the npm registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#publishing-a-package-using-publishconfig-in-the-packagejson-file)
