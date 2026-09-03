# Design-session findings

Follow-up to `plans/xml-parse-perf/` (issue #424). The question was how to get dash.js the 2x it
prototyped, given that the tree-building parser tops out around 30 percent faster. The answer is an API
change, written up as `rfc/xml-incremental-parser.md`. This file records what was learned and the
decisions taken with Casey, first in the design session of 2026-09-02 and then in the review round of
2026-09-03, after #430 and #432 had merged.

## Decisions, design session (2026-09-02)

1. **Success bar.** A general-purpose XML API judged on performance, with dash.js as the reference
   consumer but not the only one. Not SAX-shaped by requirement.
2. **Input model.** An incremental parser (`write(chunk)`, `end()`) as the core. Superseded in the review
   round, see below: the RFC now proposes the builder contract with a one-shot entry point, and incremental
   input is deferred to its own RFC.
3. **Consumer API.** A builder object (`createDocument`, `createElement` returning the consumer's value,
   post-order `appendChild`, `appendText`, `appendCdata`, `appendComment`, `appendDoctype`) rather than
   SAX events, a pull parser, or a lazy tree.
4. **Names.** DOM vocabulary (`createElement`, `appendChild`) over SAX vocabulary; open for bikeshedding.
5. **`createElement` receives `localName` and `prefix`.** Measured 2 to 5 percent faster on the tree path
   than an `indexOf` in the builder, and simpler consumer code. Trailing parameters, so three-parameter
   builders still work.

## Decisions, review round (2026-09-03)

Casey reviewed the RFC in 22 threads, partly from trying the contract against the avia-js CMAF adapter's
`parseDash`, and Pascal Thuet asked whether the one-pass builder and incremental input were two steps.
Every item below was verified against `main` after #432 before being accepted.

1. **Split.** #432 already put the flat scanner and the internal builder on `main`, and dash.js passes
   complete strings, so a one-shot `buildXml(input, builder)` gives dash.js everything it uses today. Every
   P1 finding sat in the streaming half (carry cost, truncation semantics, chunk benchmarks). Phase one
   is the builder contract plus `buildXml`; incremental input is a follow-up RFC (see "Deferred").
2. **`parseXml` stays directly on `scan`**, as #432 shipped it, so a `parseXml`-only bundle never carries
   `buildXml`. The RFC's decision baseline is `main` after #432, not the pre-#432 parser.
3. **Text policy.** Runs are delivered untrimmed, entity-decoded. Whitespace-only runs are dropped unless
   `keepWhitespace`. `parseXml`'s tree builder trims, as before. `appendCdata` falls back to `appendText`
   when absent so character data is never lost silently.
4. **Grammar fixes in the shared scanner**, for both entry points, as bug fixes: processing instructions
   end at `?>`; a `>` inside a quoted doctype literal does not end the doctype; attribute names start with
   any XML NameStartChar (`_`, `:`, non-ASCII letters), not only an ASCII letter. `parseXml` output
   changes only on inputs it currently gets wrong (eight corpus cases, listed in `equivalence.md`).
5. **Shapes.** Comments and doctypes are delivered as inner text (between `<!--` and `-->`, after `<!`);
   the tree builder re-adds what `XmlNode` expects. CDATA was already inner text.
6. **Root injection.** `buildXml(input, builder, { root })`; `createDocument` becomes optional. Module-level
   builders then need no per-parse closure and no mutable module state.
7. **Name argument.** `appendChild(parent, child, name)` receives the child's tag name; the text callbacks
   receive the parent's. Both come from the `names` stack the scanner already keeps.
8. **Skipping.** `createElement` may return `undefined`; the scanner then reports nothing inside the element
   and does not call `appendChild` for it. Close tags inside a skipped subtree are still checked.
9. **Types.** `XmlBuilder<TElement, TDocument = TElement>`; property syntax so `strictFunctionTypes` checks
   parameters contravariantly; `this: void` because the scanner calls the functions detached. `main`'s
   internal type already uses property syntax.
10. **Errors.** `XmlParseError extends Error` with `offset`, `line`, `column`; message text unchanged, so
    `parseXml` callers see a subclass with the same messages. `buildXml` is strict: an element left open
    or a construct cut off by the end of the input throws (`Unexpected end of input inside ...`); the
    tolerant completion stays internal for `parseXml`.
11. **Evidence.** The guide's dash.js example is illustrative and says so. A faithful port of
    `processNode` and a faithful one-pass builder live in `prototype/dash.ts` and are checked for
    `deepStrictEqual` output. The prototype is executable TypeScript under `prototype/`, covered by the
    repository's lint and typecheck, run against `main` with the checked-in livesim2 fixture.
12. **Benchmark method.** One process per variant, plus two-builder pairs (`parseXml` and one custom
    builder alternating in one process), which is the realistic shape for an application. The earlier
    claim that an interleaved run keeps the per-process ordering was wrong (the tuned builder went from
    faster than the plain one to slower) and is withdrawn. Whole and chunked inputs in the earlier run
    were not comparable (rope whole input against Buffer-flattened chunks); `main`'s generator now returns
    a flat string.
13. **Unresolved questions settled by the author.** Keep `keepWhitespace` as an option; no Web Streams
    wrapper and no processing-instruction callback until asked; the error subclass over a plain `Error`.
14. **Future possibilities.** A HAM builder (inheritance, fan-out to segments, deferred completion) is the
    second reference consumer to write before an "objectify" builder.

## What consumers do with the tree

- dash.js `DashParser.processNode`: converts every attribute through matchers (`<S>` straight to
  `parseInt`), maps children to named properties and arrays (`arrayNodes` list), attaches `tagName`,
  `__text`, `__prefix`, `__children`; `PatchManifestModel` relies on `__children` order. Inheritance
  (objectiron) runs afterwards and does not need XML. dash.js passes complete strings to the parser.
- avia-js CMAF adapter `parseDash` (Casey, review round): flattens a manifest straight into a HAM-shaped
  model. `<S>` cannot become a segment in `createElement` because the Representation id and bandwidth it
  needs arrive later: in most manifests the `SegmentTemplate` sits on the AdaptationSet and its `<S>`
  children precede the Representations (the XSD sequence puts `SegmentTemplate` before `Representation`
  and `BaseURL` before `Period`). The builder keeps a compact record per `<S>` and expands at
  Representation or Period completion in `appendChild`. Still one pass, but dependent on document order.
  In that adapter the tree is about 9 percent of manifest parse time and URL templating about 60.
- shaka-player: own tXml fork, tree then `findChildren`/`parseAttr` walk. Not a CML consumer.
- cmaf-ham sample: xml2js (tree on sax-js) injected through `setDashParser`.
- `@svta/cml-drm` PlayReady helpers: `parseXml` + `getElementsByName` on tiny documents.
- hls.js: uses cml-cmcd, id3, sfv, utils; no XML.

## Measurement insights

Tables in `benchmark.md`, code in `prototype/`.

- **Where dash.js's time goes.** On the 100k `<S>` stress manifest `processNode` costs about as much as
  the parse itself. A faithful port of `processNode` into a builder removes the tree and the walk but keeps
  the per-node conversion (matcher chain, keyed stores, `arrayNodes.indexOf`). A lean builder that keeps
  only what dash.js reads and handles `<S>` directly is what reaches the range dash.js prototyped, and
  that specialization lives in the player, not in `parseXml`.
- **Per-parse instance state deoptimizes the scanner after every full GC.** V8 tracks field constness per
  hidden class and hidden-class transitions are weak. An object created per parse gets a fresh hidden
  class after each full GC, and the first reassignment of a field the constructor initialized invalidates
  every function compiled against it. With the streaming prototype's scanner reading and writing instance
  fields it never kept optimized code: 6 ms per parse of the 170 KB livesim2 manifest after a forced full
  GC against 0.9 ms with natural GC. A scanner that takes primitives and arrays ran 0.8 ms in both
  regimes. #432 shipped that shape. Found with `--trace-opt --trace-deopt --trace-generalization`.
- **Reading one past the end poisons type feedback.** `charCodeAt(length)` returns `NaN`; once the
  character variable has been `NaN`, V8 compiles every comparison on it as a floating-point compare for
  the rest of the process. Guarding every advance made whole-string tokenization about 19 percent faster.
  #432 shipped the guards.
- **Rope strings.** `carry + chunk` yields a V8 `ConsString` that the scanner reads about 25 percent
  slower than a flat string even after the one-time flatten; `[carry, chunk].join('')` yields a flat
  string. Relevant to phase two only.
- **Type-feedback contamination.** One `scan` driven by many builder shapes, or by both flat and cons input
  strings, in one process slowed every variant of the first prototype by 30 to 65 percent. Benchmarks
  run one variant per process, plus the two-builder pairs that model an application. The #424
  investigation's conclusion that per-call closures lose optimized code after a full GC was an artifact
  of an interleaved harness: measured one variant per process, the pre-#432 parser went from 1.3 ms to
  1.7 ms under forced GC on the livesim2 manifest, not 4x.
- **Attribute records vs callbacks.** Per-attribute callbacks saved a few milliseconds on the stress case
  but were incompatible with the streaming carry model and force consumers to build the element before
  seeing its attributes. Not proposed.
- **Machine.** MacBook Pro M1 Pro, Node 24.16, on battery, Low Power Mode on. Absolute numbers are
  indicative; relative numbers within a run are what the RFC relies on.

## Bundle size (tsdown --minify, utils external)

| Entry | Minified | Gzipped |
|---|---:|---:|
| `parseXml` on `main` (#432) | 3,797 B | 1,494 B |
| whole `@svta/cml-xml` on `main` | 4,301 B | 1,734 B |
| `parseXml` on the phase-one scanner | 5,004 B | 1,947 B |
| `buildXml` alone | 4,000 B | 1,640 B |
| whole package after phase one | 5,224 B | 2,012 B |

## Platform notes

- `scheduler.yield()`: Chromium since 2024, Firefox since August 2025, not in Safari as of 2026-09; use
  a `setTimeout` fallback (sources: MDN and caniuse `mdn-api_scheduler_yield`). Relevant to phase two.
- `pipeTo(new WritableStream(...))` and `TextDecoderStream` are available in all evergreen browsers and
  in Node 24. Relevant to phase two.
- dash.js loads manifests as one string through `URLLoader` (XHR or fetch) and then calls the parser;
  streamed parsing would need a loading-path change on their side, time-slicing would not.

## Deferred: incremental input (phase two)

The first revision of this record designed and prototyped `XmlParser` with `write(chunk)` and `end()`:
complete constructs consumed in streaming mode, the unconsumed tail carried into the next write, `end()`
scanning the carry in final mode, absolute error offsets. The JavaScript prototype and its numbers are in
this file's history (commit 8eb767e). The review round found the problems below; the phase-two RFC starts
from them.

- **The carry is quadratic for a long construct.** Every `write` rescanned the whole incomplete text run,
  quoted attribute, comment, or CDATA section, so an 8 MiB construct in 64 KiB chunks costs hundreds of
  MiB of scanning, and streamed input is remote-controlled, so this is a denial-of-service path. Keep
  lexical progress across writes for text, comments, and CDATA (resume the search where it stopped), and
  add a buffered-construct limit that throws. Start tags may still be rescanned from their start under
  that limit. Test with multi-megabyte constructs in small chunks.
- **`end()` must be strict by default.** A response that ends cleanly mid-document must not come back as
  a plausible partial manifest. Phase one's `buildXml` already establishes the rule.
- **Chunk benchmarks need comparable strings.** Flatten one whole input, then measure flat whole input,
  decoder-like flat chunks, and the `slice()` chunks a time-slicing consumer would produce, reporting
  slicing cost and the maximum per-write duration. The earlier "chunking is free" result compared a rope
  whole input with flattened chunks and is withdrawn.
- **Lifecycle.** The final `appendChild` flush must be inside the same failure transition as scanning, so
  a builder that throws during `end()` leaves the parser failed. Line and column are reported only when
  the failing text starts at document offset zero; the absolute offset is always reported.
- **Wrapper cost.** The class holds only lifecycle state; the scanner keeps taking primitives. `parseXml`
  stays on `scan` so its bundle never includes the wrapper.
- Open: a Web Streams `XmlTransformer`, an `offset` accessor for progress.

## Out of scope, noted

- `libs/xml/README.md` shows a non-existent `decodeXml`; the separate session opened for it was deleted,
  so it is still open. Fix in the implementation PR.
