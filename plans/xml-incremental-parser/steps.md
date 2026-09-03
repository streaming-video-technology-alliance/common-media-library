# Implementation steps (after the RFC is accepted)

Base: `main` after #432 (5e4a82276), which already has the flat scanner in `libs/xml/src/scan.ts`, the
internal builder type, the parity corpus (106 inputs x 6 option sets), the benchmark harness, and the
livesim2 fixture. Branch `issue/424-xml-builder-api`. Every commit with `git commit -s`; no version bump.
The reference for every change is `prototype/`, which runs against that base and is covered by lint and
typecheck.

1. Port the scanner changes from `prototype/scan.ts` into `libs/xml/src/scan.ts`, keeping the file's
   constant names and comment style: the `strict` flag and its end-of-input errors, the name argument on
   `appendChild` and the text callbacks, skipping when `createElement` returns `undefined`, untrimmed text
   with blank runs dropped unless `keepWhitespace`, the CDATA fallback to `appendText`, inner text for
   comments and doctypes, processing instructions ending at `?>`, quoted literals in doctypes,
   NameStartChar attribute names, and `XmlParseError`.
2. Update `libs/xml/src/parseXml.ts` as in `prototype/parseXml.ts`: eight prebuilt tree builders
   (whitespace x comments x parentElement), trimming in the builder, the comment and doctype wrappers,
   tolerant mode. The public signature does not change; its `@throws` TSDoc gains `XmlParseError`.
3. Public additions, each in its own file with TSDoc and `@public`: `XmlBuilder.ts` (property syntax,
   `this: void`, `TElement`/`TDocument`), `XmlParseWithOptions.ts`, `parseXmlWith.ts`, `XmlParseError.ts`. Export
   them from `index.ts`, types through `export type *`. Add
   `'@typescript-eslint/no-invalid-void-type': ['error', { allowAsThisParameter: true }]` to
   `eslint.config.ts` so `this: void` lints without a disable comment.
4. Parity fixtures: add the three corpus cases from `prototype/equivalence.ts` (`doctype with quoted gt`,
   `colon-start attribute`, `pi with gt then element`), regenerate with `UPDATE_FIXTURES=1 npm test -w
   libs/xml`, and confirm that exactly the eight cases listed in `equivalence.md` changed, for the reasons
   listed there. Every other expectation must be byte-identical.
5. Tests in `libs/xml/test/parseXmlWith.test.ts`, with a `// #region example` block that doubles as the TSDoc
   example: strict end-of-input on the truncated corpus cases, root injection, the name arguments,
   skipping, the text policy, the CDATA fallback, inner-text shapes, and the `XmlParseError` fields.
   Port `prototype/dash.ts` as a test helper and assert that the faithful one-pass builder equals
   `parseXml` plus `processNode` on the fixtures, the synthetic manifests, and the namespaced sample.
6. Benchmark: add the dash.js pipelines and the two-builder pairs from `prototype/bench.ts` to
   `libs/xml/bench/bench.ts`. Record `main` before the port and the branch after it.
7. `npm run build -w libs/utils -w libs/xml`, `npm test -w libs/xml`, `npm test -w libs/drm`,
   `npm run typecheck`, `npm run lint`, `npm run build -w docs`. The `cml-xml.api.md` diff must be exactly
   `parseXmlWith`, `XmlBuilder`, `XmlParseWithOptions`, and `XmlParseError` added and `parseXml`'s doc comment.
   Measure bundle sizes as in `prototype.md` and put them in the PR.
8. Changelog under `## [Unreleased]` in `libs/xml/CHANGELOG.md`. Added: `parseXmlWith`, `XmlBuilder`,
   `XmlParseWithOptions`, `XmlParseError`. Fixed: processing instructions end at `?>`, a `>` inside a quoted
   doctype literal no longer ends the doctype, attribute names may start with any XML NameStartChar
   (`_`, `:`, non-ASCII letters). Changed: `parseXml` throws `XmlParseError` (a subclass of `Error` with
   the same messages); with `keepComments`, a comment cut off by the end of the input and the malformed
   `<!--->` are reported with a closing `-->`. README: a `parseXmlWith` quick start next to `parseXml`.
9. Update the RFC to `status: implemented` with `implemented-in` and `implementation-plan`, and comment on
   #424 and dash.js#4984 with the before/after table and the builder example.
10. Incremental input (`write`/`end`) is a separate RFC; its design notes are under "Deferred: incremental
    input" in `findings.md`.
