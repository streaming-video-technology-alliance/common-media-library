# Implementation steps (after the RFC is accepted)

Branch: `issue/424-xml-incremental-parser` (or continue on the RFC branch if the RFC PR is squash-merged
first). Prerequisites: the pending hang-fix branch `issue/xml-parse-hang` is merged or folded in, so the
parity corpus is captured against a parser that terminates on every input.

1. Capture parity fixtures before touching the parser. Add `libs/xml/test/parseXml.equivalence.test.ts`
   that parses every corpus input (`equivalence.md`) with each option set and compares to expected output
   generated once from the current implementation. Serialize `parentElement` as a node path since JSON
   cannot hold the cycle, or assert it separately.
2. Add `libs/xml/src/XmlBuilder.ts` (type), `libs/xml/src/XmlParserOptions.ts` (type), and
   `libs/xml/src/XmlParser.ts` (class plus the module-level `scan` function), ported from `prototype.md`
   with repo style: tabs, single quotes, no semicolons, `type` not `interface`, TSDoc with `@public` on
   every export, `{@includeCode ../test/XmlParser.test.ts#example}` on the class.
   - Copy the builder's functions into instance fields in the constructor (fixed hidden class).
   - Keep module scope side-effect free (numeric constants and functions only).
   - Give `parseXml` an internal entry that starts the scan at `pos` on the full input so the
     mismatched-close-tag message keeps whole-document line and column.
3. Rewrite `libs/xml/src/parseXml.ts` as four prebuilt `XmlBuilder<XmlNode>` variants over `XmlParser`.
   `XmlParseOptions` and `XmlNode` are unchanged.
4. Tests in `libs/xml/test/XmlParser.test.ts`:
   - `// #region example`: the dash.js-shaped builder from the RFC guide, asserting the manifest object.
   - Boundary sweep with a recording builder (every split for small inputs, sampled for large).
   - Streamed input through `TextDecoderStream` and `WritableStream` (Node 24 has both globally).
   - Lifecycle errors, absolute error offset, `Missing closing quote` only from `end()`.
   - Hang regression inputs under a worker timeout (pattern from `issue/xml-parse-hang`).
5. Benchmark under `libs/xml/bench/` with an npm script, per `benchmark.md`: one process per variant,
   natural and forced GC, the generator, and the real livesim2 manifest checked in as a fixture (169 KB).
   Keep it out of the `**/*.test.ts` glob; `eslint .` lints everything except `dist`, so the bench must
   pass lint too.
6. Build (`npm run build -w libs/utils -w libs/xml`), `npm test -w libs/xml`, `npm run typecheck`,
   `npm run lint`. Review the `libs/xml/config/cml-xml.api.md` diff: exactly `XmlParser`, `XmlBuilder`,
   and `XmlParserOptions` added, nothing else changed.
7. Docs: README quick start for `XmlParser` next to `parseXml` (the README currently shows a non-existent
   `decodeXml`; fix while there). Changelog under `## [Unreleased]`: Added (`XmlParser`, `XmlBuilder`,
   `XmlParserOptions`), Changed (`parseXml` rewritten on the incremental core, with measured numbers, and
   the added `Offset` line in the mismatched-close-tag message). No version bump.
8. Update the RFC: `status: implemented`, `implemented-in`, `implementation-plan: plans/xml-incremental-parser/`.
9. Comment on #424 and dash.js#4984 with the before/after table and a link to the builder example.
