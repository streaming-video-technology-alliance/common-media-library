# Bitrate selector implementation

Implementation plan for the [bitrate selector RFC](https://github.com/streaming-video-technology-alliance/common-media-library/pull/526). The RFC defines the API. This file records the steps and the decisions that the RFC leaves to the implementation.

## Steps

1. Scaffold `libs/abr` after `libs/error-codes`: `package.json` at version 0.0.1, `tsconfig.json`, `tsdoc.json`, `config/api-extractor.json`, `LICENSE`, and `NOTICE.md`.
2. Add the types, one per file: `BitrateSelector`, `BitrateSelectorInput`, `BitrateDecision`, `SegmentSample`, and `ThroughputSelectorOptions`.
3. Add the constants, one per file: `DEFAULT_SAFETY_FACTOR` and `DEFAULT_UPGRADE_FACTOR`.
4. Add the internal helpers `findRung` and `validateLadder`. Both implement rules from the contract of the type, so a second selector can import them. The index does not export them.
5. Add `ThroughputSelector` with the safe pick, the hysteresis, and the starvation guard, in that order.
6. Add the tests. The `ThroughputSelector` tests check every row of the RFC tables and every row of the validation tables. The helper tests import from the source files.
7. Add the `README.md` with the RFC examples, the player rules, and the option tables. Add the `CHANGELOG.md` with an `Unreleased` section.
8. Register the package: the root build script, `tsconfig.typedoc.json`, the root `README.md`, and `package-lock.json`. Leave `scripts/projects.ts` to the release-prep PR, as the RFC states.
9. Mark every export `@beta`.

## Decisions

| Question | Decision |
|---|---|
| Equal adjacent rungs | Accepted. Two rungs with the same bitrate and different resolutions are common. `findRung` returns the highest position. |
| `segmentDuration` that is not a positive finite number | The guard does not run. The value counts as not passed. |
| `sample` with a bitrate that is not a finite number | Ignored. The current rung does not change. A value without information must not clear the state. |
| `sample` with `aborted: true` | Ignored for the current rung, as the RFC states. |
| Current rung before the first sample | Unknown. The hysteresis does not run, and an unknown throughput gives rung 0. |
| Internal helpers | Separate files without an export from the index, so the second selector can reuse them without a public API. |

## Bundle size

The sizes of `dist/index.js` after the first build. The RFC asked the implementation PR to report the minified size.

| Output | Bytes |
|---|---|
| Bundle with comments | 5549 |
| Bundle with comments, gzip | 1814 |
| Minified with esbuild | 1479 |
| Minified with esbuild, gzip | 735 |

A player that imports only the types adds no runtime code.

## Validation

- `npm test` at the root runs lint, build, typecheck, and the tests of every package.
- `npm run build -w docs` checks the TSDoc and the `{@includeCode}` reference.
- `bash plans/writing-style-compliance/check.sh origin/main <file>` checks the prose of the README and the changelog.
