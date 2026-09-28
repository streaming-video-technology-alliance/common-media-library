# parseXml performance investigation (issue #424)

Issue: https://github.com/streaming-video-technology-alliance/common-media-library/issues/424
Upstream: https://github.com/Dash-Industry-Forum/dash.js/issues/4984

Status (2026-09-02): implemented by #432 as planned in `steps.md`. The tables below were measured with an
interleaved harness during the investigation and are indicative (see "Superseded and corrected findings");
the shipped scanner's numbers are in #432 and reproducible with `npm run bench -w libs/xml`. The fused
prototype and the benchmark methodology this folder once carried were removed when #432 landed: the
prototype was superseded by `plans/xml-incremental-parser/prototype.md` and `libs/xml/src/scan.ts`, the
methodology by `libs/xml/bench/bench.ts`.

Environment: Apple M1 Pro, macOS 26.6.2, Node v24.16.0, `@svta/cml-xml` 1.1.6 built from this worktree.
Methodology: synthetic MPD with 50 Periods x 4 AdaptationSets x 500 `<S>` (100,000 `<S>`), 4 warm-up
iterations, 20 measured iterations interleaved across variants, `gc()` forced before each iteration unless
marked "natural GC". (Interleaving variants in one process was later found to contaminate V8 type
feedback across them; the deltas below are indicative and were re-measured one variant per process for
the aligned scanner, see "Superseded and corrected findings".) The harness now lives in `libs/xml/bench/`
with the corrected one-process-per-variant method.

## Baseline reproduction

| Input | Bytes | Median parse |
| --- | ---: | ---: |
| pretty-printed, `<S ... />` (issue case) | 3,469,548 | 34.6 ms |
| minified, `<S ... />` | 2,359,445 | 29.9 ms |
| pretty-printed, `<S ...></S>` (livesim2 style) | 3,669,548 | 35.5 ms |
| livesim2-scale: 60 Periods x 2 AS x 20 S, `</S>` | 148,698 | 1.2 ms (natural GC) |

The issue reports 29.0 ms median for 1.1.6 on Node 20 with a 2.8 MB input; the difference is indentation depth.

Note: livesim2 (Go `encoding/xml`) emits `<S t=".." d=".." r=".."></S>` with explicit close tags, not
self-closing elements. Any optimization must target per-element cost in general, not the `/>` form.

## Where the time goes

CPU profile with TurboFan inlining disabled (150 parses of the pretty input), self time:

| Function | Self |
| --- | ---: |
| parseAttributes | 36.4% |
| (garbage collector) | 14.0% |
| parseNode | 13.7% |
| parseChildren | 8.1% |
| parseName | 7.8% |
| parseString | 7.6% |
| parseText | 6.2% |
| unescapeHtml | 4.9% |

GC time is collection of previous parses' trees, not intrinsic: running with `--max-semi-space-size=256`
(no scavenges during a parse) changed the median by 0%.

Ceiling measurements (pretty input, median vs baseline 33.7 ms). These variants change output and exist only
to bound what a given idea could save:

| Measurement | Delta | Meaning |
| --- | ---: | --- |
| `attributes.x = value` instead of `attributes[name] = value` | -12.7% | keyed property stores cost ~4 ms and are inherent to the output shape |
| shared frozen empty `childNodes` array | -1.4% | not worth a behavior change |
| tokenize only, no tree (SAX callbacks, indexOf-based) | -33.4% | tokenization is ~2/3 of the cost, tree construction ~1/3 |
| `<S>` attributes parsed to numbers inside the parser (saxDash) | -5.6% | DASH-specific handling barely pays inside parseXml |

The dash.js 2x (39.8 ms to 19.1 ms) came from deleting their own second pass over 100k `<S>` nodes, not from
the XML tokenizer. That gain is only reachable from CML through an API that lets the consumer build final
structures in one pass (see recommendation 3).

## Single-change experiments (output identical, verified)

Each variant is one edit to the shipped `dist/index.js`. Equivalence to the shipped parser was checked with
`assert.deepStrictEqual` over 32 inputs (synthetic, both fixtures, entities, CDATA, comments, doctype,
namespaces, mixed content, NBSP, truncations) x 6 option sets (default, keepWhitespace, keepComments,
includeParentElement, all three, `pos`): 0 mismatches.

| Variant | pretty | minified | Verdict |
| --- | ---: | ---: | --- |
| skip whitespace-only text gaps without slice/unescape/trim | +2.5% | 0% | slower; V8 builtins already win |
| `unescapeHtml` only when value contains `&` | -0.8% | -0.2% | no gain; utils already has that fast path |
| localize `pos` in parseName loop | +0.4% | -0.3% | no gain |
| `charCodeAt` quote detection in parseString | +0.2% | +0.3% | no gain |
| `Uint8Array` table instead of `Set.has` in parseName | -5.9% | -9.6% | real |
| compare chain instead of `Set.has` in parseName | -4.9% | -9.1% | real, no module-scope side effect |
| compare chain + colon detected during tag-name scan | -9.7% | -14.6% | real |
| above + bounded attribute-value scan (hang fix) | -12.0% | -13.5% | "best" micro-variant, ~3 small diffs |

## Flat rewrite (fused prototype, removed from this folder when #432 landed)

A non-recursive parser with an explicit element stack and `charCodeAt`-only scanning for text, names and
attribute values (`indexOf` only for comments, CDATA, doctype, close tags). Same output on all 192
equivalence checks. Source was 5.6 KB vs 6.1 KB for the parseXml region of the bundle at the time. The
shipped scanner, `libs/xml/src/scan.ts`, was ported from `plans/xml-incremental-parser/prototype.md` instead
(see `steps.md`).

| Input | Baseline | best | flat | Method |
| --- | ---: | ---: | ---: | --- |
| pretty `/>` 3.4 MB | 34.6 ms | 30.4 (-12.0%) | 28.1 (-18.6%) | forced GC, 20 iter |
| minified `/>` 2.4 MB | 29.4 ms | 25.4 (-13.5%) | 20.7 (-29.6%) | forced GC, 20 iter |
| pretty `</S>` 3.7 MB | 36.5 ms | 31.8 (-12.9%) | 30.0 (-17.9%) | forced GC, 20 iter |
| pretty `/>` 3.4 MB | 29.0 ms | 26.6 (-8.4%) | 26.0 (-10.4%) | natural GC, 60 iter (noisy, p95 35/47/29) |
| minified `/>` 2.4 MB | 23.6 ms | 20.1 (-14.7%) | 13.9 (-41.1%) | natural GC, 60 iter |
| pretty `</S>` 3.7 MB | 30.4 ms | 33.5 (+10.1%) | 24.5 (-19.5%) | natural GC, 60 iter (noisy) |
| livesim2-scale 148 KB | 1.17 ms | 1.03 (-12.5%) | 0.80 (-32.0%) | natural GC, 300 iter |
| bbb_30fps.mpd 3 KB | 0.02 ms | 0.02 (-18.7%) | 0.01 (-34.4%) | natural GC, 3000 iter |

Benchmark artifact, superseded: the first version of this paragraph attributed a 4x forced-GC penalty on
the 148 KB input to the shipped parser's per-call closures. Measured one variant per process, the shipped
parser goes from 1.30 ms to 1.72 ms under forced GC on the livesim2 manifest, not 4x; the penalty came from
interleaving variants in one process. The GC trap that is real is per-parse instance state read and
written by the scanner, see "Superseded and corrected findings".

## Robustness bugs found on the way

The shipped parser loops forever (killed by SIGALRM after 3 s) on:

- attribute without a quoted value or document truncated mid-attribute: `<a b>`, `<a b=c/>`, `<a b="c" d>`, `<S d="180000" r`, `<a b="c"><d e/></a>`
- XML declaration without `>`: `<?xml version="1.0" encoding="UTF-8"` (`indexOf` returns -1, `pos++` restarts at 0)
- close tag without `>`: `<a></a`, `<a>x</a` (`pos` becomes -1 and parsing restarts)

Truncations that already terminate: `<a>text`, `<a x="1"`, `<a><![CDATA[x`, `<!-- x`, `<!DOCTYPE html`,
`<MPD><Period><S d="1` (throws "Missing closing quote"). The flat prototype terminates on all of the above,
yielding `""` for valueless attributes.

## Superseded and corrected findings (2026-09-02, RFC design session)

The RFC prototype (`plans/xml-incremental-parser/`) re-measured this work one variant per process and
found three things this file got wrong or did not know. `plans/xml-incremental-parser/findings.md` has
the detail; `steps.md` here records the outcome.

- **Interleaving contaminates.** Running several parser variants through one process poisons V8 type
  feedback (builder shapes, string kinds). One run inverted the result, every variant 30 to 65 percent
  slower than the shipped parser, while the same code one variant per process was faster. The tables above
  were measured interleaved; their deltas are indicative. The closure-based forced-GC penalty reported
  above was this artifact.
- **Per-parse instance state deoptimizes the scanner after every full GC.** V8 tracks field constness
  per hidden class and hidden-class transitions are weak, so an object created per parse gets a fresh
  hidden class after each full GC and the first field reassignment ("dependent field type constness
  changed") invalidates every function compiled against it. A scanner reading and writing such an object
  never kept optimized code: 6 ms per parse of the 170 KB livesim2 manifest after a forced full GC against
  0.9 ms natural. A scanner that takes only primitives, arrays, and a literal-created slots object takes
  0.8 ms in both regimes. The fused prototype was immune because it had no such object; the
  shipped scanner stays immune by construction.
- **Reading one past the end poisons type feedback.** `charCodeAt(length)` returns `NaN`; once the
  character variable has been `NaN`, V8 compiles every comparison on it as a floating-point compare for
  the rest of the process. The fused prototype did this once per parse, as the shipped parser
  does. Guarding every advance (`cc = ++pos < length ? input.charCodeAt(pos) : 0`) made tokenization
  about 19 percent faster.
- **Rope strings.** Relevant once chunked input arrives with the RFC: `a + b` yields a V8 `ConsString`
  the scanner reads about 25 percent slower than a flat string; `[a, b].join('')` yields a flat one.

Re-measured with those fixes, one process per variant, natural GC: the aligned scanner building the same
`XmlNode` tree is 25 to 37 percent faster than the shipped parser across the six inputs (28.3 ms to
20.1 ms on the pretty stress input, 1.29 ms to 0.84 ms on the real livesim2 manifest), against 18 to 30
percent for the fused prototype. The shipped implementation (#432) measured 19 to 38 percent on the same six
inputs; the RFC prototype itself re-measured at 23.4 ms on the pretty input the same day on the same machine,
so the 20.1 ms figure was environmental.

## Recommendation

1. Done: the three hangs were fixed by #425 and #430, and #430 also made malformed attributes and
   mismatched or document-level close tags throw, which is now the parity target.
2. Done in #432: the parser body is the aligned scanner (`steps.md`), with identical output to `main` after
   #430, no recursion depth limit, immunity to the GC trap above, the equivalence corpus as tests, and the
   per-process benchmark under `libs/xml/bench/`.
3. The visitor or streaming API is now `rfc/xml-incremental-parser.md` (#431). It adds `XmlParser` on
   top of the same scanner; `parseXml` does not change again. Measured on the prototype, dash.js can
   reach 43 to 49 percent less time than today on the stress manifests by building its objects in one
   pass with a specialized `<S>` branch.
4. Do not add DASH-specific `<S>` handling to `parseXml`: it measured -5.6% and breaks the string
   contract. The builder API is where that specialization belongs.
