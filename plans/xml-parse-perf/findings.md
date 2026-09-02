# parseXml performance investigation (issue #424)

Issue: https://github.com/streaming-video-technology-alliance/common-media-library/issues/424
Upstream: https://github.com/Dash-Industry-Forum/dash.js/issues/4984

Environment: Apple M1 Pro, macOS 26.6.2, Node v24.16.0, `@svta/cml-xml` 1.1.6 built from this worktree.
Methodology: synthetic MPD with 50 Periods x 4 AdaptationSets x 500 `<S>` (100,000 `<S>`), 4 warm-up
iterations, 20 measured iterations interleaved across variants, `gc()` forced before each iteration unless
marked "natural GC". See `benchmark.md` for the generator and harness.

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

## Flat rewrite (prototype in `prototype.md`)

A non-recursive parser with an explicit element stack and `charCodeAt`-only scanning for text, names and
attribute values (`indexOf` only for comments, CDATA, doctype, close tags). Same output on all 192
equivalence checks. Source is 5.6 KB vs 6.1 KB for the current parseXml region of the bundle.

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

Benchmark artifact worth knowing: with a forced full GC before every call, the current closure-based parser
takes 4.85 ms on the 148 KB input (4x its natural-GC time) while the flat version stays at 0.83 ms.
`--no-flush-bytecode` does not remove the effect. The per-call inner closures appear to lose optimized code
after a full GC; the flat design has one module-level function and is unaffected. A player that refreshes a
manifest every few seconds with GCs in between may see the same penalty, but this was not measured in a browser.

## Robustness bugs found on the way

The shipped parser loops forever (killed by SIGALRM after 3 s) on:

- attribute without a quoted value or document truncated mid-attribute: `<a b>`, `<a b=c/>`, `<a b="c" d>`, `<S d="180000" r`, `<a b="c"><d e/></a>`
- XML declaration without `>`: `<?xml version="1.0" encoding="UTF-8"` (`indexOf` returns -1, `pos++` restarts at 0)
- close tag without `>`: `<a></a`, `<a>x</a` (`pos` becomes -1 and parsing restarts)

Truncations that already terminate: `<a>text`, `<a x="1"`, `<a><![CDATA[x`, `<!-- x`, `<!DOCTYPE html`,
`<MPD><Period><S d="1` (throws "Missing closing quote"). The flat prototype terminates on all of the above,
yielding `""` for valueless attributes.

## Recommendation

1. Fix the three hangs first (small, independent PR; tasks were spawned from this session).
2. Replace the parser body with the flat design: identical output, -18% to -30% on the stress case, -32% on
   a realistic large manifest, no recursion depth limit, no closure re-optimization penalty. Ship with the
   equivalence corpus as tests and a repeatable benchmark (see `steps.md`).
3. If dash.js still wants 2x or more, that requires not building the XmlNode tree at all: propose a visitor
   or streaming API as an RFC (`rfc/`), letting the consumer build its final structures in one pass. The
   tokenization floor measured here (~13 to 22 ms for 3.4 MB depending on scanning strategy) bounds the gain.
4. Do not add DASH-specific `<S>` handling to `parseXml`: it measured -5.6% and breaks the string contract.
