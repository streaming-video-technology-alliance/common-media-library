# Prototype

The executable prototype is in `prototype/`. It runs against `main` after #432 with Node 24. There is no
build step, and the repository's lint and typecheck cover it. It is the reference for the implementation
steps. Phase one is the scope of the RFC: the builder contract and `parseXmlWith`.

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

A bundle that imports only `parseXml` grows by about 450 bytes gzipped. The scanner carries the
strict-mode branches, the NameStartChar test, the quoted-literal doctype scan, the skip checks, and
`XmlParseError` for both entry points, and the tree builder grows from four to eight variants. A bundle
that imports only `parseXmlWith` is about 150 bytes gzipped larger than today's `parseXml` bundle, and it
has no tree builder.

## Performance notes for the port

- The scanner takes only primitives, the two stack arrays, and the builder object. It writes nothing to
  a per-parse object. #432 chose this shape for a reason: V8 gives an object that is created per parse a
  new hidden class after every full GC, and the first write to a field that the constructor initialized
  deoptimizes every function compiled against that class. The `parseXmlWith` wrapper keeps the same
  shape.
- Every character read is guarded (`cc = ++pos < length ? input.charCodeAt(pos) : 0`). If the scanner
  reads one character past the end even once, V8 compiles every comparison on that variable as a
  floating-point compare.
- Builders should be module-level constants, so that the functions the scanner calls are the same on
  every parse. `parseXml` prebuilds its eight variants. An application that uses `parseXml` and one
  custom builder drives the same scanner with two builders. The two-builder pairs in `benchmark.md`
  measure that case.
- The scanner reads the builder's callbacks into local variables once per scan, and skipping is a
  `current !== undefined` check at each callback site. These checks, the name arguments, and the
  untrimmed text policy are in the main loop. Their total cost is the `parseXml` difference between
  `main` and the phase-one scanner in `benchmark.md`.
- Module scope has no side effects: numeric constants, functions, and the prebuilt builders behind
  `/* @__PURE__ */`.

## Known deviations

`prototype/parseXml.ts` produces the same tree as `main` for every corpus input except the eight listed
in `equivalence.md`. Those eight are the intended grammar fixes and shape changes. One of them is a side
effect, not a goal: because comments are delivered as inner text, the tree builder cannot reproduce the
delimiters of a comment that has no inner text (`<!--->`) or that is cut off by the end of the input. It
reports both with a closing `-->`. This shows only with `keepComments`.

## The streaming prototype

The first revision of this design record had a JavaScript prototype of the incremental parser
(`write`/`end`, carry across chunks). Its findings are summarized under "Deferred: incremental input" in
`findings.md`. The code is in this file's history (commit 8eb767e), for the phase-two RFC.
