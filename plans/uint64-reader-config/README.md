# Working artifacts for `rfc/uint64-reader-config.md`

These files are working artifacts for the RFC. They exist on the feature branch only. Delete the folder before the PR merges.

## `spike/`

A type-level model of the proposed changes. The model reduces the package to one affected box (`tfdt`), one unaffected box (`mfhd`), and one container (`traf`). Nothing in `libs/` imports it.

- `model.ts` is the proposed type plumbing.
- `spike.test-d.ts` is the test. Every `@ts-expect-error` line must fail to compile and every other line must compile.
- `published-types.ts` shows the result type that the published package gives a custom `tfdt` reader today.

Run the checks from the repo root:

```sh
# TypeScript 6, the repo compiler, with the root tsconfig options
./node_modules/.bin/tsc -p plans/uint64-reader-config/spike/tsconfig.json

# TypeScript 5.7, the minimum that the type declarations support
npx -p typescript@5.7.3 tsc -p plans/uint64-reader-config/spike/tsconfig.ts57.json

# The published types, after `npm run build -w libs/iso-bmff`
./node_modules/.bin/tsc -p plans/uint64-reader-config/spike/tsconfig.published.json
```

## `bench/`

The runtime measurement for the Reference-level explanation of the RFC.

- `patch.py` copies the built package and writes four variants of it. Variant A branches in the `read` dispatch. Variant B adds a `readWideUint` arrow field that holds the branch. Variant C picks the method in the constructor and aliases `readUint` when the option is off. Variant D adds a `readWideUint` prototype method.
- `patch.ts` writes variants C, E, and F. Variant E is the proposal: the option holds a function, and a closure in the view calls the function. Variant F holds the `bigint` read and the overflow check in the view, as an earlier draft of the RFC did.
- `bench.ts` reads a buffer of 30000 boxes (`tfdt`, `mfhd`, `sidx`) with one variant and prints the median time per box. The mode `bigint` reads `bigint` fields. The mode `checked` reads `number` fields with the overflow check. `SAFE=1` keeps the `tfdt` value below 2^53, so no value overflows.
- `series.sh` runs the second series of the RFC. The series compares variant E with variants C and F.

```sh
npm run build -w libs/iso-bmff
mkdir -p /tmp/bench && cd /tmp/bench && echo '{"type":"module"}' > package.json && ln -s <repo>/node_modules node_modules
python3 <repo>/plans/uint64-reader-config/bench/patch.py .
cp <repo>/plans/uint64-reader-config/bench/bench.ts .
node bench.ts base.js && node bench.ts variantC.js && node bench.ts variantC.js bigint

# The second series
node <repo>/plans/uint64-reader-config/bench/patch.ts .
cp <repo>/plans/uint64-reader-config/bench/series.sh . && bash series.sh 12
```

## `size/`

The size measurement for the Reference-level explanation of the RFC.

- `variants.ts` copies `libs/iso-bmff/src` to a directory and writes one patched copy per variant. The `proposal` variant is the design of the RFC. The `inView` variants hold string values and the code of both features in the view, as an earlier draft of the RFC did. The `writeInView` variant adds the two wide write methods to the write view. The `writeFunctions` variant has the same code as functions outside the view.
- `measure.sh` bundles every variant with `vp pack` and prints the minified, gzip, and brotli bytes with the growth over the base.

The directory must be outside the repo, so that `@svta/cml-utils` stays external.

```sh
node plans/uint64-reader-config/size/variants.ts /tmp/int64-size
bash plans/uint64-reader-config/size/measure.sh /tmp/int64-size
```
