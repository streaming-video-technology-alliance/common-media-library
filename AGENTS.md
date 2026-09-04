# Common Media Library AI Agent Instructions

## Project Mission

Common Media Library (CML) is a collection of TypeScript libraries for web video players such as hls.js, dash.js, and shaka-player. The libraries implement media specifications: CMCD, CMSD, ID3, ISO BMFF, WebVTT, DASH, DRM, C2PA, and more.

The strategic goal is **widespread adoption**. Evaluate every decision against these priorities, in order:

1. **Performance**: Avoid unnecessary runtime overhead, memory leaks, and excessive GC. This code runs on every video playback.
2. **Tree-shakeability**: Adopters' final bundle size is what matters. Adopters must not receive code they do not import.
3. **Developer experience**: Correct usage should be obvious. Incorrect usage should fail at compile time.
4. **Documentation quality**: Adopters evaluate libraries by their docs before reading source code.
5. **Minimal barriers to entry**: Zero config, no peer dependencies, copy-pasteable examples.
6. **Spec compliance**: Implementations must be accurate to the relevant specification. Do not invent extensions.

## Repo Setup

- Development requires Node >= 24. `npm install` fails on older versions. Repo scripts are TypeScript files that `node` runs directly.
- Fresh clones and git worktrees must run `git submodule update --init`. The structured-field-values tests need the `structured-field-tests` submodule.

## Build Commands

- `npm run build -w libs/<package>`: Build a package. The root `npm run build` builds every package in dependency order.
- `npm run typecheck`: Run the typechecker
- `npm test -w libs/<package>`: Run the tests for a package. Build first: the tests import the bundled `dist/` output of the package and its workspace dependencies.
- `npm test`: Full validation at the root. It runs lint, build all, typecheck, then every package's tests. The PR checks run this command.
- `npm run format`: Run the linter with auto-fix
- `npm run ver <package> <version>`: Bump one package version during release prep. `<package>` is the folder name without the `libs/` prefix. The command updates `package.json` and inserts the new version section and compare links in `CHANGELOG.md`.
- `npm run prepare-release`: Prepare a release. The command detects packages whose `package.json` version differs from the published npm version. It then cascades patch bumps, with changelog entries, to the packages that depend on them.

## Developer Experience

APIs are the product. Design them so that the easy way is the correct way:

- Use union and literal types, so autocomplete guides adopters to valid values.
- Actionable error messages: include parameter name, expected value(s), and received value.
- Minimal API surface: do not add a public export unless it serves a clear use case.
- Follow the naming and structural patterns of the other packages: `encode`/`decode`, options objects, and the const enum pattern.

## Workflow

- Typecheck the entire project after code changes
- Prefer builds and tests at the workspace level
- Create tests for new public API members
- For every change, add a note under the `## [Unreleased]` heading in the affected package's `CHANGELOG.md`.
- Bump versions only in dedicated release-prep PRs, with `npm run ver` and then `npm run prepare-release` (see Build Commands).
- Avoid breaking changes. If one is unavoidable, provide migration guidance in the changelog and the docs.
- Save plans and design-session artifacts in `plans/<feature-name>/`, where the folder name is the feature or issue. Save each part of the plan, such as steps or architecture, in its own file: `plans/<feature-name>/steps.md`. Do not use `docs/` for planning documents.
- Proposals that need community agreement are RFCs, not plans: public API changes, new packages, and significant architecture changes. Save an RFC as `rfc/<feature-name>.md` and follow the process in `rfc/README.md`.

## Documentation

- Every package needs a `README.md` with description, install instructions, and a quick-start example.
- Use `{@includeCode ../test/<file>.test.ts#example}` in TSDoc to reference test examples.
- Mark example regions in tests with `// #region example` and `// #endregion example`.
- All code examples must be complete and runnable: no pseudocode and no missing imports.
- The package build regenerates the public API report `libs/<package>/config/cml-<package>.api.md`. Review its diff to confirm that every API change is intentional.

## Writing Style

CML collaborators and adopters live in many countries. Many of them do not read English as a first language. These rules apply to all prose you write: READMEs, TSDoc, changelogs, RFCs, plans, PR descriptions, issue and review comments, and commit messages. They do not apply to code or identifiers.

- One idea per sentence. Keep sentences under 20 words and split any sentence over 25. No semicolons (;) and no em dashes (—).
- Active voice and simple tenses (present, past, future). Write instructions in the imperative with the condition first: "If the build fails, read the log."
- One name per thing for the whole document, never a synonym for variety.
- No idioms, metaphors, or figures of speech. If a phrase cannot be translated word for word, replace it.
- Prefer one verb to a phrasal verb ("configure", not "set up") and literal verbs for facts ("the table shows", not "the table carries").
- Do not use "e.g.", "i.e.", or "vs".
- Give every pronoun a visible noun in the same or previous sentence: "this check", not "this".
- At most three nouns in a row. Break longer strings with prepositions.
- Keep the author's hedges. "May have failed" does not become "failed". Never add a fact the source did not state.
- Write for the reader's decision. An RFC reader needs what the API is, one example, the contract, the costs, the alternatives, and the open questions. Methodology, history, and engine internals go to the design record in `plans/`, with a link.
- State each finding once, in one place, and reference it from elsewhere. Numbers go in tables or lists, at most one per sentence of prose.
- After a clarity pass, do a second pass that removes duplication. Splitting sentences adds words, so the document must get shorter, not longer.

## Git Commit Guidelines

- **Always use `git commit -s`** to add the DCO sign-off. Every commit must have this sign-off.
- Follow the Conventional Commits format: `feat:`, `fix:`, `refactor:`, `chore:`, and the other types.
- **Never commit directly to `main`**, even for docs or specs. All work goes on a feature branch and merges through a PR. For issue-driven work, name the branch `issue/<number>-<short-kebab-slug>`.
- For AI-assisted commits, include a `Co-Authored-By: <agent-name> <model> <noreply@anthropic.com>` trailer in the commit body.
