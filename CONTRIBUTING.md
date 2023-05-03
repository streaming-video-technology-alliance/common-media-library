# Welcome to the Common Media Library contributing guide <!-- omit in toc -->

Thank you for investing your time in contributing to the Common Media Library. 

<!-- Read our [Code of Conduct](./CODE_OF_CONDUCT.md) to keep our community approachable and respectable. -->

In this guide you will get an overview of the contribution workflow from opening an issue, creating a PR, reviewing, and merging the PR.

## Getting started

### Issues

#### Create a new issue

If you spot a problem with the docs, [search if an issue already exists](https://github.com/streaming-video-technology-alliance/common-media-library/issues). If a related issue doesn't exist, you can open a new issue using a relevant [issue form](https://github.com/streaming-video-technology-alliance/common-media-library/issues/new/choose).

#### Solve an issue

Scan through our [existing issues](https://github.com/streaming-video-technology-alliance/common-media-library/issues) to find one that interests you. You can narrow down the search using `labels` as filters.  If you find an issue to work on, you are welcome to open a PR with a fix.

### Make Changes

1. Fork the repository.
[Fork the repo](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo#fork-an-example-repository) so that you can make your changes without affecting the original project until you're ready to merge them.

2. Install or update to **Node.js**.

3. Create a working branch and start with your changes!

4. Update the CHANGELOG. Make sure to update the change log with the change you've made, along with a referene to the issue.  See the [CHANGELOG](./CHANGELOG.md) for more information.

5. Add tests for your changes.

6. Add documentation for your changes.

### Commit your update

1. Run `npm run format` to format the code before committing.

1. Make sure all tests pass by running `npm run test`.

1. Mare sure to include a committ message that describes the change, following the [Conventional Commits](https://www.conventionalcommits.org/) format.

### Pull Request

When you're finished with the changes, create a pull request.
