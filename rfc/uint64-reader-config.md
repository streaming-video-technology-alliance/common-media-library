---
status: accepted
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

A new option on `IsoBoxReadViewConfig` takes a function that reads every 64-bit integer field of the built-in readers. Without the option, the readers return today's values and today's types. With the exported function `readInt64AsBigInt`, the eleven affected box types have `bigint` fields, and the result type of `readIsoBoxes` follows the option without a cast.

```ts
import { readInt64AsBigInt, readIsoBoxes, readTfdt } from '@svta/cml-iso-bmff'

const boxes = readIsoBoxes(buffer, { int64: readInt64AsBigInt, readers: { tfdt: readTfdt } })

for (const box of boxes) {
	if (box.type === 'tfdt') {
		box.baseMediaDecodeTime // bigint
	}
}
```

A second exported function, `createInt64OverflowReader`, keeps `number` fields and reports a 64-bit value that a `number` cannot hold. The adopter passes a callback that throws or logs.

The option takes a function so that a bundler can remove a function that the adopter does not import. An adopter who uses neither function ships 47 more bytes after gzip.

Issue #611 calls the option `uint64`. This RFC proposes the name `int64`, because one affected field, `mediaTime` in `elst`, is signed.

The RFC also fixes a typing defect in `IsoBoxReaderReturn` that affects the documented workaround today. Section [Result type inference](#result-type-inference) describes the defect.

**Recommendation**: implement, in two pull requests. The first, [#614](https://github.com/streaming-video-technology-alliance/common-media-library/pull/614), fixed `IsoBoxReaderReturn` and is merged. The second adds the option. Section [Rationale and alternatives](#rationale-and-alternatives) gives the reasons, and section [Drawbacks](#drawbacks) gives the case against.

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
- The result type was wrong until #614. `IsoBoxReaderReturn` added every built-in box type to the result union, including the `tfdt` type that the custom reader replaces. `box.type === 'tfdt'` therefore narrowed to `number | bigint`, not `bigint`. The spike file `plans/uint64-reader-config/spike/published-types.ts` reproduces this against the published package, which does not have the fix yet.

## Guide-level explanation

### Turning the option on

Pass `int64: readInt64AsBigInt` in the reader configuration. The built-in readers then return every 64-bit field as a `bigint`, and the types follow.

```ts
import { defaultReaderConfig, readInt64AsBigInt, readIsoBoxes } from '@svta/cml-iso-bmff'

const boxes = readIsoBoxes(buffer, defaultReaderConfig({ int64: readInt64AsBigInt }))

for (const box of boxes) {
	if (box.type === 'sidx') {
		const seconds = Number(box.earliestPresentationTime / BigInt(box.timescale))
	}
}
```

`defaultReaderConfig` takes the option as an argument, because its readers are typed for the mode of the configuration. Spreading `defaultReaderConfig()` into a configuration with `readInt64AsBigInt` is a compile error.

The option also applies to a view that the adopter constructs directly, and to the child boxes of a container. A `moof` read with `readInt64AsBigInt` holds a `traf` whose `tfdt` has a `bigint` field, and the type of `box.boxes` says so.

### Version 0 boxes

A version 0 `tfdt` stores `baseMediaDecodeTime` in 32 bits. With `readInt64AsBigInt`, the reader returns that field as a `bigint` too. The field has one type for both versions, so the adopter does not branch on `version`.

### Custom readers

A custom reader written today does not change. A reader written as `(view: IsoBoxReadView) => ...` compiles without the option, and the result type keeps whatever the reader returns. An inline reader gets the type of its `view` parameter from the configuration, in both modes.

With `readInt64AsBigInt`, that reader is a compile error. `IsoBoxReadView` is the view of the default mode, and the reader would receive a `bigint` view. A custom reader that works in both modes has one of two forms. A reader that does not follow the option takes `IsoBoxReadView<IsoInt64>`, the view of either mode. Such a reader reads with `readUint` and `readUint64` as today. A reader that follows the option with `readWideUint` is generic over the field type:

```ts
import type { IsoBoxReadView, IsoInt64 } from '@svta/cml-iso-bmff'

const readTfdt = <V extends IsoInt64>(view: IsoBoxReadView<V>) => {
	const { version, flags } = view.readFullBox()
	return {
		type: 'tfdt' as const,
		version,
		flags,
		baseMediaDecodeTime: view.readWideUint(version === 1 ? 8 : 4),
	}
}
```

### Readers in a variable

A readers map that the adopter keeps in a variable gives the same types as an inline map. That holds for the built-in readers and for the custom readers written today.

One limit exists for a generic custom reader, such as `readTfdt` in the section above. TypeScript does not instantiate a generic reader in a variable. The wide fields of that reader then have the type `number | bigint`. A type argument in the map selects the mode:

```ts
const readers = { tfdt: readTfdt<bigint> }
const boxes = readIsoBoxes(buffer, { int64: readInt64AsBigInt, readers })
```

### Writing boxes back

The built-in writers accept a box with `number` fields and a box with `bigint` fields. A box read with `readInt64AsBigInt` writes back without conversion, and `IsoBoxWriteViewConfig` gets no option.

```ts
import { readInt64AsBigInt, readIsoBoxes, readTfdt, writeIsoBox, writeTfdt } from '@svta/cml-iso-bmff'

const [tfdt] = readIsoBoxes(buffer, { int64: readInt64AsBigInt, readers: { tfdt: readTfdt } })

if (tfdt?.type === 'tfdt') {
	tfdt.baseMediaDecodeTime += BigInt(90000)
	const bytes = writeIsoBox(tfdt, { writers: { tfdt: writeTfdt } })
}
```

### Detecting overflow without bigint

A player that keeps `number` fields can still find out when a value was rounded. `createInt64OverflowReader` takes a callback and returns a function for the `int64` option. The function reads a 64-bit field as a `number`, as today. When the value is outside the safe integer range, the function calls the callback with a `RangeError`. A callback that logs lets the read continue with the rounded value. A callback that throws stops the read.

```ts
import { createInt64OverflowReader, readIsoBoxes, readTfdt } from '@svta/cml-iso-bmff'

const boxes = readIsoBoxes(buffer, {
	int64: createInt64OverflowReader((error) => console.warn(error.message)),
	readers: { tfdt: readTfdt },
})
```

The function checks the 64-bit fields that the built-in readers read, in both versions of a box. It does not check `readUint(8)` in a custom reader. The option takes one function, so a configuration selects `bigint` fields or the overflow report, not both. With `bigint` fields nothing is rounded.

### Runtimes without BigInt

The package targets ES2019 and `BigInt` is ES2020. With the option absent, no code path references `BigInt`, so nothing changes for a runtime without it. `createInt64OverflowReader` does not need `BigInt` either. The check is `Number.isSafeInteger`. `readInt64AsBigInt` needs `BigInt` and does not test for it, like `readUint64`. On a runtime without `BigInt`, the first read of a 64-bit field fails with the error of the runtime. That error is a `TypeError` for an 8-byte field and a `ReferenceError` for a 4-byte field. An adopter that supports such a runtime tests `typeof BigInt === 'function'` before it passes the function.

## Reference-level explanation

### The option

```ts
/** The JavaScript type of a 64-bit integer field. */
export type IsoInt64 = number | bigint

/**
 * The value of the `int64` option. The function reads one integer field of 4 or 8 bytes.
 * The return type is the type of every 64-bit field in the result.
 */
export type IsoInt64Reader<V extends IsoInt64 = number> = (
	view: IsoBoxReadView<IsoInt64>,
	size: 4 | 8,
	signed: boolean,
) => V

/** The option is optional for the default mode and required for `bigint`. */
export type IsoBoxReadViewConfig<V extends IsoInt64 = number> = {
	readers?: NoInfer<IsoBoxReaderMap<V>>
} & ([V] extends [bigint] ? { int64: IsoInt64Reader<V> } : { int64?: IsoInt64Reader<V> })

/** Reads the field as a `bigint`. */
export declare function readInt64AsBigInt(view: IsoBoxReadView<IsoInt64>, size: 4 | 8, signed: boolean): bigint

/** Returns a function that reads the field as a `number` and reports a value outside the safe integer range. */
export declare function createInt64OverflowReader(onOverflow: (error: RangeError) => void): IsoInt64Reader
```

The type parameter `V` is the field type itself. TypeScript infers `V` from the return type of the function in `int64`. Without the option, `V` is `number`.

The conditional makes the option required when the type claims `bigint` fields. `readIsoBoxes<bigint>(buffer, {})` and `new IsoBoxReadView<bigint>(buffer)` are compile errors, so a type that promises `bigint` fields always has the function that produces them. The constructor uses a conditional rest parameter for the same rule. The second signature of `readIsoBoxes` and the first signature of `defaultReaderConfig` use the same rest parameter. `readIsoBoxes<bigint>(buffer)` and `defaultReaderConfig<bigint>()` are therefore compile errors too.

`readIsoBoxes` and `defaultReaderConfig` each end with a signature that has no type parameter:

```ts
export declare function readIsoBoxes(raw: IsoBoxData, config?: IsoBoxReadViewConfig): ParsedIsoBox[]
export declare function defaultReaderConfig(options?: { int64?: IsoInt64Reader }): IsoBoxReadViewConfig
```

A utility type such as `Parameters` or `ReturnType` resolves to the last signature of a function. With these signatures, `Parameters<typeof readIsoBoxes>`, `ReturnType<typeof readIsoBoxes>`, and `ReturnType<typeof defaultReaderConfig>` equal today's types. Without these signatures, `Parameters<typeof readIsoBoxes>` is `never`, and the two return types have the type argument `IsoInt64`.

The view calls the function for every field that a reader reads with `readWideUint` or `readWideInt`. The function receives the view, the size of the field in bytes, and whether the field is signed. The function reads the field with `readUint`, `readInt`, or `readUint64`, so the cursor of the view advances. The function must not call `readWideUint` or `readWideInt`, because those methods call the function.

`readInt64AsBigInt` returns `readUint64()` for 8 bytes, and `BigInt.asIntN(64, value)` of that value for a signed field. For 4 bytes the function returns `BigInt(readUint(4))`, or `BigInt(readInt(4))` for a signed field. Section [Overflow detection](#overflow-detection) describes `createInt64OverflowReader`. An adopter can also write a function of the type `IsoInt64Reader` and pass it.

### Types that gain a parameter

Every declaration below gains a type parameter `V extends IsoInt64 = number`. The default keeps every existing reference, such as `TrackFragmentBaseMediaDecodeTimeBox` or `ParsedIsoBox`, equal to today's type.

| Group | Declarations |
|---|---|
| Affected box types | `TrackFragmentBaseMediaDecodeTimeBox`, `SegmentIndexBox`, `TrackFragmentRandomAccessBox`, `ProducerReferenceTimeBox`, `EventMessageBoxV1` and `EventMessageBox`, `MovieExtendsHeaderBox`, `MovieHeaderBox`, `MediaHeaderBox`, `TrackHeaderBox`, `EditListBox`, `TrackFragmentHeaderBox` |
| Entry types | `TrackFragmentRandomAccessEntry`, `EditListEntry` |
| Containers of an affected box, and their child unions | `TrackFragmentBox`, `MovieFragmentBox`, `MovieBox`, `TrackBox`, `MediaBox`, `MovieExtendsBox`, `MovieFragmentRandomAccessBox`, `EditBox` |
| Maps and derived types | `IsoBoxMap`, `IsoBox`, `IsoBoxContainerMap`, `IsoBoxContainer`, `ParsedBox`, `ParsedIsoBox`, `IsoTypedParsedBox`, `IsoBoxReaderReturn` |
| Reader plumbing | `IsoBoxReadViewConfig`, `IsoBoxReadView`, `IsoBoxReader` (third parameter), `IsoBoxReaderMap` |
| Writer input | `IsoBoxStreamable`, and the box parameter of `IsoBoxWriter` |
| Functions | `readIsoBoxes`, `isIsoBoxType` (new first signature), `defaultReaderConfig` (new optional argument), and the 11 built-in readers of the affected boxes |

That is about 60 public declarations. Containers that hold no affected box, such as `SampleTableBox`, do not change. The 11 readers of the affected boxes are generic over the field type, because their return type uses the parameter.

`isIsoBoxType` takes `unknown` today, so TypeScript cannot infer the field type from the box. The function gains a first signature:

```ts
export declare function isIsoBoxType<T extends keyof IsoBoxMap, V extends IsoInt64 = number>(
	type: T,
	box: IsoBox<V> | { view: IsoBoxReadView<V> } | null | undefined,
): box is IsoBoxMap<V>[T]
```

A box from `readIsoBoxes` narrows to the built-in box type with the fields of its mode. The signature accepts `null` and `undefined`, so the result of `findIsoBox` narrows in the same way. The `unknown` signature does not change. A value of another type narrows to the built-in box type with `number` fields.

`isContainer` gains no type parameter. The constraint of its type parameter changes from `IsoBox` to `IsoBox<IsoInt64>`, so the function accepts a box of either mode.

The other 54 built-in readers gain no type parameter. The type of their view parameter changes from `IsoBoxReadView` to `IsoBoxReadView<IsoInt64>`, the view of either mode. Each of those readers then accepts a view of either mode, so the reader registers with and without the option.

The two reader factories, `createAudioSampleEntryReader` and `createVisualSampleEntryReader`, return a reader of the same form. Today, each factory returns a reader of the default view, and `readInt64AsBigInt` rejects that reader. The spike asserts these cases for a built-in reader and for a reader from a factory. The spike also asserts the assignment of such a reader to an `IsoBoxReaderMap`. `@svta/cml-drm` builds its readers map with that assignment.

Four exports are new: the types `IsoInt64` and `IsoInt64Reader`, and the functions `readInt64AsBigInt` and `createInt64OverflowReader`.

`writeIsoBox`, `writeIsoBoxes`, and `createIsoBoxReadableStream` take `IsoBoxStreamable<IsoInt64>`, and the writers of the affected boxes take the `IsoInt64` instantiation of their box. Both accept a box of either mode.

### New view methods

A wide field is one of the 64-bit integer fields in section [Motivation](#motivation). A wide field has 8 bytes, or 4 bytes in version 0 of its box. The four methods below read and write a wide field.

| Method | Signature | Behavior |
|---|---|---|
| `IsoBoxReadView.readWideUint` | `(size: 4 \| 8) => V` | Without the option, the same function as `readUint`. With the option, the result of `int64(view, size, false)`. |
| `IsoBoxReadView.readWideInt` | `(size: 4 \| 8) => V` | The signed form. Without the option, the same function as `readInt`. With the option, the result of `int64(view, size, true)`. |
| `IsoBoxWriteView.writeWideUint` | `(value: number \| bigint, size: 4 \| 8) => void` | A `number` goes to `writeUint(value, size)`. A `bigint` goes to `writeUint64` for 8 bytes and `writeUint(Number(value), 4)` for 4 bytes. Throws `RangeError` when a `bigint` does not fit the size. |
| `IsoBoxWriteView.writeWideInt` | `(value: number \| bigint, size: 4 \| 8) => void` | The signed form, with `DataView.setBigInt64`. |

`readUint`, `readInt`, `readUint64`, `writeUint`, `writeInt`, and `writeUint64` do not change. The built-in readers of the affected fields call the wide methods instead of `readUint(size)` and `readInt(size)`. The matching writers call the wide write methods.

The writer does not need an option. The value carries its own type, and `typeof value === 'bigint'` costs one check per 64-bit field.

### Overflow detection

The function that `createInt64OverflowReader` returns reads the field with `readUint` or `readInt`, as the built-in readers do today. The function then tests the `number` with `Number.isSafeInteger`. A 64-bit value is outside the safe integer range when its magnitude exceeds 2^53 - 1. The check needs no `BigInt` and no extra memory access. An earlier draft tested the high 32-bit word, as shaka-player does. For a signed field, that test did not report the value -2^53.

| Value | Behavior |
|---|---|
| Inside the range | The function returns the `number`, as today. |
| Outside the range | The function calls `onOverflow` with a `RangeError`. The message states that a 64-bit value is outside the safe integer range. The message does not contain the value. When `onOverflow` returns, the function returns the rounded `number`. When `onOverflow` throws, the read stops with that error. |

A 4-byte field never overflows, so a version 0 box never reports. `readUint(8)` and `readInt(8)` do not check, because they are on the path of every reader today and the check must not slow that path. A custom reader that wants the check calls `readWideUint`.

The `int64` option takes one function. A configuration selects `readInt64AsBigInt` or an overflow reader, so the two cannot conflict.

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

The proposal follows variant C on the default path. Without the option, the constructor assigns `readWideUint = this.readUint`. A reader of a 64-bit field then calls the same function it calls today, with no extra closure and no extra call. With the option, the constructor assigns a closure that calls the function of the option with the view. The option adds two costs to the default path: the comparison in the constructor, and two more fields on each view. The review of #645 measured 28 more bytes of memory for each `tfdt` box on Node 24. Variant D, a prototype method, has no per-instance cost. But the other view methods are arrow fields that readers destructure, and a prototype method would be the one exception.

A second series measures the path with the option. Variant E is the proposal. Variants C and F contain the code in the view: variant C the `bigint` read, and variant F the overflow check. Every cell is the range of 10 runs on Node 24, with the median in parentheses.

| Read | Code in the view, ns per box | Variant E, ns per box |
|---|---|---|
| `number` fields, no option | 692 to 876 (711), the base | |
| `bigint` fields | 712 to 1005 (942) | 740 to 957 (925) |
| `number` fields with the overflow check, no value overflows | 875 to 985 (946) | 774 to 1077 (960) |
| `number` fields with the overflow check, every `tfdt` overflows | 2227 to 2460 (2274) | 2156 to 2577 (2451) |

In the rows without overflow, variant E does not separate from the code in the view. In the last row, both variants create one `RangeError` for every `tfdt`, and that work dominates the time. The median of variant E is 8% higher in that row. The absolute times of the two series differ, so compare the rows of one series only.

The size cost has two parts. The view class is one unit for tree shaking, because its methods are arrow-function fields inside the constructor. Every adopter of `IsoBoxReadView` ships the code inside the view, with or without the option. The two exported functions are separate units, and a bundler removes a function that the adopter does not import.

The table shows the growth of a bundle that contains the view class. The bundler is `vp pack` of vite-plus 1.3.0 with minification, and `@svta/cml-utils` is external. The base bundle is 3783 bytes. After gzip the base bundle is 1566 bytes. The scripts are in `plans/uint64-reader-config/size`.

| The adopter | Growth in bytes, minified | Growth in bytes, after gzip |
|---|---|---|
| Does not set the option | 160 | 47 |
| Imports `readInt64AsBigInt` | 307 | 107 |
| Imports `createInt64OverflowReader` | 371 | 171 |
| Imports both functions | 518 | 230 |

The two rows with `createInt64OverflowReader` show the sizes of the implementation in #645. The high-word check of the earlier draft cost 35 more bytes after gzip.

Both exported functions have their smallest form. `readInt64AsBigInt` has no `BigInt` check, and the message of `createInt64OverflowReader` has no value. Section [Rejected in this RFC](#rejected-in-this-rfc) shows the cost of the larger forms.

A reader of an affected box changes one call from `readUint` to `readWideUint`. That adds a few bytes per reader, and only for the readers that the adopter imports. The wide write methods are fields of `IsoBoxWriteView`, so every adopter of the write view ships them. The two wide write methods add 120 bytes after gzip to a bundle that contains the write view. No module-level statement references `BigInt` or the option, so the tree-shaking behavior of the package does not change.

### Result type inference

The spike in `plans/uint64-reader-config/spike` models the plumbing with one affected box, one unaffected box, one container, and one reader factory. `spike.test-d.ts` compiles under TypeScript 6.0.3 with the root `tsconfig.json` options and under TypeScript 5.7.3, the minimum version that the type declarations support. The test asserts every case in the guide above and every compile error named in this RFC. It also asserts that every call without the option returns today's types.

Five details of the model need explanation, because they are not obvious from the code.

**One reader signature, parameterized by the field type.** `IsoBoxReaderMap<V>` is `Record<IsoBoxType, IsoBoxReader<unknown, IsoBoxType, V>>`, and every signature of `readIsoBoxes` uses it. TypeScript instantiates a generic function reference against a contextual type that has one call signature. With `int64: readInt64AsBigInt`, `readTfdt` in `{ readers: { tfdt: readTfdt } }` is instantiated with `bigint` before `IsoBoxReaderReturn` sees it. A plain `infer` then gives the `bigint` box type. The order of the configuration keys does not matter. The single signature also keeps contextual typing for an inline reader, so `view` in `{ test: (view) => ... }` has the view type of the configuration in both modes. A union of two signatures was tested and rejected. TypeScript gives an inline reader no contextual signature from a union, so `view` becomes `any`. That breaks today's inline readers under `noImplicitAny`. The published package types inline readers today, so that would be a regression.

**Inference of the field type.** TypeScript infers `V` from the return type of the `int64` function only. `NoInfer` on `readers` keeps the view parameter of every reader out of the inference. That has two consequences:

- Without the option, `V` is `number`. A reader that needs a `bigint` view then fails to type check, so that reader cannot be registered without the option.
- With `readInt64AsBigInt`, `V` is `bigint`. A reader of the `number` view, which is every custom reader written today, then fails to type check against the `bigint` view. This compile error needs the option to appear. Section [Compatibility](#compatibility) lists the type changes that appear without the option.

The built-in readers of unaffected boxes have no type parameter. Each reader takes `IsoBoxReadView<IsoInt64>`. The reader then registers in both modes and accepts a view of either mode in a direct call. `NoInfer` keeps that parameter type out of the inference of `V`.

**Readers in a variable.** A player can keep its readers map in a variable. TypeScript instantiates a generic reader only where the reader appears inside the call. For a generic reader in a variable, TypeScript uses the constraint `number | bigint` in place of the type parameter. Two parts of the design handle that case. `NoInfer` keeps the constraint out of the inference of `V`. And `IsoBoxReaderReturn` passes each return type through a helper type:

```ts
type IsoBoxOfMode<B, V extends IsoInt64> = B extends { type: infer T extends keyof IsoBoxMap }
	? [B] extends [IsoBoxMap<IsoInt64>[T]]
		? [IsoBoxMap<IsoInt64>[T]] extends [B]
			? IsoBoxMap<V>[T]
			: B
		: B
	: B
```

When a return type equals the built-in box with `number | bigint` fields, the helper type replaces it with the built-in box with `V` fields. Every other return type does not change. A map of built-in readers in a variable then gives today's types without the option, and `bigint` fields with `readInt64AsBigInt`. Section [Readers in a variable](#readers-in-a-variable) describes the one limit, for a generic custom reader.

The implementation writes the helper type inline in `IsoBoxReaderReturn`, so the package declares no type named `IsoBoxOfMode`. The inline form wraps `B` in a tuple and does not distribute over a union. A reader that returns a union, such as `readEmsg`, therefore gets `V` fields too. A reader that returns `any` keeps `any`.

**The default union.** Before #614, `IsoBoxReaderReturn<T>` was the union of the reader results and `ParsedIsoBox`, and `ParsedIsoBox` includes every built-in box type. A custom `tfdt` reader therefore narrowed to its own type or the built-in `tfdt` type. #614 excludes the box types that the required reader keys of `T` replace, with the `url` and `urn` aliases expanded. When a key is not a literal, every built-in type stays. The type binds the replaced types with an `extends infer R` clause and keeps one parameter. The option adds `V` as the second parameter and threads it into `ParsedBox` and `IsoBox`:

```ts
export type IsoBoxReaderReturn<T, V extends IsoInt64 = number> =
	| NonNullable<{ [K in keyof T]: NonNullable<T[K]> extends (...args: never[]) => infer B ? ParsedBox<IsoBoxOfMode<B, V>, V> : never }[keyof T]>
	| (ReplacedType<T> extends infer R ? ParsedBox<([string] extends [R] ? IsoBox<V> : Exclude<IsoBox<V>, { type: R }>) | Box, V> : never)
```

`ReplacedType<T>` stands for the inline mapped type of #614, and `IsoBoxOfMode<B, V>` stands for the inline helper type. The spike models the exclusion in its simpler form, with `keyof T`, because the model has no optional or aliased keys. The fix shipped on its own and is independent of the option.

**Variance of the view.** `IsoBoxReadView<bigint>` must be assignable to `IsoBoxReadView<IsoInt64>`, so that `IsoBoxStreamable<IsoInt64>` accepts a parsed box of either mode. The view therefore stores its readers as `IsoBoxReaderMap`, the default instantiation, and the function as `IsoInt64Reader<V>`. `V` then appears in return positions only. If the private field were `IsoBoxReadViewConfig<V>`, the readers would put `V` in a parameter position and make the view invariant. The constructor casts the readers once. The first parameter of `IsoInt64Reader` is the view of either mode, so one function reads from a view of any mode.

### Compatibility

- No runtime behavior changes when the option is absent. The default readers produce the same objects.
- One exception exists for a subclass of `IsoBoxReadView`. The constructor assigns the `readUint` and `readInt` of the base class to `readWideUint` and `readWideInt`. A subclass override of `readUint` or `readInt` therefore no longer runs for a 64-bit field of a built-in reader. An `int64` function that calls `view.readUint` and `view.readInt` runs the override.
- Every public type keeps its meaning when written without a type argument. The spike asserts this for the view, the parsed box types, and the result of `readIsoBoxes`.
- A readers map in a variable keeps today's types. The spike asserts this for the built-in readers and for a custom reader of the default view.
- The type declarations keep working on TypeScript 5.7. The spike compiles under 5.7.3.
- A function from `createInt64OverflowReader` changes no type. The result of `readIsoBoxes` is the same with and without it.
- `IsoBoxReadView<bigint>` is not assignable to `IsoBoxReadView<number>` or the reverse. Both are assignable to `IsoBoxReadView<IsoInt64>`. A generic reader accepts both, and so does a reader of `IsoBoxReadView<IsoInt64>`.
- With the option, one new compile error exists. A custom reader of the default view, `(view: IsoBoxReadView) => ...`, cannot be registered with `readInt64AsBigInt`. The fix is to type the view as `IsoBoxReadView<IsoInt64>`, or to make the reader generic.
- Without the option, three utility types change. A utility type over a generic declaration uses the constraint `number | bigint`.
  - `ReturnType<typeof readTfdt>` has `number | bigint` fields, and the other ten generic readers have the same change. The replacement is the box type, such as `TrackFragmentBaseMediaDecodeTimeBox`, or `ReturnType<typeof readTfdt<number>>`.
  - `InstanceType<typeof IsoBoxReadView>` and `Parameters<typeof readTfdt>[0]` are `IsoBoxReadView<IsoInt64>`. The replacement is the type `IsoBoxReadView`.
- `Required<IsoBoxReadViewConfig>` has a required `int64` key. The replacement for a configuration with required readers is `Required<Pick<IsoBoxReadViewConfig, 'readers'>>`.
- `Parameters<typeof readIsoBoxes>`, `ReturnType<typeof readIsoBoxes>`, and `ReturnType<typeof defaultReaderConfig>` do not change. Section [The option](#the-option) shows the signatures that keep those types.
- The API report `libs/iso-bmff/config/cml-iso-bmff.api.md` changes for every declaration in the table above. The report also changes for `isContainer`, for the other 54 built-in readers, and for the two reader factories.

## Drawbacks

- **Type parameter noise.** About 60 declarations gain a parameter. Hover text shows `TrackFragmentBaseMediaDecodeTimeBox<number>` where it shows `TrackFragmentBaseMediaDecodeTimeBox` today. Adopters who never set the option see the parameter in the affected box types and in their 11 readers. The other 54 readers show `IsoBoxReadView<IsoInt64>` as the type of the view.
- **Inference that depends on compiler details.** The design relies on three compiler behaviors. TypeScript instantiates a generic function against a contextual signature. `NoInfer` keeps the readers out of the inference. TypeScript uses the constraint for a generic reader in a variable. A future TypeScript release could change any of the three. The type tests from the spike move into the package test suite to guard all three.
- **Custom readers and the option.** A custom reader written today cannot be combined with `readInt64AsBigInt` without a change to its signature. The error is clear, and the fix is one type argument or one type parameter. The guide has to explain that step. A generic custom reader in a variable also needs a type argument.
- **Utility types.** Three utility types over the generic declarations change without the option. Section [Compatibility](#compatibility) lists the three types and the replacement for each.
- **A function as the option value.** The other options of the package take plain values. Here the adopter imports a function and passes it, and autocomplete does not list the two exported functions. Section [Rejected in this RFC](#rejected-in-this-rfc) shows the size cost of string values.
- **Duplicate methods.** The view gains two read methods that differ from `readUint` and `readInt` only in the option branch, and the writer gains two.
- **Size.** Every adopter of the read view ships the two wide read methods for a feature most of them do not use. Every adopter of the write view ships the two wide write methods. Section [Where the branch lives](#where-the-branch-lives) shows both costs.
- **Need.** Six fields can overflow in practice, and the known downstream adopter needs one of them. The custom reader with `readUint64` covers that adopter today, with the `IsoBoxReaderReturn` fix.

## Rationale and alternatives

### Why the option is worth its cost

The built-in readers return wrong values for valid files. The documented workaround is correct for one box and expensive for a player that needs exact `tfdt`, `sidx`, `tfra`, `prft`, `emsg`, and `elst` values. Such a player copies six readers and keeps them in step with the package. The option gives exact values and exact types for every 64-bit field with one line. Without the option, every read does the same work as today.

The alternative that the maintainers may prefer is to stop after #614. That fix makes the documented workaround type-correct, and the second pull request can wait for a second adopter who needs more than `tfdt`. The RFC asks the reviewers to make that call.

### Rejected in issue #611

- **Change the fields to `bigint`.** Breaks every adopter that does arithmetic on those fields. Not acceptable in a 1.x release.
- **Return `number | bigint` from `readUint(8)`.** Every caller branches on the type of the value.
- **A helper in `@svta/cml-utils`.** `readUint` is private to the package, and the method belongs next to it.

### Rejected in this RFC

- **A branch in the `read` dispatch.** A version 0 field would stay a `number` while a version 1 field became a `bigint`. That is the union that #611 rejected. See [Where the branch lives](#where-the-branch-lives).
- **A parallel set of box types**, such as `TrackFragmentBaseMediaDecodeTimeBox64` and `IsoBoxMap64`. Eleven box types, eight containers, and every derived type exist twice. The generic parameter with a default gives the same two instantiations from one declaration.
- **A conditional type keyed on the configuration literal**, such as `IsoBoxReaderReturn<R, C extends IsoBoxReadViewConfig>`. This is a notation for the same design. The box types still need a parameter, and the configuration type still carries the option. The generic parameter is the simpler notation.
- **A reader map that accepts readers of both views**, as a union of two signatures or as one signature with a union parameter. Both let a custom reader of the default view register with `readInt64AsBigInt`. The union of signatures removes the contextual typing of inline readers, and the union parameter does not instantiate the generic built-in readers with the option. See [Result type inference](#result-type-inference).
- **A second set of readers**, such as `readTfdt64`, with no option. The readers tree-shake perfectly and nothing branches at runtime. Against it: eleven near-duplicate exports, and no way to switch `defaultReaderConfig()` without a parameter that is an option by another name. The box types still need the parameter so that `ParsedIsoBox<bigint>` exists.
- **A `bigint` option on `IsoBoxWriteViewConfig`.** The value carries its type. The writers accept both and check `typeof` once per 64-bit field.
- **String values for the option, with the code in the view.** An earlier draft of this RFC had `int64: 'number' | 'bigint'` and a second option, `int64Overflow`, with the values `'ignore'`, `'throw'`, or a function. String values give autocomplete. But the view class then contains the code of both features, and every adopter ships that code. In that draft the view class grew by 381 bytes after gzip. The smallest form of that draft, a function-only `int64Overflow` with a short message, grew the view class by 294 bytes. The proposal grows the view class by 47 bytes.
- **Wide write functions outside the view.** Two exported functions, `writeWideUint(writer, value, size)` and `writeWideInt(writer, value, size)`, replace the two wide write methods. An adopter who writes no affected box then ships no code for the feature. An adopter who writes affected boxes without `elst` ships 27 fewer bytes after gzip than with the methods. An adopter who writes `elst` ships 26 more. The RFC keeps the methods, so that the read view and the write view have the same API. A custom reader and a custom writer each call a wide method of the view.
- **Generic readers of the unaffected boxes.** An earlier draft made all 65 built-in readers generic. In a reader of an unaffected box, the type parameter appears one time, so the parameter adds no type information. The API report would have 56 more type parameters. Each of the 54 readers and each reader factory would add one.
- **A `BigInt` check in `readInt64AsBigInt`.** The check throws a `TypeError` with its own message on a runtime without `BigInt`. The check costs 49 bytes after gzip, and it runs for every 64-bit field. Without the check, the read fails at the same field with the error of the runtime. `readUint64` and `writeUint64` have no such check either.
- **A value in the overflow message.** A message with the rounded value in decimal costs 12 more bytes after gzip. A message with the exact value in hexadecimal costs 31 more. The hexadecimal value and a sentence that names `readInt64AsBigInt` cost 57 more. The RFC keeps the message without a value. The documentation of `createInt64OverflowReader` names `readInt64AsBigInt` as the function that reads the exact value.
- **Throwing on overflow**, as shaka-player does. A thrown error at a `tfdt` read stops playback of a valid stream. The rounding bug is better than a hard stop, and the option removes both.

## Prior art

- shaka-player: `DataViewReader.readUint64` throws `JS_INTEGER_OVERFLOW` when the high word exceeds `0x1FFFFF`, that is, when the value reaches 2^53.
- hls.js: `mp4-tools.ts` builds 64-bit values as `number` from two 32-bit halves for `tfdt` and `sidx`. Only the `emsg` path checks `Number.isSafeInteger`.
- Both libraries predate `BigInt` in their minimum runtimes. CML targets ES2019 for the same reason, which is why the option is off by default and never references `BigInt` at module load.

## Unresolved questions

No open questions remain. The Final Decision section records the decisions.

## Future possibilities

- A major release could make `readInt64AsBigInt` the default. The default of the type parameter then changes to `bigint`, and adopters get a migration note.
- `IsoBoxReadView.readInt64`, the signed partner of `readUint64`, for custom readers of signed fields. Until then, `readInt64AsBigInt(view, 8, true)` reads a signed 64-bit field as a `bigint`.

## Final Decision

Accepted on 2026-11-11. The second pull request adds the option.

The working files of this RFC, in `plans/uint64-reader-config/`, are not on `main`. Commit 0718985e1 of #613 contains them.

Decided on 2026-11-10:

- **Option value.** The option takes an exported function, so a bundler removes the code that the adopter does not import.
- **Wide write methods.** The two wide write methods are fields of `IsoBoxWriteView`, so the read view and the write view have the same API.

Decided on 2026-11-11:

- **Names.** The option is `int64`. The view methods are `readWideUint`, `readWideInt`, `writeWideUint`, and `writeWideInt`. The exports are `readInt64AsBigInt`, `createInt64OverflowReader`, `IsoInt64Reader`, and `IsoInt64`.
- **Version 0 fields.** With `readInt64AsBigInt`, a version 0 field is a `bigint`, so each field has one type.
- **Scope.** The option covers every 64-bit field of the built-in readers.
- **Runtime without `BigInt`.** `readInt64AsBigInt` has no `BigInt` check. The read fails with the error of the runtime.
- **Readers of unaffected boxes.** The 54 readers and the readers from the two factories have no type parameter. Each takes `IsoBoxReadView<IsoInt64>`.
- **Overflow message.** The `RangeError` message has no value.

Amended on 2026-11-12, to match the implementation in [#645](https://github.com/streaming-video-technology-alliance/common-media-library/pull/645):

- **Overflow check.** `createInt64OverflowReader` tests the value with `Number.isSafeInteger`. The size table has the new numbers.
- **Required function.** `readIsoBoxes` and `defaultReaderConfig` use the conditional rest parameter of the constructor.
- **Signatures with no type parameter.** `readIsoBoxes` and `defaultReaderConfig` each end with such a signature, for the utility types.
- **`isIsoBoxType`.** A new first signature takes a box of either mode, `null`, or `undefined`. The type guard keeps the field type of the box.
- **`isContainer`.** The function gains no type parameter.
- **Helper type.** The helper type is inline in `IsoBoxReaderReturn`.
- **Compatibility.** The section now lists three utility types, `Required<IsoBoxReadViewConfig>`, and the subclass override.
- **Memory.** Each view has two more fields on the default path.

The `IsoBoxReaderReturn` fix shipped on its own in #614.
