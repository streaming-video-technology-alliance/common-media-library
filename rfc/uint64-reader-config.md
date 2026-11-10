---
status: draft
---

# RFC: `int64` reader option for exact 64-bit fields

| | |
|---|---|
| **Author** | Casey Occhialini |
| **Date** | 2026-11-09 |
| **Package** | `@svta/cml-iso-bmff` |
| **Breaking change** | No |
| **Issue** | [#611](https://github.com/streaming-video-technology-alliance/common-media-library/issues/611) |

## Summary

A new option on `IsoBoxReadViewConfig` selects the JavaScript type of every 64-bit integer field that the built-in readers return. The default is `'number'`. It keeps today's values and today's types. With `'bigint'`, the eleven affected box types carry `bigint` fields, and the result type of `readIsoBoxes` follows the option without a cast.

```ts
import { readIsoBoxes, readTfdt } from '@svta/cml-iso-bmff'

const boxes = readIsoBoxes(buffer, { int64: 'bigint', readers: { tfdt: readTfdt } })

for (const box of boxes) {
	if (box.type === 'tfdt') {
		box.baseMediaDecodeTime // bigint
	}
}
```

Issue #611 calls the option `uint64`. This RFC proposes the name `int64`, because one affected field, `mediaTime` in `elst`, is signed.

The RFC also fixes a typing defect in `IsoBoxReaderReturn` that affects the documented workaround today. Section [Result type inference](#result-type-inference) describes the defect.

**Recommendation**: implement, in two pull requests. The first pull request fixes `IsoBoxReaderReturn`. The second adds the option. Section [Rationale and alternatives](#rationale-and-alternatives) gives the reasons, and section [Drawbacks](#drawbacks) gives the case against.

## Motivation

A `number` holds integers up to 2^53 - 1 exactly. `IsoBoxReadView.readUint(8)` assembles two 32-bit halves into a `number`, so a 64-bit field above that limit rounds to an even value. Every built-in reader of a 64-bit field uses that path.

The limit is reached in practice. Smooth Streaming and some DASH live encoders write `tfdt` with a 10 MHz timescale and a wall-clock origin. The current Unix time in 10 MHz ticks is about 1.79e16. 2^53 is about 9.01e15. The built-in `tfdt` reader returns a wrong `baseMediaDecodeTime` for such a segment. A player that adjusts the value and writes the segment back corrupts the timestamp. The library's sixth priority is spec compliance, and a reader that returns a wrong value for a valid file does not meet it.

The affected fields, all 64 bits in version 1 of the box and 32 bits in version 0 unless noted:

| Box | Field | Signed | Reaches 2^53 in practice |
|---|---|---|---|
| `tfdt` | `baseMediaDecodeTime` | no | yes, at 10 MHz |
| `sidx` | `earliestPresentationTime` | no | yes, at 10 MHz |
| `sidx` | `firstOffset` | no | no, a byte offset |
| `tfra` | `time` (per entry) | no | yes, at 10 MHz |
| `tfra` | `moofOffset` (per entry) | no | no, a byte offset |
| `prft` | `mediaTime` | no | yes, at 10 MHz |
| `emsg` | `presentationTime` (64 bits in every version 1 box) | no | yes, at 10 MHz |
| `mehd` | `fragmentDuration` | no | rarely, a duration |
| `mvhd` | `creationTime`, `modificationTime`, `duration` | no | no, seconds since 1904 and a duration |
| `mdhd` | `creationTime`, `modificationTime`, `duration` | no | no |
| `tkhd` | `creationTime`, `modificationTime`, `duration` | no | no |
| `elst` | `segmentDuration` (per entry) | no | rarely |
| `elst` | `mediaTime` (per entry) | yes | yes, at 10 MHz |
| `tfhd` | `baseDataOffset` (64 bits in every box that sets the flag) | no | no, a byte offset |

The option covers every row, so an adopter does not need to know which fields can overflow. The practical value is in the six time fields.

`largesize` on the box header is not in the table. It is a byte count, the reader uses it in arithmetic, and no file reaches 2^53 bytes. It stays a `number`.

### The extension point today

PR #612 added `IsoBoxReadView.readUint64`, which returns a `bigint`, and the matching `IsoBoxWriteView.writeUint64`. The reading guide shows a custom `tfdt` reader that uses it. The custom reader works, with two limits:

- The adopter copies one reader per affected box. A `sidx` reader with its reference loop is about 40 lines, and `mvhd` has 14 fields.
- The result type is wrong. `IsoBoxReaderReturn` adds every built-in box type to the result union, including the `tfdt` type that the custom reader replaces. `box.type === 'tfdt'` therefore narrows to `number | bigint`, not `bigint`. The spike file `plans/uint64-reader-config/spike/published-types.ts` reproduces this against the published package.

## Guide-level explanation

### Turning the option on

Pass `int64: 'bigint'` in the reader configuration. The built-in readers then return every 64-bit field as a `bigint`, and the types follow.

```ts
import { defaultReaderConfig, readIsoBoxes } from '@svta/cml-iso-bmff'

const boxes = readIsoBoxes(buffer, defaultReaderConfig({ int64: 'bigint' }))

for (const box of boxes) {
	if (box.type === 'sidx') {
		const seconds = Number(box.earliestPresentationTime / BigInt(box.timescale))
	}
}
```

`defaultReaderConfig` takes the option as an argument, because its readers are typed for the mode of the configuration. Spreading `defaultReaderConfig()` into a `'bigint'` configuration is a compile error.

The option also applies to a view that the adopter constructs directly, and to the child boxes of a container. A `moof` read with `int64: 'bigint'` holds a `traf` whose `tfdt` has a `bigint` field, and the type of `box.boxes` says so.

### Version 0 boxes

A version 0 `tfdt` stores `baseMediaDecodeTime` in 32 bits. With `int64: 'bigint'`, the reader returns that field as a `bigint` too. The field has one type for both versions, so the adopter does not branch on `version`.

### Custom readers

A custom reader written today does not change. A reader written as `(view: IsoBoxReadView) => ...` compiles without the option, and the result type keeps whatever the reader returns. An inline reader gets the type of its `view` parameter from the configuration, in both modes.

With the option on, that reader is a compile error. `IsoBoxReadView` is the view of the default mode, and the reader would receive a `bigint` view. A custom reader that works in both modes is generic over the option, like the built-in readers. The generic reader may follow the option with `readWideUint`, or ignore it and read with `readUint` and `readUint64` as today:

```ts
import type { IsoBoxReadView, IsoInt64 } from '@svta/cml-iso-bmff'

const readTfdt = <I extends IsoInt64>(view: IsoBoxReadView<I>) => {
	const { version, flags } = view.readFullBox()
	return {
		type: 'tfdt' as const,
		version,
		flags,
		baseMediaDecodeTime: view.readWideUint(version === 1 ? 8 : 4),
	}
}
```

### Writing boxes back

The built-in writers accept a box with `number` fields and a box with `bigint` fields. A box read with `int64: 'bigint'` writes back without conversion, and `IsoBoxWriteViewConfig` gets no option.

```ts
import { readIsoBoxes, readTfdt, writeIsoBox, writeTfdt } from '@svta/cml-iso-bmff'

const [tfdt] = readIsoBoxes(buffer, { int64: 'bigint', readers: { tfdt: readTfdt } })

if (tfdt?.type === 'tfdt') {
	tfdt.baseMediaDecodeTime += BigInt(90000)
	const bytes = writeIsoBox(tfdt, { writers: { tfdt: writeTfdt } })
}
```

### Runtimes without BigInt

The package targets ES2019 and `BigInt` is ES2020. With the option off, or absent, no code path references `BigInt`, so nothing changes for a runtime without it. With `int64: 'bigint'` on such a runtime, the `IsoBoxReadView` constructor throws a `TypeError` that names the option and the missing global.

## Reference-level explanation

### The option

```ts
/** The JavaScript type of a 64-bit integer field. */
export type IsoInt64 = 'number' | 'bigint'

/** Resolves the option to the field type. */
export type IsoInt64Value<I extends IsoInt64> = { number: number; bigint: bigint }[I]

/** The option is optional for the default mode and required for `'bigint'`. */
export type IsoBoxReadViewConfig<I extends IsoInt64 = 'number'> = {
	readers?: IsoBoxReaderMap<I>
} & ([I] extends ['bigint'] ? { int64: I } : { int64?: I })
```

The conditional makes the option required when the type claims `bigint` fields. `readIsoBoxes<'bigint'>(buffer, {})` and `new IsoBoxReadView<'bigint'>(buffer)` are compile errors, so a type that promises `bigint` fields always has the option that produces them. The constructor uses a conditional rest parameter for the same rule.

### Types that gain a parameter

Every declaration below gains a type parameter `I extends IsoInt64 = 'number'`. The default keeps every existing reference, such as `TrackFragmentBaseMediaDecodeTimeBox` or `ParsedIsoBox`, equal to today's type.

| Group | Declarations |
|---|---|
| Affected box types | `TrackFragmentBaseMediaDecodeTimeBox`, `SegmentIndexBox`, `TrackFragmentRandomAccessBox`, `ProducerReferenceTimeBox`, `EventMessageBoxV1` and `EventMessageBox`, `MovieExtendsHeaderBox`, `MovieHeaderBox`, `MediaHeaderBox`, `TrackHeaderBox`, `EditListBox`, `TrackFragmentHeaderBox` |
| Entry types | `TrackFragmentRandomAccessEntry`, `EditListEntry` |
| Containers of an affected box, and their child unions | `TrackFragmentBox`, `MovieFragmentBox`, `MovieBox`, `TrackBox`, `MediaBox`, `MovieExtendsBox`, `MovieFragmentRandomAccessBox`, `EditBox` |
| Maps and derived types | `IsoBoxMap`, `IsoBox`, `IsoBoxContainerMap`, `IsoBoxContainer`, `ParsedBox`, `ParsedIsoBox`, `IsoTypedParsedBox`, `IsoBoxReaderReturn` |
| Reader plumbing | `IsoBoxReadViewConfig`, `IsoBoxReadView`, `IsoBoxReader` (third parameter), `IsoBoxReaderMap` |
| Writer input | `IsoBoxStreamable`, and the box parameter of `IsoBoxWriter` |
| Functions | `readIsoBoxes`, `isIsoBoxType`, `isContainer`, `defaultReaderConfig` (new optional argument), and all 66 built-in readers |

That is about 100 public declarations. Containers that hold no affected box, such as `SampleTableBox`, do not change. Every built-in reader becomes generic over the option, because every reader has to accept a view of either mode. The 11 readers of affected boxes use the parameter in their return type. The other 55 do not. Section [Result type inference](#result-type-inference) explains why a non-generic reader of the wide view does not work.

`writeIsoBox`, `writeIsoBoxes`, and `createIsoBoxReadableStream` take `IsoBoxStreamable<IsoInt64>`, and the writers of the affected boxes take the `IsoInt64` instantiation of their box. Both accept a box of either mode.

### New view methods

| Method | Signature | Behavior |
|---|---|---|
| `IsoBoxReadView.readWideUint` | `(size: 4 \| 8) => IsoInt64Value<I>` | With `'number'`, the same function as `readUint`. With `'bigint'`, `readUint64()` for 8 bytes and `BigInt(readUint(4))` for 4 bytes. |
| `IsoBoxReadView.readWideInt` | `(size: 4 \| 8) => IsoInt64Value<I>` | The signed form. Uses `DataView.getBigInt64` for 8 bytes and `BigInt(readInt(4))` for 4 bytes. |
| `IsoBoxWriteView.writeWideUint` | `(value: number \| bigint, size: 4 \| 8) => void` | A `number` goes to `writeUint(value, size)`. A `bigint` goes to `writeUint64` for 8 bytes and `writeUint(Number(value), 4)` for 4 bytes. Throws `RangeError` when a `bigint` does not fit the size. |
| `IsoBoxWriteView.writeWideInt` | `(value: number \| bigint, size: 4 \| 8) => void` | The signed form, with `DataView.setBigInt64`. |

`readUint`, `readInt`, `readUint64`, `writeUint`, `writeInt`, and `writeUint64` do not change. The built-in readers of the affected fields call the wide methods instead of `readUint(size)` and `readInt(size)`. The matching writers call the wide write methods.

The writer does not need an option. The value carries its own type, and `typeof value === 'bigint'` costs one check per 64-bit field.

### Where the branch lives

The branch lives in the four wide methods, not in the `read` dispatch, for two reasons:

1. A branch in `read(UINT, 8)` cannot give a version 0 field the `bigint` type, because the dispatch sees a 4-byte read. The reader must say that the field is a wide field. A call to a different method says it.
2. `readUint` and `read` stay on the path they are on today. The option costs nothing on a read of any other field.

The benchmark in `plans/uint64-reader-config/bench` compares the built package against four patched copies. It reads 30000 boxes (`tfdt` version 1, `mfhd`, `sidx` version 1) with three readers and reports the median time per box. Variants B, C, and D ran six times with the option off and three times with the option on, on Node 24. Variant A ran four times in each mode in an earlier series, where the base ranged from 1140 to 1314.

| Variant | Where the branch lives | Option off, ns per box (min to max) | Option on, ns per box |
|---|---|---|---|
| Base | No option | 1140 to 1776 | |
| A | In the `read` dispatch, on size 8 | 1144 to 1275 | 1169 to 1361 |
| B | In a `readWideUint` arrow field, one more closure per view | 959 to 1531 | 1134 to 1576 |
| C | Chosen in the constructor. Off: an alias of `readUint` | 1236 to 1281 | 741 to 1574 |
| D | In a `readWideUint` prototype method | 1118 to 1304 | 1216 to 1296 |

No variant separates from the base. The spread between runs of one variant is larger than the difference between variants. Two things dominate the cost of one box. The constructor of its `IsoBoxReadView` allocates about twenty arrow-function fields, and a generator yields the box. One more property read and comparison per 64-bit field does not register against that.

The proposal is variant C. With the option off, the constructor assigns `readWideUint = this.readUint`. A reader of a 64-bit field then calls the same function it calls today, with no extra closure and no extra call. With the option on, the constructor assigns a closure that holds the branch. The one cost that the option adds to the default path is the comparison in the constructor. Variant D, a prototype method, has no per-instance cost either. But the other view methods are arrow fields that readers destructure, and a prototype method would be the one exception.

The size cost is in the view class, not in the readers. Variant B, which adds one wide read method, is 201 bytes larger than the base build before minification and 55 bytes larger after gzip. The two read methods together add about 400 bytes of source and about 110 bytes after gzip. Every adopter of `IsoBoxReadView` carries both methods, because the class is one unit for tree shaking. A reader of an affected box changes one call from `readUint` to `readWideUint`. That adds a few bytes per reader, and only for the readers that the adopter imports. The wide write methods ship only with `IsoBoxWriteView`. No module-level statement references `BigInt` or the option, so the tree-shaking behavior of the package does not change.

### Result type inference

The spike in `plans/uint64-reader-config/spike` models the plumbing with one affected box, one unaffected box, and one container. `spike.test-d.ts` compiles under TypeScript 6.0.3 with the root `tsconfig.json` options and under TypeScript 5.7.3, the minimum version that the type declarations support. The test asserts every case in the guide above and every compile error named in this RFC. It also asserts that every call without the option returns today's types.

Three details of the model need explanation, because they are not obvious from the code.

**One reader signature, parameterized by the option.** `IsoBoxReaderMap<I>` is `Record<IsoBoxType, IsoBoxReader<unknown, IsoBoxType, I>>`, and both overloads of `readIsoBoxes` use it. TypeScript instantiates a generic function reference against a contextual type that has one call signature. With `int64: 'bigint'`, `readTfdt` in `{ readers: { tfdt: readTfdt } }` is instantiated with `'bigint'` before `IsoBoxReaderReturn` sees it. A plain `infer` then gives the `bigint` box type. The order of the configuration keys does not matter. The single signature also keeps contextual typing for an inline reader, so `view` in `{ test: (view) => ... }` has the view type of the configuration in both modes. A union of two signatures was tested and rejected. TypeScript gives an inline reader no contextual signature from a union, so `view` becomes `any`. That breaks today's inline readers under `noImplicitAny`. The published package types inline readers today, so that would be a regression.

**Inference of the option from the readers.** TypeScript infers `I` from `int64` and from the view parameter of every non-generic reader in the map. That has three consequences:

- A reader of the `'bigint'` view infers `'bigint'`, and the configuration type then requires `int64: 'bigint'`. A reader that needs a `bigint` view cannot be registered without the option.
- A reader of the `'number'` view, which is every custom reader written today, infers `'number'`. With `int64: 'bigint'` the two candidates conflict, TypeScript keeps the explicit option, and the reader fails to type check against the `bigint` view. This is the one new compile error for existing code, and it needs the option to appear.
- A non-generic reader of the wide view `IsoBoxReadView<IsoInt64>` infers the full union, and every 64-bit field becomes `number | bigint`. The built-in readers of unaffected boxes are therefore generic over the option. A generic function adds no inference candidate, and it accepts a view of either mode when called directly. `NoInfer` was tested as the alternative and rejected, because it also stops the contextual instantiation of the generic readers.

**The default union.** Today `IsoBoxReaderReturn<R>` is the union of the reader results and `ParsedIsoBox`, and `ParsedIsoBox` includes every built-in box type. A custom `tfdt` reader therefore narrows to its own type or the built-in `tfdt` type. The fix excludes the box types that `R` overrides:

```ts
export type IsoBoxReaderReturn<R, I extends IsoInt64 = 'number'> =
	| { [K in keyof R]: R[K] extends (...args: never[]) => infer B ? ParsedBox<B, I> : never }[keyof R]
	| ParsedBox<Exclude<IsoBox<I>, { type: keyof R }> | Box, I>
```

The fix is independent of the option. It makes the result of a `readUint64` custom reader `bigint` instead of `number | bigint`. A custom reader that adds a field sees that field after narrowing. The change narrows a result type, so existing assignments keep compiling. The first pull request ships this fix alone.

**Variance of the view.** `IsoBoxReadView<'bigint'>` must be assignable to `IsoBoxReadView<IsoInt64>`, so that `IsoBoxStreamable<IsoInt64>` accepts a parsed box of either mode. The view therefore stores its readers as `IsoBoxReaderMap`, the default instantiation, and the option as `I`. If the private field were `IsoBoxReadViewConfig<I>`, the readers would put `I` in a parameter position and make the view invariant. The constructor casts the readers once.

### Compatibility

- No runtime behavior changes when the option is absent. The default readers produce the same objects.
- Every public type keeps its meaning when written without a type argument. The spike asserts this for the view, the parsed box types, and the result of `readIsoBoxes`.
- The type declarations keep working on TypeScript 5.7. The spike compiles under 5.7.3.
- `IsoBoxReadView<'bigint'>` is not assignable to `IsoBoxReadView<'number'>` or the reverse. Both are assignable to `IsoBoxReadView<IsoInt64>`, and a generic reader accepts both.
- One new compile error exists, and only with the option on. A custom reader of the default view, `(view: IsoBoxReadView) => ...`, cannot be registered with `int64: 'bigint'`. The fix is to make the reader generic.
- The API report `libs/iso-bmff/config/cml-iso-bmff.api.md` changes for every declaration in the table above.

## Drawbacks

- **Type parameter noise.** About 100 declarations gain a parameter, including all 66 built-in readers. Hover text shows `TrackFragmentBaseMediaDecodeTimeBox<"number">` where it shows `TrackFragmentBaseMediaDecodeTimeBox` today. Adopters who never set the option see the parameter in every box type and every reader.
- **Inference that depends on compiler details.** The design relies on two compiler behaviors. TypeScript instantiates a generic function against a contextual signature, and some reader parameters add inference candidates. A future TypeScript release could change either. The type tests from the spike move into the package test suite to guard both.
- **Custom readers and the option.** A custom reader written today cannot be combined with `int64: 'bigint'` without a change to its signature. The error is clear and the fix is one type parameter, but it is a step that the guide has to explain.
- **Duplicate methods.** The view gains two read methods that differ from `readUint` and `readInt` only in the option branch, and the writer gains two.
- **Size.** Every adopter of the read view carries the two wide read methods for a feature most of them do not use. Together they add about 400 bytes of source and about 110 bytes after gzip.
- **Need.** Six fields can overflow in practice, and the known downstream adopter needs one of them. The custom reader with `readUint64` covers that adopter today, with the `IsoBoxReaderReturn` fix.

## Rationale and alternatives

### Why the option is worth its cost

The built-in readers return wrong values for valid files. The documented workaround is correct for one box and expensive for a player that needs exact `tfdt`, `sidx`, `tfra`, `prft`, `emsg`, and `elst` values. Such a player copies six readers and keeps them in step with the package. The option gives exact values and exact types for every 64-bit field with one line, and it costs nothing when it is off.

The alternative that the maintainers may prefer is to stop after the first pull request. That fix makes the documented workaround type-correct, and the second pull request can wait for a second adopter who needs more than `tfdt`. The RFC asks the reviewers to make that call.

### Rejected in issue #611

- **Change the fields to `bigint`.** Breaks every adopter that does arithmetic on those fields. Not acceptable in a 1.x release.
- **Return `number | bigint` from `readUint(8)`.** Every caller branches on the type of the value.
- **A helper in `@svta/cml-utils`.** `readUint` is private to the package, and the method belongs next to it.

### Rejected in this RFC

- **A branch in the `read` dispatch.** A version 0 field would stay a `number` while a version 1 field became a `bigint`. That is the union that #611 rejected. See [Where the branch lives](#where-the-branch-lives).
- **A parallel set of box types**, such as `TrackFragmentBaseMediaDecodeTimeBox64` and `IsoBoxMap64`. Eleven box types, eight containers, and every derived type exist twice. The generic parameter with a default gives the same two instantiations from one declaration.
- **A conditional type keyed on the configuration literal**, such as `IsoBoxReaderReturn<R, C extends IsoBoxReadViewConfig>`. This is a notation for the same design. The box types still need a parameter, and the configuration type still carries the option. The generic parameter is the simpler notation.
- **A reader map that accepts readers of both views**, as a union of two signatures or as one signature with a union parameter. Both let a custom reader of the default view register with the option on. The union of signatures removes the contextual typing of inline readers, and the union parameter does not instantiate the generic built-in readers with the option. See [Result type inference](#result-type-inference).
- **Non-generic readers of the wide view** for the unaffected boxes. The wide parameter adds the full union as an inference candidate, and every call without the option gets `number | bigint` fields.
- **A second set of readers**, such as `readTfdt64`, with no option. The readers tree-shake perfectly and nothing branches at runtime. Against it: eleven near-duplicate exports, and no way to switch `defaultReaderConfig()` without a parameter that is an option by another name. The box types still need the parameter so that `ParsedIsoBox<'bigint'>` exists.
- **A `bigint` option on `IsoBoxWriteViewConfig`.** The value carries its type. The writers accept both and check `typeof` once per 64-bit field.
- **Throwing on overflow**, as shaka-player does. A thrown error at a `tfdt` read stops playback of a valid stream. The rounding bug is better than a hard stop, and the option removes both.

## Prior art

- shaka-player: `DataViewReader.readUint64` throws `JS_INTEGER_OVERFLOW` when the high word exceeds `0x1FFFFF`, that is, when the value reaches 2^53.
- hls.js: `mp4-tools.ts` builds 64-bit values as `number` from two 32-bit halves for `tfdt` and `sidx`. Only the `emsg` path checks `Number.isSafeInteger`.
- Both libraries predate `BigInt` in their minimum runtimes. CML targets ES2019 for the same reason, which is why the option is off by default and never references `BigInt` at module load.

## Unresolved questions

1. **Name.** `int64` as proposed, `uint64` as in #611, or a boolean such as `bigint: true`. The literal union matches the package's other options and gives autocomplete.
2. **Method names.** `readWideUint` and `readWideInt`, or another word for "follows the option". Overloading `readUint64` was rejected, because it returns `bigint` without the option today.
3. **Version 0 fields.** This RFC gives them the `bigint` type with the option on, for one field type per box. The alternative, `bigint` in version 1 only, is the rejected union.
4. **Scope.** All 64-bit fields, as proposed, or the six time fields only. The RFC prefers all, so the adopter does not need the table in [Motivation](#motivation).
5. **BigInt-less runtime with the option on.** Throw in the constructor, as proposed, or throw at the first 64-bit read.
6. **Ship the `IsoBoxReaderReturn` fix first.** The RFC proposes a separate pull request. Reviewers may prefer one.
7. **Generic unaffected readers.** All 66 built-in readers become generic so that each accepts a view of either mode. The alternative keeps the 55 unaffected readers as they are, and a direct call with a `bigint` view then needs a cast.

## Future possibilities

- A major release could flip the default to `'bigint'`. The type parameter makes that a one-line change in the declarations and a migration note for adopters.
- `IsoBoxReadView.readInt64`, the signed partner of `readUint64`, for custom readers of signed fields. `readWideInt` needs the same `getBigInt64` call, so the method falls out of the implementation.

## Final Decision

Pending review.
