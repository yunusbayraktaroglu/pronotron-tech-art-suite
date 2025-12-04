# Contributing to `pronotron-tech-art-suite`

Thanks for wanting to contribute! It's more than welcome.

As the creators and maintainers of this project, we want to ensure that `pronotron-tech-art-suite` lives and continues to grow and evolve. We would like to encourage everyone to help and support this library by contributing

## Project philosophy

The packages are loosely coupled, allowing developers to decide how to integrate and leverage their features. The library emphasizes minimal bundle size over extendability, employing aggressive mangling for optimization. From a tech-art perspective, devices vary greatly, so a best-performance approach is essential for seamless integration.

We keep contributions focused, performance-oriented, and careful about bundle size. When proposing changes, please keep the project's goals in mind (small, targeted, well-tested improvements are preferred).


## Ways to contribute

1. **Replying and handling open issues or discussions.**

   We get some issues and discussions, and some of them may lack necessary information. You can help out by guiding people through the process of filling out the issue template, asking for clarifying information, or pointing them to existing issues that match their description of the problem.

2. **Reviewing pull requests.**

   Pull requests (PRs) are essential for introducing new features, fixing bugs, and improving the overall quality of the codebase. As a reviewer, your role is crucial in ensuring that each PR meets the project's standards and goals. Here are some key aspects to consider when reviewing pull requests:

   - **Code Quality**: Examine the changes for readability, maintainability, and adherence to coding standards. Look for any potential code smells, redundant code, or opportunities for optimization.

   - **Functionality**: Test the changes locally if possible to verify that they work as intended. Check if the new feature functions correctly and if the bug fixes address the reported issues.

   - **Compatibility**: Ensure that the changes don't introduce breaking changes or compatibility issues with existing functionality. Consider how the changes may impact other parts of the codebase and any dependent projects.

   - **Documentation**: Confirm that the PR includes any necessary updates to documentation, including code comments, README files, changesets, or API references.

   - **Testing**: Assess whether the PR includes sufficient unit tests to cover the modified code. If necessary, suggest additional test cases or improvements to the testing strategy.

   - **Feedback**: Provide constructive feedback to the contributor, highlighting areas for improvement and praising positive aspects of the contribution. Encourage collaboration and discussion to address any concerns or questions.

   Your thorough review helps maintain the quality and stability of the project. Remember to be respectful and supportive in your feedback, fostering a positive and inclusive community for contributors.

3. **Help people write unit-tests.**

   Some pull requests sent to the main repository may lack a proper test plan. These help reviewers understand how the change was tested, and can speed up the time it takes for a contribution to be accepted.

4. **Improving the documentation.**

   Reviewing documentation updates can be as simple as checking for spelling and grammar. If you encounter situations that can be explained better in the docs, click Edit at the top of most docs pages to get started with your own contribution.

5. **Contribute the to code.**

   Code-level contributions to `pronotron-tech-art-suite` like creating or fixing a hook generally come in the form of pull requests. These are done by forking the repo and making changes locally explained below.

## Code contributions

Here is a quick guide to doing code contributions to the library.

1. Make sure to have the right dependencies up-to-date:

   - `"node": ">=18"`
   - `"npm": "^10"`

2. Fork and clone the repo to your local machine:

   ```shellscript
   git clone https://github.com/yunusbayraktaroglu/pronotron-tech-art-suite
   ```

3. Create a new branch from `main` with a meaningful name for a new feature or an issue you want to work on:

   ```shellscript
   git checkout -b your-meaningful-branch-name
   ```

4. Install packages by running:

   ```shellscript
   npm install
   ```

5. Ensure your code lints without errors and the test suite still passes.

   ```shellscript
   npm build && npm lint && npm test
   ```

7. Try to write some unit tests to cover as much of your code as possible.

8. Push your branch: `git push -u origin your-meaningful-branch-name`

9. Submit a pull request to the upstream `pronotron-tech-art-suite` repository.

10. Choose a descriptive title and describe your changes briefly.

## Coding style

Please follow the coding style of the project. `pronotron-tech-art-suite` uses eslint and prettier. If possible, enable their respective plugins in your editor to get real-time feedback. The linting can be run manually with the following command: `npm lint` and `npm prettier`.