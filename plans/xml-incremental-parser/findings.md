# Design-session findings

This file follows `plans/xml-parse-perf/` (issue #424). The question was how to give dash.js the 2x
speedup that it prototyped, when the tree-building parser can get only about 30 percent faster. The
answer is an API change, written up in `rfc/xml-incremental-parser.md`. This file records what was
learned and the decisions taken with Casey: first in the design session on 2026-09-02, then in the
review round on 2026-09-03, after #430 and #432 merged.

Phase one is the scope of the RFC: the builder contract and `parseXmlWith`. Phase two is incremental
input, which is deferred to its own RFC.

## Decisions, design session (2026-09-02)

1. **Goal.** A general-purpose XML API, judged on performance. dash.js is the reference consumer, but
   not the only one. The API does not have to be SAX-shaped.
2. **Input model.** An incremental parser (`write(chunk)`, `end()`) as the core. Replaced in the review
   round, see below. The RFC now proposes the builder contract with an entry point that takes the
   complete document. Incremental input moves to its own RFC.
3. **Consumer API.** A builder object: `createDocument`, `createElement` returning the consumer's value,
   `appendChild` after the children, `appendText`, `appendCdata`, `appendComment`, `appendDoctype`. Not
   SAX events, not a pull parser, and not a lazy tree.
4. **Names.** DOM vocabulary (`createElement`, `appendChild`) over SAX vocabulary. Still open for
   discussion.
5. **`createElement` receives `localName` and `prefix`.** Measured 2 to 5 percent faster on the tree
   path than an `indexOf` in the builder, and the consumer code is simpler. They are trailing
   parameters, so three-parameter builders still work.

## Decisions, review round (2026-09-03)

Casey reviewed the RFC in 22 threads, partly by trying the contract against `parseDash` in the avia-js
CMAF adapter (CMAF is the Common Media Application Format). Pascal Thuet asked whether the one-pass
builder and incremental input were two separate steps. Every item below was checked against `main`
after #432 before it was accepted.

1. **Split.** #432 already put the flat scanner and the internal builder on `main`, and dash.js passes
   complete strings. A `parseXmlWith(input, builder)` call that takes the complete document therefore
   gives dash.js everything it uses today. Every P1 (blocking) finding was about incremental input: the
   carry cost, the truncation behavior, and the chunk benchmarks. Phase one is the builder contract plus
   `parseXmlWith`. Incremental input is a follow-up RFC (see "Deferred").
2. **`parseXml` calls `scan` directly**, as #432 shipped it, so a `parseXml`-only bundle never includes
   `parseXmlWith`. The RFC's baseline is `main` after #432, not the parser before #432.
3. **Text policy.** Text runs are delivered untrimmed and entity-decoded. Whitespace-only runs are
   dropped unless `keepWhitespace` is set. The `parseXml` tree builder trims, as before. `appendCdata`
   falls back to `appendText` when absent, so character data is never lost silently.
4. **Grammar fixes in the shared scanner**, for both entry points, as bug fixes. Processing instructions
   end at `?>`. A `>` inside a quoted doctype literal does not end the doctype. Attribute names start
   with any XML NameStartChar (`_`, `:`, non-ASCII letters), not only an ASCII letter. `parseXml` output
   changes only on inputs that it reads wrong today (eight corpus cases, listed in `equivalence.md`).
5. **Shapes.** Comments and doctypes are delivered as inner text (between `<!--` and `-->`, and after
   `<!`). The tree builder adds back what `XmlNode` expects. CDATA was already inner text.
6. **Root injection.** `parseXmlWith(input, builder, { root })`, and `createDocument` becomes optional.
   Module-level builders then need no per-parse closure and no mutable module state.
7. **Name argument.** `appendChild(parent, child, name)` receives the child's tag name. The text
   callbacks receive the parent's tag name. Both come from the `names` stack that the scanner already
   keeps.
8. **Skipping.** `createElement` may return `undefined`. The scanner then reports nothing inside the
   element and does not call `appendChild` for it. Close tags inside a skipped subtree are still checked.
9. **Types.** `XmlBuilder<TElement, TDocument = TElement>`. Property syntax, so that
   `strictFunctionTypes` checks parameter types strictly (contravariantly). `this: void`, because the
   scanner calls the functions without the builder as `this`. The internal type on `main` already uses
   property syntax.
10. **Errors.** `XmlParseError extends Error` with `offset`, `line`, and `column`. The message text does
    not change, so `parseXml` consumers see a subclass with the same messages. `parseXmlWith` is strict:
    an element left open or a construct cut off by the end of the input throws
    `Unexpected end of input inside ...`. The tolerant completion stays internal to `parseXml`.
11. **Evidence.** The guide's dash.js example is illustrative and says so. A faithful port of
    `processNode` and a faithful one-pass builder are in `prototype/dash.ts`, and their output is checked
    with `deepStrictEqual`. The prototype is executable TypeScript under `prototype/`. The repository's
    lint and typecheck cover it. It runs against `main` with the livesim2 fixture from #432.
12. **Benchmark method.** One process per variant, plus two-builder pairs (`parseXml` and one custom
    builder alternating in one process), which is the realistic shape for an application. The earlier
    claim that an interleaved run keeps the per-process ordering was wrong (the tuned builder went from
    faster than the plain one to slower) and is withdrawn. The whole and chunked inputs in the earlier
    run were not comparable (a rope whole input against Buffer-flattened chunks). The generator on
    `main` now returns a flat string.
13. **Unresolved questions settled by the author.** Keep `keepWhitespace` as an option. No Web Streams
    wrapper and no processing-instruction callback until someone asks for them. The error subclass over
    a plain `Error`.
14. **Future possibilities.** A HAM builder (inheritance, expansion to segments, deferred completion) is
    the second reference consumer to write, before an "objectify" builder. HAM is the Hypothetical
    Application Model, see `@svta/cml-cmaf-ham`.

## What consumers do with the tree

- dash.js `DashParser.processNode`: converts every attribute through matchers (`<S>` goes directly to
  `parseInt`), maps children to named properties and arrays (the `arrayNodes` list), and adds `tagName`,
  `__text`, `__prefix`, and `__children`. `PatchManifestModel` relies on the order of `__children`.
  Inheritance (objectiron) runs afterwards and does not need XML. dash.js passes complete strings to the
  parser.
- avia-js CMAF adapter `parseDash` (Casey, review round): flattens a manifest directly into a HAM-shaped
  model. `<S>` cannot become a segment in `createElement`, because the Representation id and bandwidth
  that it needs arrive later. In most manifests the `SegmentTemplate` is on the AdaptationSet, and its
  `<S>` children come before the Representations (the XSD sequence puts `SegmentTemplate` before
  `Representation` and `BaseURL` before `Period`). The builder keeps a small record per `<S>` and expands
  the records when the Representation or the Period ends, in `appendChild`. Still one pass, but it
  depends on document order. In that adapter, the tree is about 9 percent of manifest parse time, and
  URL templating is about 60 percent.
- shaka-player: its own tXml fork. Tree first, then a `findChildren`/`parseAttr` walk. Not a CML
  consumer.
- cmaf-ham sample: xml2js (a tree on top of sax-js), injected through `setDashParser`.
- `@svta/cml-drm` PlayReady helpers: `parseXml` plus `getElementsByName` on very small documents.
- hls.js: uses cml-cmcd, id3, sfv, and utils. No XML.

## Measurement insights

Tables are in `benchmark.md`, code in `prototype/`.

- **Where dash.js spends its time.** On the 100k `<S>` stress manifest, `processNode` costs about as much
  as the parse itself. A faithful port of `processNode` into a builder removes the tree and the walk, but
  keeps the per-node conversion (the matcher chain, keyed stores, `arrayNodes.indexOf`). A lean builder
  that keeps only what dash.js reads and handles `<S>` directly reaches the range that dash.js
  prototyped. That specialization lives in the player, not in `parseXml`.
- **Per-parse instance state deoptimizes the scanner after every full GC.** V8 tracks whether a field is
  constant per hidden class, and hidden-class transitions are weak references. An object created per
  parse gets a new hidden class after each full GC, and the first write to a field that the constructor
  initialized invalidates every function compiled against it. The streaming prototype's scanner read and
  wrote instance fields, so it never kept optimized code: 6 ms per parse of the 170 KB livesim2 manifest
  after a forced full GC, against 0.9 ms with natural GC. A scanner that takes primitives and arrays ran
  in 0.8 ms in both cases. #432 shipped that shape. Found with
  `--trace-opt --trace-deopt --trace-generalization`.
- **Reading one character past the end damages type feedback.** `charCodeAt(length)` returns `NaN`. Once
  the character variable has held `NaN`, V8 compiles every comparison on it as a floating-point compare
  for the rest of the process. Guarding every advance made whole-string scanning about 19 percent
  faster. #432 shipped the guards.
- **Rope strings.** `carry + chunk` creates a V8 `ConsString` (a rope). The scanner reads a rope about 25
  percent slower than a flat string, even after the one-time flatten. `[carry, chunk].join('')` creates
  a flat string. Relevant to phase two only.
- **Type-feedback contamination.** One `scan` driven by many builder shapes, or by both flat and rope
  input strings, in one process slowed every variant of the first prototype by 30 to 65 percent.
  Benchmarks run one variant per process, plus the two-builder pairs that model an application. The
  #424 investigation concluded that per-call closures lose optimized code after a full GC. That
  conclusion was an artifact of an interleaved harness. Measured one variant per process, the pre-#432
  parser went from 1.3 ms to 1.7 ms under forced GC on the livesim2 manifest, not 4x.
- **Attribute objects against per-attribute callbacks.** Per-attribute callbacks saved a few
  milliseconds on the stress case. They were incompatible with the streaming carry model, and they force
  consumers to build the element before seeing its attributes. Not proposed.
- **Machine.** MacBook Pro M1 Pro, Node 24.16, on battery, Low Power Mode on. Absolute numbers are
  indicative. The RFC relies on relative numbers within one run.

## Bundle size (tsdown --minify, utils external)

| Entry | Minified | Gzipped |
|---|---:|---:|
| `parseXml` on `main` (#432) | 3,797 B | 1,494 B |
| whole `@svta/cml-xml` on `main` | 4,301 B | 1,734 B |
| `parseXml` on the phase-one scanner | 5,004 B | 1,947 B |
| `parseXmlWith` alone | 4,000 B | 1,640 B |
| whole package after phase one | 5,224 B | 2,012 B |

## Platform notes

- `scheduler.yield()`: in Chromium since 2024 and Firefox since August 2025, not in Safari as of 2026-09.
  Use a `setTimeout` fallback (sources: MDN and caniuse `mdn-api_scheduler_yield`). Relevant to phase
  two.
- `pipeTo(new WritableStream(...))` and `TextDecoderStream` are available in all evergreen browsers and
  in Node 24. Relevant to phase two.
- dash.js loads a manifest as one string through `URLLoader` (XHR or fetch) and then calls the parser.
  Streamed parsing would need a change to their loading path. Time-slicing would not.

## Deferred: incremental input (phase two)

The first revision of this record designed and prototyped `XmlParser` with `write(chunk)` and `end()`.
Complete constructs were consumed in streaming mode, the unconsumed tail was carried into the next
write, `end()` scanned the carry in final mode, and error offsets were absolute. The JavaScript prototype
and its numbers are in this file's history (commit 8eb767e). The review round found the problems below.
The phase-two RFC starts from them.

- **The carry is quadratic for a long construct.** Every `write` rescanned the whole incomplete text run,
  quoted attribute, comment, or CDATA section. An 8 MiB construct in 64 KiB chunks therefore costs
  hundreds of MiB of scanning. Streamed input is controlled by the remote side, so this is a
  denial-of-service path. Fix: keep lexical progress across writes for text, comments, and CDATA (resume
  the search where it stopped), and add a limit on the size of a buffered construct that throws when
  exceeded. Start tags may still be rescanned from their start, under that limit. Test with
  multi-megabyte constructs in small chunks.
- **`end()` must be strict by default.** A response that ends cleanly in the middle of a document must
  not come back as a partial manifest that looks valid. Phase one's `parseXmlWith` already establishes
  the rule.
- **Chunk benchmarks need comparable strings.** Flatten one whole input first. Then measure the flat
  whole input, decoder-like flat chunks, and the `slice()` chunks that a time-slicing consumer would
  produce. Report the slicing cost and the maximum duration of one write. The earlier "chunking is free"
  result compared a rope whole input with flattened chunks, and is withdrawn.
- **Lifecycle.** The final `appendChild` flush must be inside the same failure transition as scanning, so
  that a builder that throws during `end()` leaves the parser in the failed state. Line and column are
  reported only when the failing text starts at document offset zero. The absolute offset is always
  reported.
- **Wrapper cost.** The class holds only lifecycle state. The scanner keeps taking primitives. `parseXml`
  stays on `scan`, so its bundle never includes the wrapper.
- Open: a Web Streams `XmlTransformer`, and an `offset` accessor for progress.

## Out of scope, noted

- `libs/xml/README.md` shows `decodeXml`, which does not exist. The separate session opened to fix it was
  deleted, so the issue is still open. Fix it in the implementation PR.
