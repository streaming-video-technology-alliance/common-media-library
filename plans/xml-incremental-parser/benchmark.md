# Benchmark methodology and results

`prototype/bench.ts` measures the phase-one prototype against `main` after #432. Run from the repository
root after `npm run build -w libs/xml`:

```bash
node plans/xml-incremental-parser/prototype/bench.ts
node plans/xml-incremental-parser/prototype/bench.ts --gc
```

## Method

- One process per (variant, input) pair, as in `libs/xml/bench/bench.ts`: type feedback gathered for one
  variant never shapes the code compiled for another. Each process builds the input, makes 4 warm-up
  calls, then times each measured call with `performance.now()` (60 calls on the 100k `<S>` inputs, 300 on
  the 150 KB inputs, 3,000 on the 3 KB fixture) and reports the median and p95. Every result is kept in a
  variable so nothing is eliminated as dead code.
- Two-builder pairs: after the isolated runs, two variants alternate in one process and each is reported
  against its isolated median. An application that uses `parseXml` and one custom builder drives the
  shared scanner exactly this way, so the pairs bound what the monomorphic per-process numbers hide.
- Forced-GC runs call `gc()` before every measured call (`--expose-gc`) and use 20 iterations on the large
  inputs.
- Baselines: `parseXml` from `main` (5e4a82276, the #432 scanner) for the tree rows; `main`'s `parseXml`
  plus a faithful port of dash.js `processNode` (matchers, `arrayNodes`, `__children`) for the dash.js rows.
- The synthetic inputs come from `libs/xml/bench/generate.ts`, which returns a flat string; the livesim2
  manifest is the checked-in fixture `libs/xml/test/fixtures/livesim2_tsbd21600.mpd` (169,727 bytes,
  sha256 427d67f714fbf6c0985bcd3a0f4cd8358709b2c10f1d793570b34710987932d9).
- Variants. `parseXml (phase-one scanner)` is `prototype/parseXml.ts`: the same tree with the contract
  changes on the hot path (skip checks, name arguments, untrimmed text, NameStartChar, `?>`, quoted
  doctype literals, `XmlParseError`). `faithful builder` produces objects `deepStrictEqual` to today's
  `processNode` output, XmlNode leftovers included. `lean builder` keeps only what the rest of dash.js
  reads and handles `<S>` directly; it is what a real port would write and is not compared for equality.
- Machine: MacBook Pro M1 Pro, macOS 26.6, Node v24.16.0, on battery. Relative numbers within one table are
  what matters.

## Inputs

| Input | Size | Notes |
|---|---:|---|
| pretty `/>`, 100k S | 3,679,679 chars | 50 Periods x 4 AdaptationSets x 500 `<S ... />`, two-space indent, `<S>` at depth 5 |
| minified `/>`, 100k S | 2,569,576 chars | same without whitespace |
| pretty `</S>`, 100k S | 3,879,679 chars | `<S ...></S>` as livesim2 (Go encoding/xml) emits |
| livesim2 real, 5402 S | 169,727 chars | `segtimeline_1/tsbd_21600/testpic_2s/Manifest.mpd`, checked-in fixture |
| livesim2-scale 60x2x20 `</S>` | 148,451 chars | approximates the `periods_60` manifest |
| bbb_30fps.mpd | 3,060 chars | package test fixture |

## What the numbers say

- **The contract changes cost `parseXml` nothing measurable.** Against `main`, the phase-one scanner is
  within -2 to +3 percent on every input under natural GC (+2 to +6 percent under forced GC on the
  stress inputs). The skip checks, name arguments, untrimmed text policy, NameStartChar test, and the
  quoted-literal doctype scan are on the hot path and do not show.
- **A faithful one-pass replacement of `processNode` gains dash.js almost nothing on top of #432.** It
  removes the tree and the walk but still allocates every object `processNode` allocates, including the
  XmlNode leftovers and the text leaves, and still runs the matcher chain per attribute: -1 to -9 percent
  on the stress inputs, +3 to +5 percent on the real-sized ones. With #432 on `main`, the tree is no
  longer where the time goes; the per-node conversion is.
- **A lean builder gains 13 to 21 percent on the stress inputs and 0 to 6 percent on real-sized
  manifests.** That is the headroom this API adds for dash.js on top of #432: removing the second pass and
  its object shapes, plus handling `<S>` without the matcher chain. The 2x from #424 is not reachable by
  the API alone; #432 took the larger share of it (51 ms to 41 ms on the stress input for the whole
  dash.js pipeline) and a player-side specialization takes the rest.
- **Two builders in one process cost each a few percent.** In the pairs, `parseXml` and the lean builder
  each land within about +6 percent of their isolated medians on the large inputs; the faithful builder
  pays +10 to +20 percent when paired with `parseXml`.
- **Forced-GC anomaly, unresolved.** With a full GC before every call, the faithful builder runs 4 to 5
  times slower than the isolated natural-GC run on the two 150 KB inputs (8.4 ms against 1.4 ms on the
  livesim2 manifest) and the lean builder 16 to 46 percent slower than today's pipeline on the small
  inputs. The effect disappears when the same builder alternates with `parseXml` in one process (1.9 ms
  for the faithful builder in pair 1), and today's `processNode`, which creates the same object shapes,
  does not show it. This looks like V8 hidden-class or stub-cache churn triggered by the builders'
  dynamically shaped objects in an isolated process, not a property of the scanner, but it is not
  diagnosed. The implementation should measure it with `--trace-deopt` and prefer builders that create
  each object with all of its fields present.

## Results, natural GC


### pretty />, 100k S (3,679,679 chars, 60 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml (main after #432) | 22.7 ms | 25.4 ms | baseline |
| parseXml (phase-one scanner) | 23.1 ms | 26.3 ms | +1.7% |
| dash.js today: parseXml (main) + processNode | 41.4 ms | 52.7 ms | baseline |
| dash.js one pass, faithful builder (identical output) | 37.7 ms | 58.8 ms | -9.1% |
| dash.js one pass, lean builder | 32.9 ms | 39.2 ms | -20.7% |

Two variants alternating in one process, each against its isolated median:

| Pair | Variant | Median | vs isolated |
| --- | --- | ---: | ---: |
| pair 1 | parseXml (phase-one scanner) | 21.0 ms | -8.9% |
| pair 1 | dash.js one pass, faithful builder (identical output) | 41.6 ms | +10.5% |
| pair 2 | parseXml (phase-one scanner) | 24.2 ms | +4.6% |
| pair 2 | dash.js one pass, lean builder | 34.6 ms | +5.4% |

### minified />, 100k S (2,569,576 chars, 60 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml (main after #432) | 16.4 ms | 30.0 ms | baseline |
| parseXml (phase-one scanner) | 16.7 ms | 30.2 ms | +1.9% |
| dash.js today: parseXml (main) + processNode | 35.8 ms | 50.4 ms | baseline |
| dash.js one pass, faithful builder (identical output) | 33.5 ms | 56.2 ms | -6.4% |
| dash.js one pass, lean builder | 30.6 ms | 38.8 ms | -14.8% |

Two variants alternating in one process, each against its isolated median:

| Pair | Variant | Median | vs isolated |
| --- | --- | ---: | ---: |
| pair 1 | parseXml (phase-one scanner) | 17.8 ms | +6.5% |
| pair 1 | dash.js one pass, faithful builder (identical output) | 40.1 ms | +19.6% |
| pair 2 | parseXml (phase-one scanner) | 17.7 ms | +6.1% |
| pair 2 | dash.js one pass, lean builder | 36.5 ms | +19.5% |

### pretty </S>, 100k S (3,879,679 chars, 60 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml (main after #432) | 24.7 ms | 26.5 ms | baseline |
| parseXml (phase-one scanner) | 24.8 ms | 27.3 ms | +0.5% |
| dash.js today: parseXml (main) + processNode | 40.1 ms | 54.8 ms | baseline |
| dash.js one pass, faithful builder (identical output) | 39.5 ms | 58.1 ms | -1.4% |
| dash.js one pass, lean builder | 34.7 ms | 42.8 ms | -13.4% |

Two variants alternating in one process, each against its isolated median:

| Pair | Variant | Median | vs isolated |
| --- | --- | ---: | ---: |
| pair 1 | parseXml (phase-one scanner) | 22.9 ms | -7.9% |
| pair 1 | dash.js one pass, faithful builder (identical output) | 44.4 ms | +12.4% |
| pair 2 | parseXml (phase-one scanner) | 25.9 ms | +4.2% |
| pair 2 | dash.js one pass, lean builder | 36.0 ms | +3.7% |

### livesim2 real, 5402 S (169,727 chars, 300 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml (main after #432) | 0.821 ms | 1.24 ms | baseline |
| parseXml (phase-one scanner) | 0.804 ms | 1.26 ms | -2.0% |
| dash.js today: parseXml (main) + processNode | 1.38 ms | 1.84 ms | baseline |
| dash.js one pass, faithful builder (identical output) | 1.43 ms | 2.11 ms | +3.3% |
| dash.js one pass, lean builder | 1.30 ms | 1.82 ms | -5.6% |

Two variants alternating in one process, each against its isolated median:

| Pair | Variant | Median | vs isolated |
| --- | --- | ---: | ---: |
| pair 1 | parseXml (phase-one scanner) | 0.870 ms | +8.2% |
| pair 1 | dash.js one pass, faithful builder (identical output) | 1.51 ms | +6.1% |
| pair 2 | parseXml (phase-one scanner) | 0.860 ms | +6.9% |
| pair 2 | dash.js one pass, lean builder | 1.38 ms | +5.9% |

### livesim2-scale 60x2x20 </S> (148,451 chars, 300 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml (main after #432) | 0.694 ms | 1.08 ms | baseline |
| parseXml (phase-one scanner) | 0.716 ms | 1.09 ms | +3.2% |
| dash.js today: parseXml (main) + processNode | 1.36 ms | 1.84 ms | baseline |
| dash.js one pass, faithful builder (identical output) | 1.42 ms | 1.98 ms | +4.3% |
| dash.js one pass, lean builder | 1.34 ms | 1.84 ms | -2.0% |

Two variants alternating in one process, each against its isolated median:

| Pair | Variant | Median | vs isolated |
| --- | --- | ---: | ---: |
| pair 1 | parseXml (phase-one scanner) | 0.746 ms | +4.2% |
| pair 1 | dash.js one pass, faithful builder (identical output) | 1.48 ms | +4.0% |
| pair 2 | parseXml (phase-one scanner) | 0.745 ms | +4.0% |
| pair 2 | dash.js one pass, lean builder | 1.35 ms | +1.2% |

### bbb_30fps.mpd (3,060 chars, 3000 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml (main after #432) | 0.015 ms | 0.017 ms | baseline |
| parseXml (phase-one scanner) | 0.015 ms | 0.018 ms | +2.5% |
| dash.js today: parseXml (main) + processNode | 0.032 ms | 0.049 ms | baseline |
| dash.js one pass, faithful builder (identical output) | 0.034 ms | 0.041 ms | +5.0% |
| dash.js one pass, lean builder | 0.032 ms | 0.042 ms | +0.3% |

Two variants alternating in one process, each against its isolated median:

| Pair | Variant | Median | vs isolated |
| --- | --- | ---: | ---: |
| pair 1 | parseXml (phase-one scanner) | 0.016 ms | +4.9% |
| pair 1 | dash.js one pass, faithful builder (identical output) | 0.035 ms | +3.4% |
| pair 2 | parseXml (phase-one scanner) | 0.015 ms | -0.8% |
| pair 2 | dash.js one pass, lean builder | 0.032 ms | +0.3% |


## Results, full GC before every call


### pretty />, 100k S (3,679,679 chars, 20 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml (main after #432) | 26.7 ms | 27.2 ms | baseline |
| parseXml (phase-one scanner) | 28.3 ms | 30.8 ms | +6.0% |
| dash.js today: parseXml (main) + processNode | 43.7 ms | 47.9 ms | baseline |
| dash.js one pass, faithful builder (identical output) | 44.4 ms | 48.1 ms | +1.6% |
| dash.js one pass, lean builder | 39.1 ms | 76.1 ms | -10.5% |

Two variants alternating in one process, each against its isolated median:

| Pair | Variant | Median | vs isolated |
| --- | --- | ---: | ---: |
| pair 1 | parseXml (phase-one scanner) | 28.4 ms | +0.5% |
| pair 1 | dash.js one pass, faithful builder (identical output) | 44.5 ms | +0.2% |
| pair 2 | parseXml (phase-one scanner) | 27.4 ms | -3.1% |
| pair 2 | dash.js one pass, lean builder | 40.3 ms | +2.9% |

### minified />, 100k S (2,569,576 chars, 20 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml (main after #432) | 22.9 ms | 38.4 ms | baseline |
| parseXml (phase-one scanner) | 24.1 ms | 24.7 ms | +5.0% |
| dash.js today: parseXml (main) + processNode | 38.3 ms | 40.4 ms | baseline |
| dash.js one pass, faithful builder (identical output) | 41.0 ms | 42.4 ms | +7.0% |
| dash.js one pass, lean builder | 34.9 ms | 35.8 ms | -9.0% |

Two variants alternating in one process, each against its isolated median:

| Pair | Variant | Median | vs isolated |
| --- | --- | ---: | ---: |
| pair 1 | parseXml (phase-one scanner) | 24.5 ms | +1.7% |
| pair 1 | dash.js one pass, faithful builder (identical output) | 40.5 ms | -1.3% |
| pair 2 | parseXml (phase-one scanner) | 23.5 ms | -2.7% |
| pair 2 | dash.js one pass, lean builder | 36.6 ms | +4.8% |

### pretty </S>, 100k S (3,879,679 chars, 20 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml (main after #432) | 28.5 ms | 29.5 ms | baseline |
| parseXml (phase-one scanner) | 29.5 ms | 31.6 ms | +3.6% |
| dash.js today: parseXml (main) + processNode | 44.6 ms | 53.4 ms | baseline |
| dash.js one pass, faithful builder (identical output) | 46.5 ms | 49.2 ms | +4.2% |
| dash.js one pass, lean builder | 40.6 ms | 41.7 ms | -9.2% |

Two variants alternating in one process, each against its isolated median:

| Pair | Variant | Median | vs isolated |
| --- | --- | ---: | ---: |
| pair 1 | parseXml (phase-one scanner) | 30.1 ms | +2.2% |
| pair 1 | dash.js one pass, faithful builder (identical output) | 46.4 ms | -0.2% |
| pair 2 | parseXml (phase-one scanner) | 29.0 ms | -1.9% |
| pair 2 | dash.js one pass, lean builder | 42.1 ms | +3.9% |

### livesim2 real, 5402 S (169,727 chars, 300 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml (main after #432) | 0.866 ms | 1.06 ms | baseline |
| parseXml (phase-one scanner) | 0.881 ms | 1.11 ms | +1.7% |
| dash.js today: parseXml (main) + processNode | 1.50 ms | 1.70 ms | baseline |
| dash.js one pass, faithful builder (identical output) | 8.40 ms | 9.40 ms | +461.4% |
| dash.js one pass, lean builder | 1.80 ms | 9.11 ms | +20.5% |

Two variants alternating in one process, each against its isolated median:

| Pair | Variant | Median | vs isolated |
| --- | --- | ---: | ---: |
| pair 1 | parseXml (phase-one scanner) | 0.962 ms | +9.3% |
| pair 1 | dash.js one pass, faithful builder (identical output) | 1.93 ms | -77.0% |
| pair 2 | parseXml (phase-one scanner) | 1.00 ms | +13.8% |
| pair 2 | dash.js one pass, lean builder | 1.65 ms | -8.6% |

### livesim2-scale 60x2x20 </S> (148,451 chars, 300 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml (main after #432) | 0.782 ms | 0.937 ms | baseline |
| parseXml (phase-one scanner) | 0.778 ms | 0.902 ms | -0.6% |
| dash.js today: parseXml (main) + processNode | 1.49 ms | 1.82 ms | baseline |
| dash.js one pass, faithful builder (identical output) | 7.80 ms | 8.26 ms | +422.2% |
| dash.js one pass, lean builder | 1.73 ms | 7.99 ms | +15.9% |

Two variants alternating in one process, each against its isolated median:

| Pair | Variant | Median | vs isolated |
| --- | --- | ---: | ---: |
| pair 1 | parseXml (phase-one scanner) | 0.855 ms | +9.9% |
| pair 1 | dash.js one pass, faithful builder (identical output) | 1.96 ms | -74.8% |
| pair 2 | parseXml (phase-one scanner) | 0.849 ms | +9.2% |
| pair 2 | dash.js one pass, lean builder | 1.71 ms | -1.2% |

### bbb_30fps.mpd (3,060 chars, 3000 iterations)

| Variant | Median | p95 | vs baseline |
| --- | ---: | ---: | ---: |
| parseXml (main after #432) | 0.022 ms | 0.029 ms | baseline |
| parseXml (phase-one scanner) | 0.021 ms | 0.028 ms | -2.7% |
| dash.js today: parseXml (main) + processNode | 0.056 ms | 0.078 ms | baseline |
| dash.js one pass, faithful builder (identical output) | 0.203 ms | 0.253 ms | +261.2% |
| dash.js one pass, lean builder | 0.082 ms | 0.228 ms | +46.1% |

Two variants alternating in one process, each against its isolated median:

| Pair | Variant | Median | vs isolated |
| --- | --- | ---: | ---: |
| pair 1 | parseXml (phase-one scanner) | 0.024 ms | +11.9% |
| pair 1 | dash.js one pass, faithful builder (identical output) | 0.116 ms | -42.9% |
| pair 2 | parseXml (phase-one scanner) | 0.039 ms | +81.3% |
| pair 2 | dash.js one pass, lean builder | 0.092 ms | +12.3% |

