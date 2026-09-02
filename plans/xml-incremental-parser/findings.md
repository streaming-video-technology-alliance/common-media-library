# Design-session findings (2026-09-02)

Follow-up to `plans/xml-parse-perf/` (issue #424). The question was how to get dash.js the 2x it
prototyped, given that the tree-building parser tops out around 30 percent faster. The answer is an API
change, written up as `rfc/xml-incremental-parser.md`. This file records what was learned on the way and
the decisions taken with Casey during the session.

## Decisions

1. **Success bar.** A general-purpose XML API judged on performance, with dash.js as the reference
   consumer but not the only one. Not SAX-shaped by requirement; splitting work off the main thread was
   explicitly in scope.
2. **Input model.** An incremental parser (`write(chunk)`, `end()`) as the core, because it subsumes
   time-slicing (feed slices between event-loop turns) and enables parsing while a manifest downloads. A
   whole-string call plus an async variant was the alternative and was rejected as needing a second API
   shape later.
3. **Consumer API.** A builder object (`createDocument`, `createElement` returning the consumer's value,
   post-order `appendChild`, `appendText`, `appendCdata`, `appendComment`, `appendDoctype`) rather than
   SAX events, a pull parser, or a lazy tree. `parseXml` becomes one builder over the same core.
4. **Names.** DOM vocabulary (`createElement`, `appendChild`) over SAX vocabulary; open for bikeshedding in
   the RFC.
5. **`createElement` receives `localName` and `prefix`.** Measured 2 to 5 percent faster on the tree path
   than an `indexOf` in the builder, and simpler consumer code. Trailing parameters, so three-parameter
   builders still work.

## What consumers do with the tree

- dash.js `DashParser.processNode`: converts every attribute through matchers (`<S>` straight to
  `parseInt`), maps children to named properties and arrays (`arrayNodes` list), attaches `tagName`,
  `__text`, `__prefix`, `__children`; `PatchManifestModel` relies on `__children` order. Inheritance
  (objectiron) runs afterwards and does not need XML.
- shaka-player: own tXml fork, tree then `findChildren`/`parseAttr` walk. Not a CML consumer.
- cmaf-ham sample: xml2js (tree on sax-js) injected through `setDashParser`.
- `@svta/cml-drm` PlayReady helpers: `parseXml` + `getElementsByName` on tiny documents.
- hls.js: uses cml-cmcd, id3, sfv, utils; no XML.

## Measurement insights (tables in `benchmark.md`, code in `prototype.md`)

- **Where dash.js's time goes.** On the 100k `<S>` stress manifest the shipped `parseXml` is about 29 ms
  and `processNode` about 23 ms. A straight port of `processNode` into a builder removes the tree and the
  walk but keeps the per-node conversion (matcher chain, keyed stores, `arrayNodes.indexOf`), so it lands
  around -25 to -35 percent, not 2x. A builder that uses the freedom the API gives (a dedicated `<S>`
  branch, a `Set`) is what reaches the range dash.js prototyped, and that specialization now lives in the
  player instead of in `parseXml`.
- **Per-parse instance state deoptimizes the scanner after every full GC.** V8 tracks field constness per
  hidden class and hidden-class transitions are weak. An `XmlParser` instance created per parse gets a
  fresh hidden class after each full GC (the previous instance is dead), and the first reassignment of a
  field the constructor initialized ("dependent field type constness changed") invalidates every function
  compiled against it. With the scanner reading and writing instance fields it never kept optimized code:
  6 ms per parse of the 170 KB livesim2 manifest after a forced full GC against 0.9 ms with natural GC.
  Isolating `scan` (primitives, arrays, a literal-created slots object; the stack top is the current
  element) brought it to 0.8 ms in both regimes. Found with `--trace-opt --trace-deopt
  --trace-generalization`.
- **Reading one past the end poisons type feedback.** `charCodeAt(length)` returns `NaN`; once `cc` has
  been `NaN`, V8 compiles every comparison on it as a floating-point compare for the rest of the process.
  Whole-string hits it once per document, chunked once per chunk. Guarding every advance made
  whole-string tokenization about 19 percent faster and removed a 2x penalty on chunked input.
- **Rope strings.** `carry + chunk` yields a V8 `ConsString`; the scanner reads it about 25 percent slower
  than a flat string even after the one-time flatten. `[carry, chunk].join('')` yields a flat string.
- **Type-feedback contamination.** One `scan` driven by many builder shapes, or by both flat and cons input
  strings, in one process ran every variant of the earlier prototype 30 to 65 percent slower.
  Consequences: copy builder callbacks into a fixed-shape slots object, keep per-parse state out of the
  scanner, and benchmark one variant per process. With the final structure the interleaved run keeps the
  per-process ordering, inflated about 20 percent by shared garbage. The first,
  interleaved benchmark run was wrong for this reason, and so was the #424 investigation's conclusion that
  per-call closures lose optimized code after a full GC: measured one variant per process, the shipped
  parser goes from 1.3 ms to 1.7 ms under forced GC on the livesim2 manifest, not 4x.
- **Attribute records vs callbacks.** Per-attribute callbacks save a few milliseconds on the stress case
  but are incompatible with the carry model (an element would be created before its tag is known
  complete) and force consumers to build the element before seeing its attributes. Not proposed; the
  specialized `<S>` branch recovers most of the gain within the record contract.
- **Machine.** MacBook Pro M1 Pro, Node 24.16, on battery with Low Power Mode on, load average 8 to 10
  during parts of the session. Absolute numbers are indicative; relative numbers within a run are what
  the RFC relies on.

## Bundle size (tsdown --minify, utils external)

| Bundle | Minified | Gzipped |
|---|---:|---:|
| `parseXml` today | 2,372 B | 1,109 B |
| Whole `@svta/cml-xml` today | 2,873 B | 1,347 B |
| `XmlParser` alone | 3,856 B | 1,479 B |
| `XmlParser` plus the `parseXml` builder | 4,724 B | 1,810 B |

## Platform notes

- `scheduler.yield()`: Chromium since 2024, Firefox since August 2025, not in Safari as of 2026-09; use
  a `setTimeout` fallback (sources: MDN and caniuse `mdn-api_scheduler_yield`).
- `pipeTo(new WritableStream(...))` and `TextDecoderStream` are available in all evergreen browsers and
  in Node 24, so the streamed-fetch example runs unchanged in tests.
- dash.js loads manifests as one string through `URLLoader` (XHR or fetch) and then calls the parser;
  streamed parsing would need a loading-path change on their side, time-slicing would not.

## Out of scope, noted

- `libs/xml/README.md` shows a non-existent `decodeXml`; fix in the implementation PR.
- PR #430 (truncation fixes; malformed attributes and mismatched or document-level close tags throw) is
  open and changes the tolerance behaviors this prototype mirrors from `main`; the parity corpus must be
  recaptured after it lands and the prototype's final-mode semantics re-verified against it.
