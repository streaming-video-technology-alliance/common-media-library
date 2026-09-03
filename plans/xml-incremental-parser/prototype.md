# Prototype

The executable prototype lives in `prototype/` and runs against `main` after #432 with Node 24 (no build
step; the repository's lint and typecheck cover it). It is the reference for the implementation steps.

| File | Contents |
|---|---|
| `prototype/scan.ts` | `libs/xml/src/scan.ts` plus the contract changes, each marked `RFC:` |
| `prototype/XmlBuilder.ts` | the proposed builder type: property syntax, `this: void`, `TElement`/`TDocument` |
| `prototype/XmlParseWithOptions.ts`, `prototype/parseXmlWith.ts` | the one-shot entry point, strict about truncated input |
| `prototype/XmlParseError.ts` | the error class with `offset`, `line`, `column` |
| `prototype/parseXml.ts` | `parseXml` on the new scanner, tolerant, trimming in the tree builder |
| `prototype/dash.ts` | the dash.js `processNode` port, the faithful one-pass builder, the lean builder |
| `prototype/equivalence.ts` | verification, see `equivalence.md` |
| `prototype/bench.ts` | benchmark, see `benchmark.md` |
| `prototype/index.ts` | the package surface after phase one, used for the size measurement |

## Bundle size

`tsdown --minify`, `@svta/cml-utils` external, each entry bundled alone:

| Entry | Minified | Gzipped |
|---|---:|---:|
| `parseXml` on `main` (#432) | 3,797 B | 1,494 B |
| whole `@svta/cml-xml` on `main` | 4,301 B | 1,734 B |
| `parseXml` on the phase-one scanner | 5,004 B | 1,947 B |
| `parseXmlWith` alone (scanner, `parseXmlWith`, `XmlParseError`) | 4,000 B | 1,640 B |
| whole package after phase one | 5,224 B | 2,012 B |

A `parseXml`-only bundle grows by about 450 bytes gzipped. The scanner carries the strict-mode branches,
the NameStartChar test, the quoted-literal doctype scan, the skip checks, and `XmlParseError` for both
entry points, and the tree builder grows from four to eight variants. A `parseXmlWith`-only bundle is about
150 bytes gzipped larger than `parseXml` is on `main` today and carries no tree builder.

## Performance notes for the port

- The scanner takes only primitives, the two stack arrays, and the builder object, and writes nothing
  back to a per-parse object. #432 established this shape and its reason: an object created per parse
  gets a fresh V8 hidden class after every full GC, and the first reassignment of a field the
  constructor initialized deoptimizes every function compiled against it. The `parseXmlWith` wrapper keeps to
  that shape.
- Every character read is guarded (`cc = ++pos < length ? input.charCodeAt(pos) : 0`); reading one past
  the end once makes V8 compile every comparison on that variable as a floating-point compare.
- Builders should be module-level constants so the call targets inside the scanner are stable across
  parses. `parseXml` prebuilds its eight variants. Applications that use `parseXml` and one custom builder
  drive the same scanner with two builders; the two-builder pairs in `benchmark.md` measure that case.
- The `current !== undefined` skip checks, the name arguments, and the untrimmed text policy are on the
  hot path. Their aggregate cost is the `parseXml` delta between `main` and the phase-one scanner in
  `benchmark.md`.

## Known deviations

`prototype/parseXml.ts` produces the same tree as `main` for every corpus input except the eight listed in
`equivalence.md`, which are the intended grammar fixes and shape changes. One of them is a consequence
rather than a goal: because comments are delivered as inner text, the tree builder cannot reproduce the
delimiters of a comment that has none (`<!--->`) or that is cut off by the end of the input, and reports
both with a closing `-->`. This only shows with `keepComments`.

## The streaming prototype

The first revision of this design record held a JavaScript prototype of the incremental parser
(`write`/`end`, carry across chunks). Its findings are summarized under "Deferred: incremental input" in
`findings.md`, and the code is in this file's history (commit 8eb767e) for the phase-two RFC.
