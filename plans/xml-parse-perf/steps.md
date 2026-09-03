# Implementation steps

Plan of record for the `parseXml` performance PR, executed 2026-09-02 as
[#432](https://github.com/streaming-video-technology-alliance/common-media-library/pull/432) on branch
`issue/424-xml-flat-tokenizer` from `main` after #430 (dddbe4952), which set the parity target. The scanner
follows the structure of `plans/xml-incremental-parser/prototype.md` (#431), final mode only, so the
incremental parser can be added on the same core later without touching `parseXml` again.

## Outcome

1. Parity fixtures before the rewrite: `libs/xml/test/parseXml.equivalence.test.ts` parses 106 inputs with six
   option sets and compares them to output captured from `main`, inside the worker guard from #430.
2. Truncation coverage for the cases the prefix sweep does not reach, in `libs/xml/test/parseXml.test.ts`.
3. Benchmark: `libs/xml/bench/` with `npm run bench -w libs/xml`, one process per variant and input, natural
   and forced GC; the livesim2 `tsbd_21600` manifest is checked in as a test fixture.
4. Implementation: `libs/xml/src/scan.ts` (one module-level `scan()` over builder callbacks typed in
   `libs/xml/src/XmlBuilder.ts`, both internal) and `libs/xml/src/parseXml.ts` as four prebuilt tree
   builders. Output identical to `main`, public API unchanged, nesting depth no longer limited by the call
   stack.
5. Measured 19 to 38 percent faster across the six benchmark inputs, natural GC medians; the table and the
   bundle sizes are in #432.

## Next

The remaining path to the 2x that dash.js prototyped is the builder API in `rfc/xml-incremental-parser.md`
(#431), which adds `XmlParser` on this scanner.
