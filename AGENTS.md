# Common Media Library AI Agent Instructions

## Project Mission

Common Media Library (CML) is a collection of TypeScript libraries implementing media specifications (CMCD, CMSD, ID3, ISO BMFF, WebVTT, DASH, DRM, C2PA, and more) for use by web video players such as hls.js, dash.js, and shaka-player.

The strategic goal is **widespread adoption**. Evaluate every decision against these priorities, in order:

1. **Performance** — Avoid unnecessary runtime overhead, memory leaks, and GC thrashing. This code runs on every video playback.
2. **Tree-shakeability** — Adopters' final bundle size is what matters. Users must only pay for what they import.
3. **Developer experience** — Correct usage should be obvious; incorrect usage should fail at compile time.
4. **Documentation quality** — Adopters evaluate libraries by their docs before reading source code.
5. **Minimal barriers to entry** — Zero config, no peer dependencies, copy-pasteable examples.
6. **Spec compliance** — Implementations must be accurate to the relevant specification. Do not invent extensions.

## Repo Setup

- Development requires Node >= 24 (`npm install` fails on older versions; repo scripts are TypeScript executed directly by `node`).
- Fresh clones and git worktrees must run `git submodule update --init`. The `structured-field-tests` submodule is required by the structured-field-values tests.

## Build Commands

- `npm run build -w libs/<package>`: Build a package (root `npm run build` builds every package in dependency order)
- `npm run typecheck`: Run the typechecker
- `npm test -w libs/<package>`: Run the tests for a package (build first: tests import the bundled `dist/` output of the package and its workspace dependencies)
- `npm test`: Full validation at the root (lint, build all, typecheck, then every package's tests); this is what PR CI runs
- `npm run format`: Run the linter with auto-fix
- `npm run ver <package> <version>`: Bump a single package version during release prep (`<package>` is the folder name without the `libs/` prefix); updates `package.json` and inserts the new version section and compare links in `CHANGELOG.md`
- `npm run prepare-release`: Prepare a release; detects packages whose `package.json` version differs from the published npm version and cascades patch bumps (with changelog entries) to the packages that depend on them

## Developer Experience

APIs are the product. Design them so adopters fall into the pit of success:

- Use union and literal types so autocomplete guides users to valid values.
- Actionable error messages: include parameter name, expected value(s), and received value.
- Minimal API surface — do not add a public export unless it serves a clear use case.
- Follow established naming and structural patterns across packages (e.g., `encode`/`decode`, options objects, const enum pattern).

## Workflow

- Typecheck the entire project after code changes
- Prefer builds and tests at the workspace level
- Create tests for new public API members
- Add change notes under the `## [Unreleased]` heading in the affected package's `CHANGELOG.md` for every change; do not bump `package.json` versions in change PRs
- Bump versions only in dedicated release-prep PRs: `npm run ver` bumps each package being released, then `npm run prepare-release` cascades patch bumps to the packages that depend on them
- Avoid breaking changes; when unavoidable, provide migration guidance in changelog and docs
- Save all plans in the `plans/` directory in a folder with the name of the feature or issue being implemented. Individual parts of the plan like steps, architecture, tech stack, etc. should be saved in separate files within the folder.

## Documentation

- Every package needs a `README.md` with description, install instructions, and a quick-start example.
- Use `{@includeCode ../test/<file>.test.ts#example}` in TSDoc to reference test examples.
- Mark example regions in tests with `// #region example` and `// #endregion example`.
- All code examples must be complete and runnable — no pseudocode, no elided imports.
- Public API changes are tracked in `libs/<package>/config/cml-<package>.api.md`, regenerated when the package builds; review its diff to confirm every API change is intentional.

## Git Commit Guidelines

- **Always use `git commit -s`** to add the DCO sign-off. Every commit must have this.
- Follow conventional commit format (`feat:`, `fix:`, `refactor:`, `chore:`, etc.).
- **Never commit directly to `main`**, even for docs or specs. All work goes on a feature branch; integration is through PRs. For issue-driven work, use `issue/<number>-<short-kebab-slug>`.
- For AI-assisted commits, include a `Co-Authored-By: <agent-name> <model> <noreply@anthropic.com>` trailer in the commit body.
