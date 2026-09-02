# Benchmark methodology

Corrected 2026-09-02 after the RFC design session. The first version of this file interleaved variants
within one process; that contaminates V8 type feedback across variants and inverted results in one run
(every variant 30 to 65 percent slower than the shipped parser, while the same code measured one variant
per process was faster). The harness that implements the method below, and the full result tables for the
aligned scanner, are in `plans/xml-incremental-parser/benchmark.md`.

## Method

- One process per (variant, input) pair. A driver spawns `node bench.mjs --run=<variant>,<input>` for
  each pair and aggregates the JSON each worker prints. Never compare variants measured in a shared
  process; builders of different shape and strings of different kind (flat, sliced, cons) both poison
  the feedback of the shared scanner.
- Each process: build the input, 4 warm-up calls, then N measured calls (60 on the 100k `<S>` inputs,
  300 on the ~150 KB inputs, 3000 on the 3 KB fixture), `performance.now()` around each call, median and
  p95. Sink every result into a variable so nothing is dead-code eliminated.
- Natural GC is the primary table. A second run with `--expose-gc` and `gc()` before every measured call
  (20 iterations on the large inputs) is the regime a player is in between manifest refreshes and is
  reported alongside, never instead. Forced GC exposes structural problems (per-parse instance state in
  the scanner cost 6x in that regime) rather than steady-state throughput.
- Chunked variants, when the `XmlParser` rows are added, receive pre-split flat strings (a `Buffer` round
  trip per chunk), which is what `TextDecoderStream` hands a consumer; splitting is not timed.
- Report Node version, chip, and power state. On the session machine (M1 Pro, Node 24.16) battery plus
  Low Power Mode moved absolute numbers by about 20 percent; relative numbers within one table are what
  matter.

## Inputs

| Input | Size | Notes |
|---|---:|---|
| pretty `/>`, 100k S | 3,679,679 chars | 50 Periods x 4 AdaptationSets x 500 `<S ... />`, two-space indent, `<S>` at depth 5 |
| minified `/>`, 100k S | 2,569,576 chars | same without whitespace |
| pretty `</S>`, 100k S | 3,879,679 chars | `<S ...></S>` as livesim2 (Go encoding/xml) emits; never specialize on the self-closing form |
| livesim2 real, 5,402 S | 169,721 chars | `segtimeline_1/tsbd_21600/testpic_2s/Manifest.mpd`, fetched 2026-09-02; check in as a fixture |
| livesim2-scale 60x2x20 `</S>` | 148,451 chars | approximates the `periods_60` manifest |
| bbb_30fps.mpd | 3,060 chars | package test fixture |

Generator: the `<S>` forms cycle through `<S t d />`, `<S d r="14" />`, `<S d r="-1" k="3" />`, `<S d />`;
video AdaptationSets carry a 7-attribute `<Representation>`, audio ones 4; `pretty` and `closed` switches.
The issue's own file was 2,813,392 bytes with shallower indentation.

## Reference numbers

Aligned scanner prototype against the shipped parser (`main` at d74cac3ad), one process per variant,
natural GC, medians. Detail and the forced-GC and interleaved tables in
`plans/xml-incremental-parser/benchmark.md`.

| Input | Shipped `parseXml` | Aligned scanner, tree builder |
|---|---:|---:|
| pretty `/>`, 100k S | 28.3 ms | 20.1 ms (-29%) |
| minified `/>`, 100k S | 23.6 ms | 17.8 ms (-25%) |
| pretty `</S>`, 100k S | 30.3 ms | 22.3 ms (-27%) |
| livesim2 real | 1.29 ms | 0.84 ms (-35%) |
| livesim2-scale | 1.16 ms | 0.73 ms (-37%) |
| bbb_30fps.mpd | 0.023 ms | 0.015 ms (-35%) |

## Equivalence corpus

Maintained in `plans/xml-incremental-parser/equivalence.md`: about 60 inputs (synthetic manifests in three
forms, both fixtures, the real livesim2 manifest, and hand-written cases for entities, CDATA, comments,
doctype, namespaces, whitespace, truncation, and malformed attributes) times six option sets. Expectations
must be recaptured from `main` after #430, which turned malformed attributes, mismatched close tags, and
document-level close tags into errors.

## Where to put it

`libs/xml/bench/` with a `bench` npm script. Keep it out of the `**/*.test.ts` glob; `eslint .` lints
everything except `dist`, so the harness must pass lint too.
