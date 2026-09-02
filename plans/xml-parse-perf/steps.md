# Implementation steps

Plan of record for the `parseXml` performance PR. Branch `issue/424-xml-flat-tokenizer` from `main` after
#430 (merged 2026-09-02 as dddbe4952), which changed what `parseXml` accepts and is the parity target.
The incremental parser proposed in `rfc/xml-incremental-parser.md` (#431) is added on top of this scanner
later without touching `parseXml` again; that is the point of the alignment below.

## Alignment with the RFC prototype

Implement the scanner in the structure of `plans/xml-incremental-parser/prototype.md`, final mode only.
Do not port `prototype.md` in this folder; it predates three measured fixes.

- One module-level `scan(input, start, keepWhitespace, slots, stack, names)` holds the tokenizer. It
  receives primitives, the two stack arrays, and a literal-created slots object, and never reads or writes
  a per-parse object. V8 tracks field constness per hidden class and hidden-class transitions are weak, so
  a per-parse instance gets a fresh hidden class after every full GC and the first field reassignment
  deoptimizes the scanner (6 ms instead of 0.9 ms per parse in that regime).
- The open-element stack holds the document at index 0 and the current element on top; `names` mirrors
  it. Nothing is written back at the end of the scan.
- Builder callbacks (`createDocument`, `createElement(parent, name, attributes, localName, prefix)`,
  `appendChild`, `appendText`, `appendCdata`, `appendComment`, `appendDoctype`) are an internal type in
  `libs/xml/src/` for now. `parseXml` supplies four prebuilt tree builders (`keepComments` x
  `includeParentElement`) as module-level constants. Nothing new is exported; `cml-xml.api.md` must not
  change.
- Guard every character read so `cc` is never `NaN`: `cc = ++pos < length ? input.charCodeAt(pos) : 0`.
  Reading one past the end once makes V8 compile every comparison on `cc` as a floating-point compare
  for the rest of the process; the guard alone was worth about 19 percent.
- Start the scan at `options.pos` on the full input rather than a slice, so error messages keep
  whole-document line and column.
- Leave out the streaming pieces: no carry, no `!final` early returns, no `write`/`end`, no `Offset` line
  in messages. Errors are byte-identical to `main` after #430: the `syntaxError` format with `Line`,
  `Column`, and `Char` (`end of input` when cut off), `Malformed attribute "<name>": expected "=" after
  name` and `... expected quoted value after "="`, `Unexpected close tag`, `Missing closing quote`.
- Module scope stays free of side effects (numeric constants and functions only).

Why the indirection now: on the RFC prototype the builder callbacks cost nothing visible. The aligned
scanner measured 20.1 ms against 22.8 ms for the fused flat prototype in this folder on the pretty stress
input, because of the end-of-input guard, and 28.3 ms for the shipped parser. The RFC implementation then
only adds code. The cost is bundle size: a few hundred gzipped bytes over a fused rewrite. Measure it in
the PR with `tsdown --minify` and `@svta/cml-utils` external; today's `parseXml` is 2,372 B minified,
1,109 B gzipped.

## Steps

1. Parity fixtures before touching the parser. Add `libs/xml/test/parseXml.equivalence.test.ts` that
   parses every corpus input (`plans/xml-incremental-parser/equivalence.md`, about 60 inputs, plus the
   cases from #425 and #430's tests) with each of the six option sets and compares to expected output
   captured once from `main` after #430. Serialize `parentElement` as a node path, since JSON cannot hold
   the cycle, or assert it separately. Inputs that #430 turned into errors carry `throws` expectations
   with the exact message: `<a b>`, `<a b=c/>`, `<a b="c" d>`, `<a b "c"/>`, and truncation inside an
   attribute (`Malformed attribute`); `<a></ab>`, `<ab>text</abc>`, `<a/></b>`, `</>` at the document
   level (`Unexpected close tag`). `</a >` still closes `<a>`; `<a>text</a` and an unterminated `<?xml`
   still return the partial tree. Run the sweep inside the worker guard #430 added so a hang fails after
   two seconds instead of stalling CI.
2. Truncation coverage. #425 and #430 already sweep every prefix of both fixtures in a worker; keep that
   passing and add the RFC corpus's truncation cases it does not cover (`<a><![CDA`, `<a><!`, a lone `<`
   at the end, `<a><bc`, `<!DOCTYPE html`).
3. Benchmark under `libs/xml/bench/` with a `bench` npm script, per `benchmark.md`: one process per
   variant, the generator, the livesim2 manifest checked in as a 169,721-byte fixture, natural and
   forced GC. Record before and after in the PR description. Keep the variant list extensible so the
   `XmlParser` rows from `plans/xml-incremental-parser/benchmark.md` can be added when the RFC lands.
   Keep the folder out of the `**/*.test.ts` glob; `eslint .` lints it.
4. Implement per "Alignment" above: `libs/xml/src/scan.ts` (internal, not re-exported from `index.ts`)
   and `libs/xml/src/parseXml.ts` rewritten as the tree builders over it. `XmlParseOptions` and
   `XmlNode` are unchanged. Remove the recursion; the equivalence corpus is the safety net.
5. Build (`npm run build -w libs/utils -w libs/xml`), `npm test -w libs/xml`, `npm run typecheck`,
   `npm run lint`. Confirm `libs/xml/config/cml-xml.api.md` has no diff.
6. Changelog under `## [Unreleased]` in `libs/xml/CHANGELOG.md`: Changed, `parseXml` rewritten as a flat
   non-recursive scanner with the measured before-and-after numbers and a note that output is identical;
   nesting depth is no longer limited by the call stack. No version bump.
7. Comment on #424 with the table, noting that `<S ...></S>` inputs (livesim2) benefit equally and that
   the remaining path to 2x is the builder API in #431.
