# Benchmark methodology and results

## Method

- One process per (variant, input) pair. A single process that runs several builders, or both whole and
  chunked input, through the one `scan` function contaminates V8's type feedback and slows every variant
  by 30 to 65 percent (see `findings.md`); the interleaved table at the end shows that effect on purpose.
- Each process: build the input, 4 warm-up calls, then N measured calls (60 for the 100k `<S>` inputs,
  300 for the ~150 KB inputs, 3000 for the 3 KB fixture), `performance.now()` around each call, median
  and p95 reported. Forced-GC runs call `gc()` before every measured call with `--expose-gc` and use 20
  iterations on the large inputs.
- Baselines: the shipped `parseXml` (main at d74cac3ad, 1.1.6 plus #425) for tree variants; the shipped
  `parseXml` plus a faithful port of dash.js `processNode` (matchers, `arrayNodes`, `__children`) for the
  dash.js variants.
- Chunked variants receive pre-split flat strings (a `Buffer` round trip per chunk), which is what
  `TextDecoderStream` hands a consumer; splitting is not timed.
- Machine: MacBook Pro M1 Pro, macOS 26.6, Node v24.16.0, on battery with Low Power Mode on. Relative
  numbers within one table are what matters.

## Inputs

| Input | Size | Notes |
|---|---:|---|
| pretty `/>`, 100k S | 3,679,679 chars | 50 Periods x 4 AdaptationSets x 500 `<S ... />`, two-space indent, `<S>` at depth 5 |
| minified `/>`, 100k S | 2,569,576 chars | same without whitespace |
| pretty `</S>`, 100k S | 3,879,679 chars | `<S ...></S>` as livesim2 (Go encoding/xml) emits |
| livesim2 real, 5402 S | 169,721 chars | `segtimeline_1/tsbd_21600/testpic_2s/Manifest.mpd`, fetched 2026-09-02 |
| livesim2-scale 60x2x20 `</S>` | 148,451 chars | approximates the `periods_60` manifest |
| bbb_30fps.mpd | 3,060 chars | package test fixture |

The generator follows `plans/xml-parse-perf/benchmark.md`; the `<S>` forms cycle through
`<S t d />`, `<S d r="14" />`, `<S d r="-1" k="3" />`, `<S d />`.

## Results

### Natural GC, one process per variant (primary)

#### pretty />, 100k S (3,679,679 chars, 60 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml shipped (1.1.6 + #425) | 28.3 ms | 38.6 ms | baseline |
| parseXml on XmlParser | 20.1 ms | 33.0 ms | -28.9% |
| parseXml on XmlParser, 64 KB chunks | 17.9 ms | 31.7 ms | -36.7% |
| parseXml on XmlParser, 16 KB chunks | 18.1 ms | 34.3 ms | -35.9% |
| tokenize + attribute records, no tree | 17.4 ms | 18.4 ms | -38.6% |
| tokenize only (attribute callbacks, no-op) | 14.7 ms | 15.4 ms | -48.1% |
| dash.js today: shipped parseXml + processNode | 51.4 ms | 62.5 ms | baseline |
| dash.js on new parseXml + processNode | 44.5 ms | 56.5 ms | -13.4% |
| dash.js one pass (builder) | 34.8 ms | 42.9 ms | -32.3% |
| dash.js one pass, tuned builder (S branch, Set) | 29.0 ms | 33.2 ms | -43.7% |
| dash.js one pass, attribute callbacks variant | 29.6 ms | 38.9 ms | -42.4% |
| dash.js one pass, 64 KB chunks | 35.2 ms | 43.5 ms | -31.6% |
| dash.js one pass, 16 KB chunks | 34.8 ms | 44.5 ms | -32.3% |
| dash.js one pass, tuned builder, 64 KB chunks | 26.6 ms | 29.7 ms | -48.3% |

#### minified />, 100k S (2,569,576 chars, 60 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml shipped (1.1.6 + #425) | 23.6 ms | 44.2 ms | baseline |
| parseXml on XmlParser | 17.8 ms | 65.2 ms | -24.9% |
| parseXml on XmlParser, 64 KB chunks | 15.7 ms | 30.5 ms | -33.8% |
| parseXml on XmlParser, 16 KB chunks | 17.8 ms | 33.1 ms | -24.7% |
| tokenize + attribute records, no tree | 13.5 ms | 14.0 ms | -42.8% |
| tokenize only (attribute callbacks, no-op) | 10.8 ms | 11.7 ms | -54.5% |
| dash.js today: shipped parseXml + processNode | 47.5 ms | 57.1 ms | baseline |
| dash.js on new parseXml + processNode | 35.7 ms | 50.4 ms | -24.8% |
| dash.js one pass (builder) | 29.7 ms | 43.2 ms | -37.5% |
| dash.js one pass, tuned builder (S branch, Set) | 24.5 ms | 29.6 ms | -48.5% |
| dash.js one pass, attribute callbacks variant | 27.7 ms | 31.4 ms | -41.8% |
| dash.js one pass, 64 KB chunks | 29.9 ms | 38.9 ms | -37.1% |
| dash.js one pass, 16 KB chunks | 30.2 ms | 35.9 ms | -36.5% |
| dash.js one pass, tuned builder, 64 KB chunks | 23.4 ms | 30.6 ms | -50.8% |

#### pretty </S>, 100k S (3,879,679 chars, 60 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml shipped (1.1.6 + #425) | 30.3 ms | 40.3 ms | baseline |
| parseXml on XmlParser | 22.3 ms | 38.6 ms | -26.5% |
| parseXml on XmlParser, 64 KB chunks | 19.7 ms | 32.8 ms | -35.0% |
| parseXml on XmlParser, 16 KB chunks | 19.8 ms | 34.1 ms | -34.5% |
| tokenize + attribute records, no tree | 19.2 ms | 19.8 ms | -36.5% |
| tokenize only (attribute callbacks, no-op) | 16.4 ms | 17.2 ms | -45.8% |
| dash.js today: shipped parseXml + processNode | 54.0 ms | 66.7 ms | baseline |
| dash.js on new parseXml + processNode | 46.3 ms | 57.8 ms | -14.3% |
| dash.js one pass (builder) | 37.1 ms | 48.6 ms | -31.2% |
| dash.js one pass, tuned builder (S branch, Set) | 30.7 ms | 34.4 ms | -43.1% |
| dash.js one pass, attribute callbacks variant | 31.8 ms | 40.5 ms | -41.0% |
| dash.js one pass, 64 KB chunks | 36.5 ms | 43.4 ms | -32.4% |
| dash.js one pass, 16 KB chunks | 36.1 ms | 42.1 ms | -33.1% |
| dash.js one pass, tuned builder, 64 KB chunks | 28.2 ms | 33.4 ms | -47.8% |

#### livesim2 real, 5402 S (169,721 chars, 300 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml shipped (1.1.6 + #425) | 1.29 ms | 1.71 ms | baseline |
| parseXml on XmlParser | 0.841 ms | 1.37 ms | -34.9% |
| parseXml on XmlParser, 64 KB chunks | 0.833 ms | 1.35 ms | -35.5% |
| parseXml on XmlParser, 16 KB chunks | 0.826 ms | 1.41 ms | -36.1% |
| tokenize + attribute records, no tree | 0.758 ms | 0.980 ms | -41.3% |
| tokenize only (attribute callbacks, no-op) | 0.619 ms | 0.832 ms | -52.1% |
| dash.js today: shipped parseXml + processNode | 1.93 ms | 2.45 ms | baseline |
| dash.js on new parseXml + processNode | 1.45 ms | 2.06 ms | -24.6% |
| dash.js one pass (builder) | 1.31 ms | 1.96 ms | -32.2% |
| dash.js one pass, tuned builder (S branch, Set) | 1.14 ms | 1.63 ms | -40.9% |
| dash.js one pass, attribute callbacks variant | 1.14 ms | 1.61 ms | -41.0% |
| dash.js one pass, 64 KB chunks | 1.32 ms | 1.94 ms | -31.4% |
| dash.js one pass, 16 KB chunks | 1.32 ms | 1.86 ms | -31.4% |
| dash.js one pass, tuned builder, 64 KB chunks | 1.15 ms | 1.70 ms | -40.4% |

#### livesim2-scale 60x2x20 </S> (148,451 chars, 300 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml shipped (1.1.6 + #425) | 1.16 ms | 1.55 ms | baseline |
| parseXml on XmlParser | 0.733 ms | 1.17 ms | -36.7% |
| parseXml on XmlParser, 64 KB chunks | 0.733 ms | 1.18 ms | -36.7% |
| parseXml on XmlParser, 16 KB chunks | 0.739 ms | 1.12 ms | -36.2% |
| tokenize + attribute records, no tree | 0.789 ms | 0.965 ms | -31.9% |
| tokenize only (attribute callbacks, no-op) | 0.619 ms | 0.769 ms | -46.5% |
| dash.js today: shipped parseXml + processNode | 1.90 ms | 2.53 ms | baseline |
| dash.js on new parseXml + processNode | 1.44 ms | 1.99 ms | -24.0% |
| dash.js one pass (builder) | 1.37 ms | 1.82 ms | -27.7% |
| dash.js one pass, tuned builder (S branch, Set) | 1.25 ms | 1.74 ms | -34.2% |
| dash.js one pass, attribute callbacks variant | 1.29 ms | 1.83 ms | -31.9% |
| dash.js one pass, 64 KB chunks | 1.36 ms | 2.18 ms | -28.4% |
| dash.js one pass, 16 KB chunks | 1.36 ms | 1.97 ms | -28.3% |
| dash.js one pass, tuned builder, 64 KB chunks | 1.24 ms | 1.68 ms | -34.8% |

#### bbb_30fps.mpd (3,060 chars, 3000 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml shipped (1.1.6 + #425) | 0.023 ms | 0.033 ms | baseline |
| parseXml on XmlParser | 0.015 ms | 0.019 ms | -34.8% |
| parseXml on XmlParser, 64 KB chunks | 0.015 ms | 0.019 ms | -33.3% |
| parseXml on XmlParser, 16 KB chunks | 0.015 ms | 0.020 ms | -34.2% |
| tokenize + attribute records, no tree | 0.015 ms | 0.020 ms | -35.3% |
| tokenize only (attribute callbacks, no-op) | 0.009 ms | 0.012 ms | -59.9% |
| dash.js today: shipped parseXml + processNode | 0.039 ms | 0.051 ms | baseline |
| dash.js on new parseXml + processNode | 0.031 ms | 0.040 ms | -19.6% |
| dash.js one pass (builder) | 0.032 ms | 0.041 ms | -18.2% |
| dash.js one pass, tuned builder (S branch, Set) | 0.031 ms | 0.044 ms | -20.1% |
| dash.js one pass, attribute callbacks variant | 0.031 ms | 0.046 ms | -19.3% |
| dash.js one pass, 64 KB chunks | 0.031 ms | 0.045 ms | -19.8% |
| dash.js one pass, 16 KB chunks | 0.031 ms | 0.040 ms | -19.6% |
| dash.js one pass, tuned builder, 64 KB chunks | 0.031 ms | 0.042 ms | -20.4% |

### Forced full GC before every call, one process per variant

A full GC before each parse is the regime a player is in between manifest refreshes. The tree path on the new core stays close to its natural-GC time because the scanner keeps no per-parse state (see `prototype.md`, Performance notes). The earlier prototype with state on the instance took 6 ms instead of 0.9 ms on the livesim2 manifest in this regime.

#### pretty />, 100k S (3,679,679 chars, 20 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml shipped (1.1.6 + #425) | 38.9 ms | 42.1 ms | baseline |
| parseXml on XmlParser | 33.2 ms | 33.9 ms | -14.7% |
| parseXml on XmlParser, 64 KB chunks | 19.5 ms | 50.3 ms | -49.8% |
| parseXml on XmlParser, 16 KB chunks | 19.6 ms | 28.2 ms | -49.5% |
| tokenize + attribute records, no tree | 28.7 ms | 29.1 ms | -26.2% |
| tokenize only (attribute callbacks, no-op) | 26.6 ms | 28.3 ms | -31.5% |
| dash.js today: shipped parseXml + processNode | 56.5 ms | 75.6 ms | baseline |
| dash.js on new parseXml + processNode | 50.9 ms | 67.4 ms | -9.9% |
| dash.js one pass (builder) | 44.4 ms | 47.3 ms | -21.5% |
| dash.js one pass, tuned builder (S branch, Set) | 40.3 ms | 49.2 ms | -28.8% |
| dash.js one pass, attribute callbacks variant | 40.8 ms | 137.7 ms | -27.9% |
| dash.js one pass, 64 KB chunks | 31.5 ms | 40.9 ms | -44.3% |
| dash.js one pass, 16 KB chunks | 31.4 ms | 70.8 ms | -44.4% |
| dash.js one pass, tuned builder, 64 KB chunks | 27.4 ms | 38.2 ms | -51.6% |

#### minified />, 100k S (2,569,576 chars, 20 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml shipped (1.1.6 + #425) | 35.4 ms | 37.6 ms | baseline |
| parseXml on XmlParser | 27.2 ms | 28.9 ms | -23.1% |
| parseXml on XmlParser, 64 KB chunks | 16.3 ms | 22.8 ms | -53.9% |
| parseXml on XmlParser, 16 KB chunks | 16.4 ms | 27.9 ms | -53.8% |
| tokenize + attribute records, no tree | 23.6 ms | 35.3 ms | -33.4% |
| tokenize only (attribute callbacks, no-op) | 20.5 ms | 22.9 ms | -42.0% |
| dash.js today: shipped parseXml + processNode | 51.3 ms | 56.7 ms | baseline |
| dash.js on new parseXml + processNode | 44.1 ms | 47.1 ms | -14.0% |
| dash.js one pass (builder) | 38.5 ms | 41.4 ms | -24.8% |
| dash.js one pass, tuned builder (S branch, Set) | 35.0 ms | 36.6 ms | -31.7% |
| dash.js one pass, attribute callbacks variant | 33.3 ms | 34.9 ms | -35.1% |
| dash.js one pass, 64 KB chunks | 27.8 ms | 35.1 ms | -45.8% |
| dash.js one pass, 16 KB chunks | 27.9 ms | 36.0 ms | -45.5% |
| dash.js one pass, tuned builder, 64 KB chunks | 24.2 ms | 35.3 ms | -52.8% |

#### pretty </S>, 100k S (3,879,679 chars, 20 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml shipped (1.1.6 + #425) | 41.2 ms | 45.2 ms | baseline |
| parseXml on XmlParser | 34.8 ms | 37.9 ms | -15.3% |
| parseXml on XmlParser, 64 KB chunks | 20.8 ms | 29.4 ms | -49.4% |
| parseXml on XmlParser, 16 KB chunks | 21.0 ms | 29.2 ms | -49.0% |
| tokenize + attribute records, no tree | 30.4 ms | 37.8 ms | -26.1% |
| tokenize only (attribute callbacks, no-op) | 27.9 ms | 38.5 ms | -32.2% |
| dash.js today: shipped parseXml + processNode | 58.3 ms | 62.7 ms | baseline |
| dash.js on new parseXml + processNode | 51.8 ms | 55.9 ms | -11.2% |
| dash.js one pass (builder) | 46.0 ms | 52.0 ms | -21.2% |
| dash.js one pass, tuned builder (S branch, Set) | 43.2 ms | 52.7 ms | -25.9% |
| dash.js one pass, attribute callbacks variant | 42.8 ms | 54.6 ms | -26.7% |
| dash.js one pass, 64 KB chunks | 32.7 ms | 44.1 ms | -43.9% |
| dash.js one pass, 16 KB chunks | 32.9 ms | 42.6 ms | -43.6% |
| dash.js one pass, tuned builder, 64 KB chunks | 28.5 ms | 37.9 ms | -51.1% |

#### livesim2 real, 5402 S (169,721 chars, 300 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml shipped (1.1.6 + #425) | 1.72 ms | 4.78 ms | baseline |
| parseXml on XmlParser | 0.919 ms | 1.25 ms | -46.5% |
| parseXml on XmlParser, 64 KB chunks | 0.941 ms | 1.26 ms | -45.2% |
| parseXml on XmlParser, 16 KB chunks | 0.969 ms | 1.32 ms | -43.6% |
| tokenize + attribute records, no tree | 0.820 ms | 1.15 ms | -52.3% |
| tokenize only (attribute callbacks, no-op) | 0.676 ms | 0.861 ms | -60.7% |
| dash.js today: shipped parseXml + processNode | 2.47 ms | 5.38 ms | baseline |
| dash.js on new parseXml + processNode | 1.60 ms | 2.03 ms | -35.3% |
| dash.js one pass (builder) | 1.43 ms | 1.77 ms | -41.9% |
| dash.js one pass, tuned builder (S branch, Set) | 1.69 ms | 9.82 ms | -31.4% |
| dash.js one pass, attribute callbacks variant | 1.25 ms | 1.55 ms | -49.3% |
| dash.js one pass, 64 KB chunks | 1.50 ms | 1.79 ms | -39.4% |
| dash.js one pass, 16 KB chunks | 1.49 ms | 1.73 ms | -39.6% |
| dash.js one pass, tuned builder, 64 KB chunks | 1.73 ms | 4.76 ms | -29.8% |

#### livesim2-scale 60x2x20 </S> (148,451 chars, 300 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml shipped (1.1.6 + #425) | 1.85 ms | 4.82 ms | baseline |
| parseXml on XmlParser | 1.02 ms | 1.22 ms | -45.0% |
| parseXml on XmlParser, 64 KB chunks | 0.870 ms | 1.10 ms | -53.1% |
| parseXml on XmlParser, 16 KB chunks | 0.856 ms | 1.00 ms | -53.8% |
| tokenize + attribute records, no tree | 0.908 ms | 1.02 ms | -51.0% |
| tokenize only (attribute callbacks, no-op) | 0.717 ms | 0.857 ms | -61.3% |
| dash.js today: shipped parseXml + processNode | 2.68 ms | 5.90 ms | baseline |
| dash.js on new parseXml + processNode | 1.82 ms | 2.00 ms | -32.1% |
| dash.js one pass (builder) | 1.65 ms | 1.83 ms | -38.5% |
| dash.js one pass, tuned builder (S branch, Set) | 1.69 ms | 9.01 ms | -37.2% |
| dash.js one pass, attribute callbacks variant | 1.57 ms | 1.74 ms | -41.4% |
| dash.js one pass, 64 KB chunks | 1.47 ms | 1.77 ms | -45.0% |
| dash.js one pass, 16 KB chunks | 1.47 ms | 1.64 ms | -45.2% |
| dash.js one pass, tuned builder, 64 KB chunks | 1.48 ms | 7.20 ms | -44.8% |

#### bbb_30fps.mpd (3,060 chars, 3000 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml shipped (1.1.6 + #425) | 0.129 ms | 0.162 ms | baseline |
| parseXml on XmlParser | 0.038 ms | 0.063 ms | -70.8% |
| parseXml on XmlParser, 64 KB chunks | 0.036 ms | 0.060 ms | -72.1% |
| parseXml on XmlParser, 16 KB chunks | 0.036 ms | 0.057 ms | -72.3% |
| tokenize + attribute records, no tree | 0.052 ms | 0.082 ms | -59.6% |
| tokenize only (attribute callbacks, no-op) | 0.029 ms | 0.048 ms | -77.8% |
| dash.js today: shipped parseXml + processNode | 0.169 ms | 0.234 ms | baseline |
| dash.js on new parseXml + processNode | 0.078 ms | 0.130 ms | -54.1% |
| dash.js one pass (builder) | 0.087 ms | 0.145 ms | -48.7% |
| dash.js one pass, tuned builder (S branch, Set) | 0.091 ms | 0.161 ms | -46.2% |
| dash.js one pass, attribute callbacks variant | 0.075 ms | 0.129 ms | -55.8% |
| dash.js one pass, 64 KB chunks | 0.091 ms | 0.168 ms | -46.3% |
| dash.js one pass, 16 KB chunks | 0.086 ms | 0.137 ms | -49.5% |
| dash.js one pass, tuned builder, 64 KB chunks | 0.084 ms | 0.141 ms | -50.5% |

### All variants interleaved in one process (contamination demonstration, natural GC)

One `scan` function driven by every builder and by both whole and chunked input in the same process. With the earlier prototype (state on the instance, no slots object) this inverted the result: every variant ran 30 to 65 percent slower than the shipped parser. With the final structure the relative ordering matches the per-process tables; absolute times are inflated by roughly 20 percent across the board by the garbage of fourteen variants sharing one heap, and the specialized builder loses its edge because its call sites are no longer monomorphic. Kept as the record of that effect.

#### pretty />, 100k S (3,679,679 chars, 60 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml shipped (1.1.6 + #425) | 34.3 ms | 44.2 ms | baseline |
| parseXml on XmlParser | 24.8 ms | 28.2 ms | -27.6% |
| parseXml on XmlParser, 64 KB chunks | 19.2 ms | 25.3 ms | -44.0% |
| parseXml on XmlParser, 16 KB chunks | 19.3 ms | 27.4 ms | -43.8% |
| tokenize + attribute records, no tree | 20.1 ms | 24.3 ms | -41.4% |
| tokenize only (attribute callbacks, no-op) | 14.2 ms | 20.4 ms | -58.8% |
| dash.js today: shipped parseXml + processNode | 51.2 ms | 60.6 ms | baseline |
| dash.js on new parseXml + processNode | 41.5 ms | 52.4 ms | -19.1% |
| dash.js one pass (builder) | 32.8 ms | 47.1 ms | -36.0% |
| dash.js one pass, tuned builder (S branch, Set) | 34.2 ms | 43.1 ms | -33.1% |
| dash.js one pass, attribute callbacks variant | 29.4 ms | 41.6 ms | -42.7% |
| dash.js one pass, 64 KB chunks | 32.8 ms | 46.5 ms | -35.9% |
| dash.js one pass, 16 KB chunks | 35.1 ms | 39.3 ms | -31.6% |
| dash.js one pass, tuned builder, 64 KB chunks | 28.0 ms | 35.0 ms | -45.4% |

#### minified />, 100k S (2,569,576 chars, 60 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml shipped (1.1.6 + #425) | 29.0 ms | 38.9 ms | baseline |
| parseXml on XmlParser | 18.7 ms | 25.8 ms | -35.4% |
| parseXml on XmlParser, 64 KB chunks | 19.7 ms | 26.6 ms | -32.0% |
| parseXml on XmlParser, 16 KB chunks | 16.3 ms | 23.3 ms | -43.8% |
| tokenize + attribute records, no tree | 13.2 ms | 21.5 ms | -54.5% |
| tokenize only (attribute callbacks, no-op) | 11.2 ms | 17.3 ms | -61.5% |
| dash.js today: shipped parseXml + processNode | 47.2 ms | 54.7 ms | baseline |
| dash.js on new parseXml + processNode | 39.4 ms | 54.0 ms | -16.4% |
| dash.js one pass (builder) | 31.6 ms | 44.0 ms | -33.0% |
| dash.js one pass, tuned builder (S branch, Set) | 31.0 ms | 40.6 ms | -34.4% |
| dash.js one pass, attribute callbacks variant | 26.4 ms | 35.1 ms | -43.9% |
| dash.js one pass, 64 KB chunks | 34.4 ms | 42.0 ms | -27.0% |
| dash.js one pass, 16 KB chunks | 29.8 ms | 36.9 ms | -36.9% |
| dash.js one pass, tuned builder, 64 KB chunks | 28.2 ms | 31.3 ms | -40.3% |

#### pretty </S>, 100k S (3,879,679 chars, 60 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml shipped (1.1.6 + #425) | 36.6 ms | 38.1 ms | baseline |
| parseXml on XmlParser | 23.2 ms | 27.6 ms | -36.5% |
| parseXml on XmlParser, 64 KB chunks | 25.1 ms | 27.4 ms | -31.3% |
| parseXml on XmlParser, 16 KB chunks | 20.8 ms | 21.5 ms | -43.1% |
| tokenize + attribute records, no tree | 17.9 ms | 18.4 ms | -51.2% |
| tokenize only (attribute callbacks, no-op) | 22.0 ms | 23.8 ms | -39.9% |
| dash.js today: shipped parseXml + processNode | 48.2 ms | 52.7 ms | baseline |
| dash.js on new parseXml + processNode | 44.8 ms | 46.2 ms | -7.0% |
| dash.js one pass (builder) | 34.0 ms | 34.6 ms | -29.5% |
| dash.js one pass, tuned builder (S branch, Set) | 41.5 ms | 43.4 ms | -13.8% |
| dash.js one pass, attribute callbacks variant | 30.9 ms | 31.7 ms | -35.8% |
| dash.js one pass, 64 KB chunks | 34.3 ms | 35.1 ms | -29.0% |
| dash.js one pass, 16 KB chunks | 37.2 ms | 38.5 ms | -22.9% |
| dash.js one pass, tuned builder, 64 KB chunks | 34.8 ms | 37.4 ms | -27.8% |

#### livesim2 real, 5402 S (169,721 chars, 300 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml shipped (1.1.6 + #425) | 1.32 ms | 1.82 ms | baseline |
| parseXml on XmlParser | 0.905 ms | 1.15 ms | -31.4% |
| parseXml on XmlParser, 64 KB chunks | 0.902 ms | 1.02 ms | -31.7% |
| parseXml on XmlParser, 16 KB chunks | 0.906 ms | 1.37 ms | -31.3% |
| tokenize + attribute records, no tree | 0.798 ms | 0.870 ms | -39.5% |
| tokenize only (attribute callbacks, no-op) | 0.712 ms | 0.797 ms | -46.0% |
| dash.js today: shipped parseXml + processNode | 1.96 ms | 2.23 ms | baseline |
| dash.js on new parseXml + processNode | 1.54 ms | 1.99 ms | -21.3% |
| dash.js one pass (builder) | 1.39 ms | 1.50 ms | -29.2% |
| dash.js one pass, tuned builder (S branch, Set) | 1.39 ms | 1.92 ms | -29.0% |
| dash.js one pass, attribute callbacks variant | 1.28 ms | 1.39 ms | -34.6% |
| dash.js one pass, 64 KB chunks | 1.39 ms | 1.58 ms | -29.0% |
| dash.js one pass, 16 KB chunks | 1.39 ms | 1.91 ms | -29.1% |
| dash.js one pass, tuned builder, 64 KB chunks | 1.40 ms | 1.55 ms | -28.8% |

#### livesim2-scale 60x2x20 </S> (148,451 chars, 300 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml shipped (1.1.6 + #425) | 1.18 ms | 1.46 ms | baseline |
| parseXml on XmlParser | 0.768 ms | 0.953 ms | -34.7% |
| parseXml on XmlParser, 64 KB chunks | 0.768 ms | 0.853 ms | -34.7% |
| parseXml on XmlParser, 16 KB chunks | 0.773 ms | 0.946 ms | -34.3% |
| tokenize + attribute records, no tree | 0.710 ms | 0.813 ms | -39.6% |
| tokenize only (attribute callbacks, no-op) | 0.576 ms | 0.650 ms | -51.1% |
| dash.js today: shipped parseXml + processNode | 1.93 ms | 2.25 ms | baseline |
| dash.js on new parseXml + processNode | 1.51 ms | 1.72 ms | -21.8% |
| dash.js one pass (builder) | 1.43 ms | 1.77 ms | -25.8% |
| dash.js one pass, tuned builder (S branch, Set) | 1.41 ms | 1.75 ms | -27.0% |
| dash.js one pass, attribute callbacks variant | 1.37 ms | 1.51 ms | -28.7% |
| dash.js one pass, 64 KB chunks | 1.43 ms | 1.79 ms | -25.7% |
| dash.js one pass, 16 KB chunks | 1.43 ms | 1.69 ms | -25.9% |
| dash.js one pass, tuned builder, 64 KB chunks | 1.39 ms | 1.54 ms | -27.7% |

#### bbb_30fps.mpd (3,060 chars, 3000 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml shipped (1.1.6 + #425) | 0.023 ms | 0.030 ms | baseline |
| parseXml on XmlParser | 0.016 ms | 0.018 ms | -31.5% |
| parseXml on XmlParser, 64 KB chunks | 0.016 ms | 0.017 ms | -32.2% |
| parseXml on XmlParser, 16 KB chunks | 0.016 ms | 0.017 ms | -32.0% |
| tokenize + attribute records, no tree | 0.015 ms | 0.016 ms | -33.3% |
| tokenize only (attribute callbacks, no-op) | 0.011 ms | 0.012 ms | -52.1% |
| dash.js today: shipped parseXml + processNode | 0.041 ms | 0.053 ms | baseline |
| dash.js on new parseXml + processNode | 0.034 ms | 0.038 ms | -17.7% |
| dash.js one pass (builder) | 0.034 ms | 0.039 ms | -18.2% |
| dash.js one pass, tuned builder (S branch, Set) | 0.034 ms | 0.038 ms | -18.2% |
| dash.js one pass, attribute callbacks variant | 0.034 ms | 0.040 ms | -16.4% |
| dash.js one pass, 64 KB chunks | 0.034 ms | 0.037 ms | -18.2% |
| dash.js one pass, 16 KB chunks | 0.033 ms | 0.037 ms | -19.0% |
| dash.js one pass, tuned builder, 64 KB chunks | 0.034 ms | 0.038 ms | -18.3% |

## Harness

The code blocks below and the core in `prototype.md` are saved as `generate.mjs`, `bench.mjs`, `xmlParser.mjs`
(the core plus the measurement-only switch described in `prototype.md`), and `builders.mjs` (the builders in
`prototype.md`) under `plans/xml-incremental-parser/`, and run from that directory after
`npm run build -w libs/utils -w libs/xml`. The livesim2 manifest is not checked in; download it next to the
scripts as `livesim2_tsbd21600.mpd` (URL under Inputs). Paths are relative to that directory.

`generate.mjs`:

```js
// Synthetic MPD generator following plans/xml-parse-perf/benchmark.md (issue #424 shape).
export function generateMpd({ periods = 50, adaptationSets = 4, segments = 500, pretty = true, closed = false } = {}) {
	const nl = pretty ? '\n' : ''
	const ind = (n) => (pretty ? '  '.repeat(n) : '')
	let out = '<?xml version="1.0" encoding="UTF-8"?>' + nl
	out += '<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" profiles="urn:mpeg:dash:profile:isoff-live:2011" type="dynamic" availabilityStartTime="1970-01-01T00:00:00Z" publishTime="2026-09-02T14:45:04Z" minimumUpdatePeriod="PT2S" minBufferTime="PT2S" timeShiftBufferDepth="PT6H" maxSegmentDuration="PT2S">' + nl
	let t = 0
	for (let p = 0; p < periods; p++) {
		out += ind(1) + `<Period id="p${p}" start="PT${p * segments * 2}S">` + nl
		for (let a = 0; a < adaptationSets; a++) {
			const video = a % 2 === 0
			out += ind(2) + (video
				? `<AdaptationSet id="${a}" contentType="video" mimeType="video/mp4" segmentAlignment="true" startWithSAP="1" maxWidth="1280" maxHeight="720" par="16:9">`
				: `<AdaptationSet id="${a}" contentType="audio" mimeType="audio/mp4" lang="en" segmentAlignment="true">`) + nl
			out += ind(3) + (video
				? `<Representation id="v${a}" bandwidth="1500000" codecs="avc1.64001f" width="1280" height="720" frameRate="30" sar="1:1" />`
				: `<Representation id="a${a}" bandwidth="96000" codecs="mp4a.40.2" audioSamplingRate="48000" />`) + nl
			out += ind(3) + '<SegmentTemplate timescale="90000" media="$RepresentationID$/$Time$.m4s" initialization="$RepresentationID$/init.mp4">' + nl
			out += ind(4) + '<SegmentTimeline>' + nl
			for (let s = 0; s < segments; s++) {
				const form = s % 4
				let tag
				if (form === 0) tag = `<S t="${t}" d="180000"`
				else if (form === 1) tag = '<S d="180000" r="14"'
				else if (form === 2) tag = '<S d="180000" r="-1" k="3"'
				else tag = '<S d="180000"'
				out += ind(5) + tag + (closed ? '></S>' : ' />') + nl
				t += 180000
			}
			out += ind(4) + '</SegmentTimeline>' + nl + ind(3) + '</SegmentTemplate>' + nl + ind(2) + '</AdaptationSet>' + nl
		}
		out += ind(1) + '</Period>' + nl
	}
	out += '</MPD>' + nl
	return out
}

export function chunk(text, size) {
	const out = []
	for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size))
	return out
}
```

`bench.mjs` (imports `xmlParser.mjs`, `builders.mjs`, and the shipped `dist/index.js`):

```js
// Benchmark for the xml-incremental-parser prototype.
//   node bench.mjs                 driver: one process per (variant, input) so call sites stay monomorphic
//   node bench.mjs --interleaved   all variants in one process (shows the megamorphic penalty)
//   add --gc to force a full GC before every timed call (driver passes --expose-gc to workers)
import { readFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { parseXml as shippedParseXml } from '../../libs/xml/dist/index.js'
import { XmlParser } from './xmlParser.mjs'
import * as B from './builders.mjs'
import { generateMpd, chunk } from './generate.mjs'

const args = process.argv.slice(2)
const forceGc = args.includes('--gc')
const interleaved = args.includes('--interleaved')
const runArg = args.find(a => a.startsWith('--run='))
const FIXTURES = '../../libs/xml/test/fixtures/'

const inputs = [
	{ name: 'pretty />, 100k S', make: () => generateMpd({ pretty: true }), iters: forceGc ? 20 : 60 },
	{ name: 'minified />, 100k S', make: () => generateMpd({ pretty: false }), iters: forceGc ? 20 : 60 },
	{ name: 'pretty </S>, 100k S', make: () => generateMpd({ pretty: true, closed: true }), iters: forceGc ? 20 : 60 },
	{ name: 'livesim2 real, 5402 S', make: () => readFileSync('./livesim2_tsbd21600.mpd', 'utf8'), iters: 300 },
	{ name: 'livesim2-scale 60x2x20 </S>', make: () => generateMpd({ periods: 60, adaptationSets: 2, segments: 20, closed: true }), iters: 300 },
	{ name: 'bbb_30fps.mpd', make: () => readFileSync(FIXTURES + 'bbb_30fps.mpd', 'utf8'), iters: 3000 },
]

const variants = [
	{ name: 'parseXml shipped (1.1.6 + #425)', base: 'tree', run: (t) => shippedParseXml(t) },
	{ name: 'parseXml on XmlParser', base: 'tree', run: (t) => B.parseXml(t) },
	{ name: 'parseXml on XmlParser, 64 KB chunks', base: 'tree', run: (t, c) => B.parseXmlChunked(c.k64) },
	{ name: 'parseXml on XmlParser, 16 KB chunks', base: 'tree', run: (t, c) => B.parseXmlChunked(c.k16) },
	{ name: 'tokenize + attribute records, no tree', base: 'tree', run: (t) => new XmlParser(B.recordsNoopBuilder).write(t).end() },
	{ name: 'tokenize only (attribute callbacks, no-op)', base: 'tree', run: (t) => new XmlParser(B.noopBuilder, { attributeCallbacks: true }).write(t).end() },
	{ name: 'dash.js today: shipped parseXml + processNode', base: 'dash', run: (t) => B.dashCurrent(shippedParseXml, t) },
	{ name: 'dash.js on new parseXml + processNode', base: 'dash', run: (t) => B.dashCurrent(B.parseXml, t) },
	{ name: 'dash.js one pass (builder)', base: 'dash', run: (t) => B.dashOnePass(t) },
	{ name: 'dash.js one pass, tuned builder (S branch, Set)', base: 'dash', run: (t) => B.dashOnePassTuned(t) },
	{ name: 'dash.js one pass, attribute callbacks variant', base: 'dash', run: (t) => B.dashOnePassAttributeCallbacks(t) },
	{ name: 'dash.js one pass, 64 KB chunks', base: 'dash', run: (t, c) => B.dashOnePassChunked(c.k64) },
	{ name: 'dash.js one pass, 16 KB chunks', base: 'dash', run: (t, c) => B.dashOnePassChunked(c.k16) },
	{ name: 'dash.js one pass, tuned builder, 64 KB chunks', base: 'dash', run: (t, c) => B.dashOnePassChunked(c.k64, B.dashBuilderTuned) },
]

function stats(times) {
	const sorted = [...times].sort((a, b) => a - b)
	return {
		median: sorted[Math.floor(sorted.length / 2)],
		p95: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))],
		min: sorted[0],
	}
}

function fmt(ms) {
	return ms >= 10 ? ms.toFixed(1) : ms >= 1 ? ms.toFixed(2) : ms.toFixed(3)
}

let sink = null

function measure(variantIndexes, input) {
	const text = input.make()
	// Fresh flat strings per chunk, as TextDecoderStream produces them (slices would be SlicedStrings).
	const flat = (parts) => parts.map(part => Buffer.from(part, 'utf8').toString('utf8'))
	const chunks = { k64: flat(chunk(text, 65536)), k16: flat(chunk(text, 16384)) }
	const times = variantIndexes.map(() => [])
	const rounds = 4 + input.iters
	for (let r = 0; r < rounds; r++) {
		for (let k = 0; k < variantIndexes.length; k++) {
			if (forceGc) globalThis.gc()
			const start = performance.now()
			sink = variants[variantIndexes[k]].run(text, chunks)
			const elapsed = performance.now() - start
			if (r >= 4) times[k].push(elapsed)
		}
	}
	return { length: text.length, results: times.map(stats) }
}

function printTables(perInput) {
	console.log(`Node ${process.version}, ${process.arch}, ${forceGc ? 'forced GC before each call' : 'natural GC'}, ${interleaved ? 'all variants interleaved in one process' : 'one process per variant'}\n`)
	perInput.forEach(({ input, length, results }) => {
		const treeBase = results[0].median
		const dashBase = results[variants.findIndex(v => v.base === 'dash')].median
		console.log(`### ${input.name} (${length.toLocaleString()} chars, ${input.iters} iterations)\n`)
		console.log('| Variant | Median | p95 | vs baseline |')
		console.log('| --- | ---: | ---: | ---: |')
		results.forEach((r, v) => {
			const base = variants[v].base === 'tree' ? treeBase : dashBase
			const delta = ((r.median - base) / base) * 100
			console.log(`| ${variants[v].name} | ${fmt(r.median)} ms | ${fmt(r.p95)} ms | ${delta === 0 ? 'baseline' : (delta > 0 ? '+' : '') + delta.toFixed(1) + '%'} |`)
		})
		console.log('')
	})
}

if (runArg) {
	// worker: --run=<variant>,<input>
	const [v, i] = runArg.slice(6).split(',').map(Number)
	const { length, results } = measure([v], inputs[i])
	console.log(JSON.stringify({ length, result: results[0] }))
}
else if (interleaved) {
	const all = variants.map((_, v) => v)
	printTables(inputs.map(input => ({ input, ...measure(all, input) })))
}
else {
	const self = fileURLToPath(import.meta.url)
	const perInput = inputs.map((input, i) => {
		const results = []
		let length = 0
		for (let v = 0; v < variants.length; v++) {
			const nodeArgs = forceGc ? ['--expose-gc', self, `--run=${v},${i}`, '--gc'] : [self, `--run=${v},${i}`]
			const proc = spawnSync(process.execPath, nodeArgs, { encoding: 'utf8' })
			if (proc.status !== 0) throw new Error(proc.stderr)
			const parsed = JSON.parse(proc.stdout.trim().split('\n').pop())
			length = parsed.length
			results.push(parsed.result)
		}
		return { input, length, results }
	})
	printTables(perInput)
}
if (sink === undefined) console.log('unreachable')
```
