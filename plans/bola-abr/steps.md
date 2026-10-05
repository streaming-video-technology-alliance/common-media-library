# BOLA Selector Implementation Plan

**Goal:** Add `BolaSelector` to a new package, `@svta/cml-abr`, as the [RFC](../../rfc/bola-abr-selector.md) proposes. The selector picks a rung from a bitrate ladder with the buffer level. It handles a changing ladder and a changing buffer target.

**Architecture:** See [design.md](design.md). Internal pure functions carry the math. `BolaSelector` holds the state and the events. The caller supplies the throughput estimate and the clock.

**Tech Stack:** TypeScript (`isolatedDeclarations`, `verbatimModuleSyntax`), `node:test` and `node:assert`, tsdown build, api-extractor for the public API report.

## Preconditions

- The RFC status is `accepted`. The maintainers confirmed the package placement and the v1 scope.
- If the maintainers choose `@svta/cml-throughput`, apply the same tasks inside `libs/throughput`. Task 1 then shrinks to the changes of the existing package.
- Work on the branch `issue/358-bola-abr-selector`, created from `main`.

## Global Constraints

- **Node and setup.** Development requires Node 24 or later. Run `npm install` and `git submodule update --init` before anything else.
- **Build before test.** Tests import the bundled output. Run `npm run build -w libs/abr` before `npm test -w libs/abr`.
- **Test policy.** Assert against exported constants, not against copied literals. Build throughput edges from `BOLA_DEFAULT_THROUGHPUT_SAFETY_FACTOR`. Build buffer points from the midpoint of each oracle interval. Public tests import from `@svta/cml-abr`. Internal tests import from `../src/<file>.ts`.
- **Code rules.** Follow `.claude/rules/code-quality.md`. Use `type`, not `interface`. Do not use `enum`. Give every export an explicit type, TSDoc, and `@public`. Name each file after its primary export. Add the exports to `src/index.ts` in alphabetical order.
- **No hidden clock.** No source file calls `Date.now` or `performance.now`.
- **Versions and registration.** Do not bump a version. Do not edit `scripts/projects.ts`. The first release-prep pull request adds the package, as it did for `libs/error-codes`.
- **Prose.** Write TSDoc, README, and changelog text with the rules of the Writing Style section in `AGENTS.md`.
- **Commits.** Use `git commit -s`, Conventional Commits, and the `Co-Authored-By` trailer of `AGENTS.md`.

---

### Task 1: Scaffold the package

**Files:**
- Create: `libs/abr/package.json`, `README.md`, `CHANGELOG.md`, `LICENSE`, `NOTICE.md`, `tsconfig.json`, `tsdoc.json`, `config/api-extractor.json`, `src/index.ts`
- Modify: root `package.json` (the `build` script), root `README.md` (the library list), `tsconfig.typedoc.json` (`paths`), `package-lock.json`

**Interfaces:**
- Consumes: the layout of `libs/error-codes`.
- Produces: an empty package that builds and passes the root checks.

- [ ] **Step 1: Copy the layout.** Copy the files of `libs/error-codes` that carry no source. Replace the name, the description, the keywords, and the homepage path. Set the version to `0.0.1`. Keep `@svta/cml-utils` as the only peer dependency.
- [ ] **Step 2: Write the changelog.** Start `CHANGELOG.md` with `## [Unreleased]` and an `### Added` entry that names the package.
- [ ] **Step 3: Write `src/index.ts`.** Add the `@packageDocumentation` comment and an empty export so that the build passes.
- [ ] **Step 4: Register the package.** Append `-w=libs/abr` to the root `build` script after the packages it depends on. Add the library to the root README list. Add the `paths` entry to `tsconfig.typedoc.json`. Run `npm install` to update `package-lock.json`.
- [ ] **Step 5: Verify.** Run `npm run build -w libs/abr` and `npm run typecheck`. Both must pass.
- [ ] **Step 6: Commit.** `feat(abr): scaffold the @svta/cml-abr package`.

### Task 2: Add the BOLA parameter and rung-selection core

**Files:**
- Create: `libs/abr/src/BolaState.ts`, `BOLA_DEFAULT_BUFFER_TARGET_S.ts`, `BOLA_DEFAULT_THROUGHPUT_SAFETY_FACTOR.ts`, `MINIMUM_BUFFER_S.ts`, `MINIMUM_BUFFER_PER_RUNG_S.ts`, `PLACEHOLDER_DECAY.ts`, `createBolaParams.ts`, `validateLadder.ts`, `selectRungByBuffer.ts`, `selectRungByThroughput.ts`
- Create: `libs/abr/test/helpers/bolaScoreOracle.ts` and one test file for each internal function
- Modify: `libs/abr/src/index.ts`

**Interfaces:**
- Produces: `createBolaParams(ladder, bufferTargetS)` returns the distinct rungs with their highest caller index, `B`, `V`, `gamma`, the thresholds, and the maximum buffers. `selectRungByBuffer(params, effectiveBufferS)` and `selectRungByThroughput(params, bitrateBps)` return a rung position. `validateLadder(ladder)` throws a `RangeError`.

- [ ] **Step 1: Write the oracle.** The oracle computes the score of each rung directly and returns the best rung, with ties to the higher rung. It shares no code with `createBolaParams`.
- [ ] **Step 2: Write failing tests.** Test the thresholds against the oracle with the fixtures L1 and L2 of the design record. Test the properties in the strategy table below.
- [ ] **Step 3: Implement the files.** Write each internal function in its own file. Put each named constant in its own file with TSDoc.
- [ ] **Step 4: Verify.** Run `npm run build -w libs/abr` and `npm test -w libs/abr`. Every test passes.
- [ ] **Step 5: Commit.** `feat(abr): add the BOLA parameter and rung-selection core`.

### Task 3: Add the BolaSelector state machine

**Files:**
- Create: `libs/abr/src/BolaSelector.ts`, `BolaSelectorOptions.ts`, `BolaSelectInput.ts`, `BolaDecision.ts`, `BolaSegmentLoadedEvent.ts`, `libs/abr/test/BolaSelector.test.ts`
- Modify: `libs/abr/src/index.ts`

**Interfaces:**
- Consumes: the Task 2 functions.
- Produces: the export surface of the RFC. In this task, a ladder change calls `reset`.

- [ ] **Step 1: Write failing tests.** Cover the startup and steady states, the oscillation guard, the delay, and each event. Use the reference scenarios of the design record.
- [ ] **Step 2: Implement the selector.** Use private fields with explicit types and a public constructor, as `EwmaEstimator` does. Keep the steps of `select` in small private methods.
- [ ] **Step 3: Add the example region.** Add a `// #region example` block to the test file. It holds the example of the RFC.
- [ ] **Step 4: Verify.** Run the build and the tests.
- [ ] **Step 5: Commit.** `feat(abr): add the BolaSelector state machine`.

### Task 4: Keep the state across ladder changes

**Files:**
- Create: `libs/abr/src/isSameLadder.ts`, `remapEffectiveBuffer.ts`, tests for both
- Modify: `libs/abr/src/BolaSelector.ts`, `libs/abr/test/BolaSelector.test.ts`

**Interfaces:**
- Produces: the ladder change policy of the RFC. A change of the ladder or the buffer target no longer resets the selector.

- [ ] **Step 1: Write failing tests.** Write one test for each row of the ladder change table in the RFC. Add a test for an in-place change of the caller array. Add a test that an invalid ladder leaves the state unchanged.
- [ ] **Step 2: Implement the comparison and the conversion.** Store the current rung as a bitrate. Map it to the highest new rung at or below it.
- [ ] **Step 3: Check the measured effect.** Add a test that a change of the buffer target on the same ladder changes no decision. Use the fixture L1 and many buffer levels.
- [ ] **Step 4: Verify.** Run the build and the tests.
- [ ] **Step 5: Commit.** `feat(abr): keep BolaSelector state across ladder changes`.

### Task 5: Add a seeded playback simulation

**Files:**
- Create: `libs/abr/test/simulation.test.ts`, `libs/abr/test/helpers/simulatePlayback.ts`

**Interfaces:**
- Consumes: the public selector.
- Produces: a deterministic simulation with a seeded random generator, segments of 4 s, a buffer model, and a local rate-based baseline.

- [ ] **Step 1: Write the helper.** Model a throughput trace as a random walk. Compute download times from the trace. Model the buffer with a cap.
- [ ] **Step 2: Assert invariants and structural findings.** Two runs with the same seed give equal results. Every index is in range. Every delay is 0 or more. Every metric is finite. The oscillation guard lowers the switch count. The placeholder is positive when the cap is below `B`.
- [ ] **Step 3: Verify.** Run the build and the tests. Record the metrics once for the pull request description. Do not assert exact numbers.
- [ ] **Step 4: Commit.** `test(abr): add a seeded playback simulation`.

### Task 6: Documentation and attribution

**Files:**
- Modify: `libs/abr/README.md`, `libs/abr/NOTICE.md`, root `NOTICE`, TSDoc of every export
- Review: `libs/abr/config/cml-abr.api.md`

- [ ] **Step 1: Write the README.** Add the description, the installation steps, and a complete example with its expected output.
- [ ] **Step 2: Add the TSDoc examples.** Add `@example {@includeCode ../test/BolaSelector.test.ts#example}` to `BolaSelector`. Cite the BOLA paper in the TSDoc.
- [ ] **Step 3: Add the attribution.** Add the dash.js BSD license text to `libs/abr/NOTICE.md`, as `libs/dash/NOTICE.md` does for its sources. Add a block to the root `NOTICE` that lists the derived files. The root README already thanks dash.js.
- [ ] **Step 4: Review the API report.** Read the diff of `cml-abr.api.md`. Confirm that every export is intended.
- [ ] **Step 5: Verify.** Run `npm run format`, `npm test`, and `npm run build -w docs`. Run the style check on the new prose.
- [ ] **Step 6: Commit.** `docs(abr): add the README, TSDoc examples, and attribution`.

---

## Testing strategy

| Level | Where | What it checks |
|---|---|---|
| Core math | Internal tests | The thresholds equal the bisection of the oracle score. The maximum buffer of a rung is the level where its score is zero. The effective buffer time is raised to `10 + 2 * M`. Equal neighbours merge. |
| Properties | Internal tests | The chosen rung never decreases when the buffer grows. The index stays in range. Scaling all bitrates by one factor changes no choice. A one-rung ladder returns that rung. A tie goes to the higher rung. A seeded set of random ladders matches the oracle. |
| Golden values | Internal tests | The fixtures L1 and L2 of the design record map buffer levels to rungs. A guard test checks that every level sits inside its oracle interval. |
| Validation | Internal tests | Each message of the design record appears for its input. |
| State and events | Public tests | Startup to steady. `reset`. `onBufferEmpty`. The abandon cap. The replacement bump. The decay. The oscillation guard with a high, a medium, and an unknown throughput. A delay of 0 at the top rung. |
| Ladder changes | Public tests | One test for each row of the ladder change table. An in-place change of the caller array. An invalid ladder leaves the state unchanged. |
| Simulation | Public tests | Determinism and invariants. Structural findings only. |

## Manual verification against dash.js

Run this check before the pull request. Do not commit the harness.

- [ ] **Step 1: Get the reference.** Download dash.js at commit `ac9e3d1`. The `BolaRule.js` file is identical in the `development` branch as of 2026-09-24.
- [ ] **Step 2: Build a harness.** Create `BolaRule` with its factory and with stubs for the metrics, the player model, the ABR controller, the rules context, and the throughput controller.
- [ ] **Step 3: Compare.** Feed the same ladder and buffer sequences to the harness and to `BolaSelector`. Use buffer levels away from the thresholds. Compare the chosen bitrates in the steady state.
- [ ] **Step 4: Classify differences.** Every difference must match a deliberate difference listed in the RFC. An unlisted difference is a defect in one of the two sides.

## End-to-end check in a player

- [ ] **Step 1: Use the custom rule sample.** Start from the `abr/custom-abr-rules.html` sample of dash.js. Turn off the default quality switch rules.
- [ ] **Step 2: Register a rule.** Add a custom rule with `addABRCustomRule`. The rule calls `BolaSelector.select` and reports each loaded segment.
- [ ] **Step 3: Compare.** Play the same stream with the built-in BOLA rule and with the custom rule. Shape the network with the browser developer tools, the Network Link Conditioner, or `tc netem`. Count the rebuffers and the quality switches.

## Verification

```bash
npm run format
npm run typecheck
npm run build -w libs/abr
npm test -w libs/abr
npm test
npm run build -w docs
```

Read the diff of `libs/abr/config/cml-abr.api.md`. Check that every commit carries a sign-off.

## Self-review checklist

- [ ] Every export has TSDoc with `@public`.
- [ ] Every public class has an `@example` with `{@includeCode}` and a matching test region.
- [ ] No test asserts a copied literal where an exported constant exists.
- [ ] No source file reads the clock.
- [ ] `scripts/projects.ts` and every `version` field are unchanged.
- [ ] The prose passes the style check.
