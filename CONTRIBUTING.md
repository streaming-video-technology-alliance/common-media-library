# Common Media Library Contributing Guide

Thank you for contributing to the Common Media Library.

Read our [Code of Conduct](./CODE_OF_CONDUCT.md) to keep our community approachable and respectful.

This guide gives an overview of the contribution workflow: opening an issue, creating a pull request (PR), review, and merge.

## Getting started

### Issues

#### Create a new issue

If you find a problem, first [search the existing issues](https://github.com/streaming-video-technology-alliance/common-media-library/issues). If no related issue exists, open a new issue with the relevant [issue form](https://github.com/streaming-video-technology-alliance/common-media-library/issues/new/choose).

#### Solve an issue

Look through our [existing issues](https://github.com/streaming-video-technology-alliance/common-media-library/issues) for one that interests you. Filter the search with `labels`. If you find an issue to work on, open a PR with a fix.

### Make Changes

1. Fork the repository.
[Fork the repository](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo#fork-an-example-repository) so you can make changes without affecting the original project until you are ready to merge them.

1. Install or update **Node.js**.

1. Create a working branch and make your changes.

1. Update the [CHANGELOG](./CHANGELOG.md). Describe your change and reference the issue.

1. If you are not in the [Contributors List](./CONTRIBUTORS.md), add yourself.

1. Add tests for your changes.

1. Add documentation for your changes.

### Commit your update

> **Warning**
> This library requires a Developer Certificate of Origin (DCO) sign-off on every commit. See https://github.com/apps/dco for more information.

1. Run `npm run format` to format the code before committing.

1. Run `npm run test` and make sure all tests pass.

1. Write a commit message that describes the change, in the [Conventional Commits](https://www.conventionalcommits.org/) format.

### Pull Request

When your changes are finished, create a PR.
