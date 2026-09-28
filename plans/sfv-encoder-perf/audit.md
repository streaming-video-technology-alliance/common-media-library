# Structured field values encoder: performance audit

Date: 2026-09-11. Package: `@svta/cml-structured-field-values` 1.1.5 at commit `b28716d2`. Runtime: Node 24.16.0 on macOS (Darwin 25.6.0).

## Summary

The encoder is half of the cost of `encodeCmcd` for a typical request. The other half is `prepareCmcdData`.

| Step, 17-key CMCD request | ns per call |
| --- | --- |
| `encodeCmcd` (prepare and encode) | 4321 |
| `prepareCmcdData` only | 2089 |
| `encodeSfDict` on the prepared data | 2173 |

Seven changes, all output-identical to the shipped encoder, make the CMCD dictionary encode 31% to 48% faster and cut its garbage from 6.5 KB to 2.1 KB per call. The absolute numbers are small. At 10 requests per second the saving is about 10 microseconds of CPU and 44 KB of garbage per second. The garbage reduction is the meaningful part for a library that runs on every playback. The changes are also a code cleanup: they remove the `SfItem` wrapper allocation, the `as any` TODO in `serializeList`, and the regex literals that the code-quality rule forbids in hot functions.

Every variant produced the same output and the same error message as the shipped encoder on 1259 cases: the 11 bench inputs and 1248 cases from the `structured-field-tests` corpus, including 539 cases that must fail. One error text differs: `encodeSfItem([1, 2])` reports `[1,2]` instead of `[{"value":1},{"value":2}]`.

## Status

Implemented on branch `perf/sfv-encoder-allocations` (findings 1 to 6). The final measurement is in the section "Final result" below. Finding 7 is a separate change in `@svta/cml-utils`. The side findings are an issue.

## Method

The benchmark lives in `libs/structured-field-values/bench/`, with `npm run bench -w libs/structured-field-values`. It runs each (variant, input) pair in its own process, so type feedback for one variant never shapes another. Each process makes 30 warm-up batches, then times 50 batches of 1000 calls and reports the median and p95 in nanoseconds per call. Every result string is flattened with `charCodeAt`, so rope strings pay their flattening cost inside the measurement.

The staged variants of the audit were scratch copies of the shipped encoder with one change per stage. The repository does not keep them. The final implementation reproduces stage s4j, with one difference: lists append their members instead of joining parts, because the join measured 15% slower on a 20-member list while it measured faster on a 100-member dictionary.

The allocation column runs 2000 calls after `gc()` with `--min-semi-space-size=64`. A `PerformanceObserver` on `gc` entries confirmed that no garbage collection ran inside any measured window, so the `heapUsed` delta is the bytes allocated per call, result included.

The variants are staged. Each stage keeps the changes of the stage before it.

| Stage | Change |
| --- | --- |
| s1 | Move the regex literals of `serializeKey`, `serializeToken`, and `serializeString` to module constants |
| s2 | Replace `Object.entries`, `Array.from`, `map`, and `join` with index loops. Stop wrapping bare values in `new SfItem` |
| s3 | `serializeString`: one regex test, return the quoted string directly when nothing needs escaping |
| s4 | `serializeKey` as a `charCodeAt` loop, token regex without capture groups, numeric magnitude check in `serializeDecimal` |
| s4e | s4 with a `for...of Object.entries` loop in `encodeSfDict` |
| s4j | s4 with a parts array and one `join` in `encodeSfDict` and `encodeSfList` |

## Results

Median nanoseconds per call. The percentage is the change against the baseline.

| Input | baseline | s2 | s3 | s4 | s4j |
| --- | --- | --- | --- | --- | --- |
| CMCD dict, 17 keys, bare values | 2412 | 2183 (-9%) | 1856 (-23%) | 1642 (-32%) | 1666 (-31%) |
| CMCD dict, 17 keys, `SfItem` values | 2994 | 2229 (-26%) | 1901 (-37%) | 1724 (-42%) | 1741 (-42%) |
| CMCD dict, 17 keys, `Map` | 2885 | 2027 (-30%) | 1719 (-40%) | 1501 (-48%) | 1503 (-48%) |
| CMCD dict, 17 keys, built by keyed assignment | 2923 | 2129 (-27%) | 1888 (-35%) | 1677 (-43%) | 1678 (-43%) |
| Dict, 100 integer keys | 10006 | 11408 (+14%) | 11784 (+18%) | 7352 (-27%) | 6929 (-31%) |
| List, 20 integers | 630 | 539 (-14%) | 543 (-14%) | 537 (-15%) | 535 (-15%) |
| List, 10 URL strings without escapes | 2637 | 2578 (-2%) | 1860 (-29%) | 1884 (-29%) | 1846 (-30%) |
| List, 10 strings with quotes and backslashes | 4303 | 4149 (-4%) | 4395 (+2%) | 4376 (+2%) | 4389 (+2%) |
| List, 20 decimals | 2038 | 1911 (-6%) | 1929 (-5%) | 1850 (-9%) | 1855 (-9%) |
| Item `"abc"` with 3 parameters | 631 | 379 (-40%) | 293 (-54%) | 255 (-60%) | 250 (-60%) |
| Dict with one 32-byte sequence | 1135 | 1088 (-4%) | 1093 (-4%) | 1071 (-6%) | 1054 (-7%) |

Heap bytes allocated per call.

| Input | baseline | s2 | s4 | s4j |
| --- | --- | --- | --- | --- |
| CMCD dict, 17 keys, bare values | 6555 | 2802 | 2800 | 2112 |
| CMCD dict, 17 keys, `Map` | 7227 | 3705 | 3705 | 3017 |
| Dict, 100 integer keys | 26637 | 12970 | 12970 | 9825 |
| List, 10 URL strings without escapes | 3482 | 2220 | 2220 | 2220 |
| Item `"abc"` with 3 parameters | 1538 | 440 | 476 | 441 |

Stage s4e (`Object.entries` loop) was slower than s4 on the `SfItem` and keyed-assignment inputs and allocated 3889 bytes per CMCD dict. It is not recommended.

Three separate runs gave the same ranking. The baseline of the bare-values CMCD row moved between 2391 and 3014 ns across runs, so its s4j delta ranged from -29% to -48%. The other three CMCD rows stayed within 3% of the numbers above, and s4j stayed between 1498 and 1741 ns on all four.

## Findings, ranked by measured effect

### 1. Container functions allocate a wrapper and four arrays per call

`serializeDict` calls `Object.entries`, copies the result with `Array.from`, maps it to strings, and joins. It wraps every bare value in `new SfItem`, and the `SfItem` constructor maps every inner list into more `SfItem` objects. `serializeList` and `serializeParams` follow the same pattern. For a 17-key CMCD dict, this is 17 pair arrays, 17 wrapper objects, one entries array, one copy, one mapped array, and one joined string.

Fix: iterate `Object.keys` by index, read `value` and `params` from an `SfItem` or use the bare value, and push member strings into one parts array joined once. `serializeParams` and `serializeInnerList` have few members and can build their string with `+=`.

Effect: stage s2 and s4j columns. A parts array with `join` and `+=` cost the same at 17 keys. At 100 keys `+=` is 14% slower than the baseline and `join` is 31% faster, so `join` is the safe choice for dictionaries and lists.

### 2. `serializeString` always runs three regex passes

The function tests for control characters, then runs two global `replace` calls for backslash and double quote. Most strings contain neither. Measured on a 36-character session id: 170 ns.

Fix: test one regex, `/[\x00-\x1f\x7f"\\]/`, first. If it does not match, return `'"' + value + '"'`. Otherwise run the existing check and the two replaces.

| String | current | fast path |
| --- | --- | --- |
| Session id, 36 chars | 170 ns | 63 ns |
| URL, 92 chars | 225 ns | 143 ns |
| 44 chars with quotes and backslashes | 387 ns | 404 ns |

Effect: URL list -29%. Strings that need escaping pay one extra test, +2%.

### 3. `serializeKey` runs a regex on every key

CMCD keys are 1 to 3 characters. A `charCodeAt` loop is faster than the regex below about 12 characters and slower above.

| Key | regex | loop |
| --- | --- | --- |
| `br` | 20 ns | 6 ns |
| `com.example-hello`, 17 chars | 32 ns | 42 ns |
| 33 chars | 44 ns | 77 ns |

Effect on the CMCD dict: -11% on top of s3. On 100 short keys: from +18% to -27%. Custom CMCD keys such as `com.example-hello` lose 10 ns each. The loop adds about 150 bytes to the bundle where the regex is 40 bytes.

### 4. `serializeParams` uses `Object.entries().map().join()`

Same pattern as finding 1, on the parameters of every item. Measured with 3 parameters: 305 ns with entries, map, and join. 132 ns with an `Object.keys` index loop and `+=`. `for...in` is 110 ns but also visits inherited properties, so `Object.keys` keeps the current semantics.

Effect: item with 3 parameters -40% in s2, -60% in s4.

### 5. Regex literals inside hot functions

`serializeKey`, `serializeToken`, and `serializeString` create their regex from a literal on every call. The code-quality rule requires module constants. V8 clones a cached boilerplate, so the measured cost is near zero: 19.7 ns against 19.9 ns for the key regex. Do this for the rule, not for speed. The token regex also has two capture groups that `test` does not need. Removing them saves 2 ns per token.

### 6. `serializeDecimal` builds a string to check the magnitude

`Math.floor(Math.abs(roundedValue)).toString().length > 12` allocates a string. `Math.abs(roundedValue) >= 1e12` is equivalent for valid input, is 8.4 ns against 5.0 ns, and fixes a bug: `serializeDecimal(1e21)` returns `1e+21.0` today because `toString` switches to exponent notation. Decimals are rare in CMCD, so the speed effect is small. The 20-decimal list gains 9% overall, mostly from finding 1.

### 7. `encodeBase64` in `@svta/cml-utils` spreads the bytes into `String.fromCharCode`

`serializeByteSequence` calls `encodeBase64`, which is `btoa(String.fromCharCode(...binary))`. The spread passes every byte as an argument.

| Input | spread (current) | `apply` in 32 KB chunks | manual loop | `Buffer` (Node only) |
| --- | --- | --- | --- | --- |
| 32 bytes | 845 ns | 207 ns | 303 ns | 118 ns |
| 4 KB | 90 µs | 13 µs | 34 µs | 0.6 µs |
| 64 KB | 1722 µs | 296 µs | 552 µs | 8 µs |
| 200 KB | `RangeError: Maximum call stack size exceeded` | 267 KB string | | |

Fix: `String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))` per chunk. This is a `cml-utils` change and a bug fix, so it belongs in its own PR. `Uint8Array.prototype.toBase64` is not available in Node 24. Byte sequences do not occur in CMCD.

### Not worth changing

- The `instanceof` order in `serializeBareItem`: 5.2 ns either way.
- `value.toString()` against `'' + value` for integers: 3 ns.
- `for...in` in place of `Object.keys`: 20 ns per params object, and it changes semantics.

## Side findings, correctness

These are not performance issues. They need a decision on whether to change behavior.

- `serializeString` accepts non-ASCII characters. `serializeString('héllo')` returns `"héllo"`. RFC 8941 section 4.1.6 step 1 requires serialization to fail. The `structured-field-tests` corpus has no non-ASCII vector, so the test suite cannot catch this.
- `serializeDate` emits fractions. `serializeDate(new Date(1500))` returns `@1.5`. RFC 9651 section 4.1.10 serializes the date as an Integer.
- `serializeDecimal(1e21)` returns `1e+21.0`. See finding 6.
- `serializeDict` and `serializeList` reject a plain `SfInnerList` object although the `SfMember` type includes it. `encodeSfDict({ a: { value: [1, 2], params: {} } })` throws `failed to serialize ... as Bare Item`, because the object is wrapped as a bare value.
- `sf-serialization.test.ts` cannot detect a missing failure. If a `must_fail` vector encodes without an error, `suite.canonical[0]` throws a `TypeError` inside the same `try` block, and the `catch` asserts `must_fail === true`, which passes. The corpus has 539 `must_fail` serialization vectors. The shipped encoder does fail on all of them today, verified by `bench.mjs --verify`.

## Final result

Measured with `npm run bench -- --baseline=temp/dist/index.js` from `libs/structured-field-values`, where `temp/dist` is a copy of the `main` build. Median nanoseconds per call, p95 in brackets, then heap bytes allocated per call.

| Input | main | this branch | delta | bytes main | bytes this branch |
| --- | ---: | ---: | ---: | ---: | ---: |
| CMCD dict, 17 keys, bare values | 2949 (3446) | 1750 (2003) | -40.6% | 6530 | 2130 |
| CMCD dict, 17 keys, `SfItem` values | 2830 (3183) | 1899 (2049) | -32.9% | 5586 | 2130 |
| CMCD dict, 17 keys, `Map` | 2946 (4393) | 1695 (1857) | -42.5% | 7203 | 2003 |
| Dict, 100 integer keys | 10148 (10554) | 9016 (10164) | -11.2% | 26598 | 9833 |
| List, 20 integers | 649 (731) | 544 (670) | -16.2% | 1418 | 1346 |
| List, 10 URL strings without escapes | 2627 (4774) | 1887 (2085) | -28.2% | 3458 | 2197 |
| List, 10 strings with quotes and backslashes | 4319 (4559) | 4359 (4595) | +0.9% | 9613 | 8358 |
| List, 20 decimals | 1966 (2113) | 1815 (2075) | -7.7% | 2236 | 1850 |
| Item `"abc"` with 3 parameters | 630 (764) | 283 (346) | -55.0% | 1514 | 418 |
| Dict with one 32-byte sequence | 1174 (1377) | 1037 (1296) | -11.7% | 2882 | 2882 |

Five runs of the committed code gave the same ranking. The 100-key dictionary row moved the most: between -11% and -24%, with -17% in three of the five runs. The CMCD rows stayed between -33% and -43%.

`npm run bench -- --baseline=temp/dist/index.js --verify` reported 1258 identical outputs and error messages on the bench inputs and the corpus. The decimal fix is not in the corpus.

The key loop of `serializeDict` measured the same as `for...of`, `forEach`, and an index loop. The `Map` path uses `Map.prototype.forEach`, which avoids one entry array per member. A `for...of` loop measured about 170 ns faster on 17 entries but allocated 1 KB more. The strings-with-escapes row pays one extra regex test.

## Recommendation

Findings 1 to 6 are one PR in `structured-field-values`. Finding 7 is one PR in `utils`, with a test for a 200 KB input. The side findings are one issue. The non-ASCII and date checks change behavior for callers who pass invalid input today, so they need a decision before a fix.
