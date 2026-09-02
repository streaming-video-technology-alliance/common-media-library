# Implementation steps

Branch: `issue/424-xml-parse-perf`. Prerequisite: the hang-fix PR (bounded attribute scan, declaration and
close tag `indexOf` guards) is merged or folded in here.

1. Capture the equivalence corpus as tests before touching the parser. Add
   `libs/xml/test/parseXml.equivalence.test.ts` that parses each corpus input with each option set and
   compares to expected output. Generate the expected JSON once from the current implementation
   (serialize `parentElement` as a node path or test it separately, since JSON cannot hold the cycle).
   Include the fixtures under `libs/xml/test/fixtures/`.
2. Add the hang regression tests (valueless attribute, unquoted value, truncated attribute, truncated
   declaration, truncated close tag). Run them under a timeout so a regression fails instead of hanging CI.
3. Add the benchmark under `libs/xml/bench/` per `benchmark.md`, with an npm script, and record baseline
   numbers in the PR description.
4. Rewrite `parseXml.ts` following `prototype.md`: single loop, explicit stack, `charCodeAt` scanning,
   `indexOf` only for comments, CDATA, doctype and close tags, `unescapeHtml` only when an `&` was seen.
   Keep `XmlParseOptions` and `XmlNode` unchanged. Keep module scope free of side effects (numeric
   constants and plain functions only) so the module-scope probe stays clean.
5. Build (`npm run build -w libs/utils -w libs/xml`), run `npm test -w libs/xml`, `npm run typecheck`,
   `npm run lint`. Confirm `libs/xml/config/cml-xml.api.md` has no diff.
6. Changelog under `## [Unreleased]` in `libs/xml/CHANGELOG.md`: Changed (parser rewritten as a flat
   scanner, with measured numbers) and Fixed (hangs on truncated input). No version bump.
7. Comment on #424 with the before/after table and note that `<S ...></S>` inputs benefit equally.
8. Separately, decide whether to open an RFC for a visitor or streaming API if dash.js wants more than the
   tree-building parser can deliver.
