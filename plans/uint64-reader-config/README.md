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
- `bench.ts` reads a buffer of 30000 boxes (`tfdt`, `mfhd`, `sidx`) with one variant and prints the median time per box.

```sh
npm run build -w libs/iso-bmff
mkdir -p /tmp/bench && cd /tmp/bench && echo '{"type":"module"}' > package.json && ln -s <repo>/node_modules node_modules
python3 <repo>/plans/uint64-reader-config/bench/patch.py .
cp <repo>/plans/uint64-reader-config/bench/bench.ts .
node bench.ts base.js && node bench.ts variantC.js && node bench.ts variantC.js bigint
```
