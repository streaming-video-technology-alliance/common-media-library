# Example typecheck: design

Issue: [#565](https://github.com/streaming-video-technology-alliance/common-media-library/issues/565)
Date: 2026-10-22
Status: design approved by Casey, implementation not started

## Goal

Every fenced TypeScript block in a package README or guide typechecks on its own. A root script test proves this on every PR. The 51 failing blocks are fixed in the same PR.

## Facts

- 120 blocks in 31 files: the root `README.md`, 20 package READMEs, and 10 guides under `libs/*/docs/`. The fence languages are `typescript` (119) and `ts` (1).
- 51 blocks fail. All of them are in the cmcd, c2pa, and iso-bmff guides. Every README passes.
- The strict settings of the root `tsconfig.json` add 8 errors to the issue's count. All 8 are implicit `any` errors in blocks that already need a declaration line.
- A TypeScript compiler API prototype checks all 120 blocks as virtual modules in 910 ms. It writes no file.
- Seven blocks contain wrong code that a reader would copy. The fixes are listed in [inventory.md](inventory.md).

## Decisions

Casey made these choices on 2026-10-22.

| Question | Decision |
| - | - |
| Values from the reader's code or an earlier block | Declare them in the block with `declare const` or `declare function`. No skip marker. No guide-order check. |
| Compiler settings | The root `tsconfig.json` settings, strict. Unused-code checks off. |
| Blocks that show an intentional compile error | Keep the demo. Mark the line with `// @ts-expect-error`. The check then fails if the error stops occurring (TS2578). |
| PR shape | One PR: the check, all block fixes, three changelog entries, the AGENTS.md rule, and the regenerated `skills/` files. |

Decisions that follow from the facts:

- The check runs in process through the TypeScript compiler API. A `tsc` run on an extracted folder needs a scratch directory, and the root lint and typecheck include every `.ts` file in the tree.
- The check covers the root `README.md`, `libs/*/README.md`, and `libs/*/docs/*.md`. It does not cover `rfc/` (proposals), `skills/` (generated from the same sources), or TSDoc `{@includeCode}` regions (compiled with the test files).
- Every block is checked as one module. Blocks do not share declarations.

## The check

Files: `scripts/checkExamples.ts` and `scripts/checkExamples.test.ts`. The root `npm test` runs `node --test scripts/*.test.ts` after lint, build, and typecheck, so the built `dist/` of every package exists when the test runs.

### Extraction

`extractExampleBlocks(markdown, file)` returns one record per fence that starts at column 0 with the language `ts` or `typescript`. A record holds the file path, the line of the opening fence, and the code. The closing fence is the next line that is exactly three backticks. Other languages, such as `bash`, are ignored.

`listExampleFiles(repoRoot)` returns the root `README.md`, every `libs/*/README.md`, and every `libs/*/docs/*.md`, sorted.

### Typecheck

`checkExamples(blocks, repoRoot)` creates one `ts.Program` over all blocks:

- Each block becomes a virtual file `<repoRoot>/.example-check/<file path>.<n>.ts`. The folder does not exist on disk. Module resolution walks up from the virtual path and finds `node_modules/@svta/cml-*`, which link to each package's `dist/`.
- A virtual `<repoRoot>/.example-check/package.json` with `{"type":"module"}` makes every block an ES module. Top-level `await` then compiles, and a `declare const` in one block does not become a global that conflicts with another block.
- The compiler host is `ts.createCompilerHost(options)` with `fileExists`, `readFile`, and `getSourceFile` overridden for the virtual paths. Every other path reads from disk.
- Compiler options come from the root `tsconfig.json` through `ts.readConfigFile` and `ts.parseJsonConfigFileContent`, with these overrides: `noEmit: true`, `skipLibCheck: true`, `noUnusedLocals: false`, `noUnusedParameters: false`, `moduleDetection: force`, and `incremental`, `declaration`, `declarationMap`, `isolatedDeclarations`, `sourceMap`, `inlineSources`, `outDir` removed.
- The result is a list of `{ file, line, code, message }`. The line is the markdown line: fence line + 1 + the line of the diagnostic inside the block.

### Test

`scripts/checkExamples.test.ts` holds:

- Unit tests for `extractExampleBlocks` with inline markdown: finds `ts` and `typescript` fences, ignores `bash`, records the fence line, handles two blocks in one file.
- A negative control: a block with `const x: number = "a"` reports TS2322 at the expected markdown line. A valid block reports nothing.
- The gate: `checkExamples(listExampleFiles(repoRoot))` returns an empty list. The failure message lists every diagnostic as `file:line TScode message`, one per line.

If a package `dist/` is missing, the gate fails with TS2307 on the import. The failure message tells the reader to run `npm run build` first.

## Documentation rule

Replace the AGENTS.md line "All code examples must be complete and runnable: no pseudocode and no missing imports." with:

- Every fenced TypeScript block in a README or guide must typecheck on its own. Import every library name the block uses. Declare values that the reader's code provides with `declare const` or `declare function`. No pseudocode.
- A block that shows a compile error marks the line with `// @ts-expect-error`.
- TSDoc examples that `{@includeCode}` a test region compile with the test file. The standalone rule does not apply to them.

Add to the Workflow section: "The root `npm test` typechecks every example block. Run it after a README or guide change."

## Changelog entries

Drafts, to run through the writing-style gate before the commit. One entry per package under `## [Unreleased]`.

- cmcd: "Every code example in the guides now typechecks on its own. The `recordResponseReceived` examples now include `encodedBodySize`."
- c2pa: "Every code example in the guides now typechecks on its own. Values that the player provides are declared with `declare const`."
- iso-bmff: "Every code example in the guides now typechecks on its own. The writing examples pass each `Uint8Array` to `appendBuffer` directly, and the `traverseIsoBoxes` example reads the boxes first."

## Out of scope

- Running the blocks. The check proves types, not behavior.
- Quote style and semicolon style inside the blocks. The cmcd guides use double quotes, the c2pa guides use single quotes.
- Prose changes beyond the sentences that name a changed identifier.
- The `rfc/` blocks and the TSDoc regions.
