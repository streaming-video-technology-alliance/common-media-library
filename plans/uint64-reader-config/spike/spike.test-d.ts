// Compile-time assertions for model.ts. `tsc --noEmit` on this file is the test.
// Every `@ts-expect-error` line must fail to compile, and every other line must compile.
import {
	isIsoBoxType,
	readIsoBoxes,
	readMfhd,
	readTfdt,
	type IsoBoxReadView,
	type ParsedBox,
	type ParsedIsoBox,
	type TrackFragmentBaseMediaDecodeTimeBox,
	type IsoInt64,
} from './model.ts'

type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Expect<T extends true> = T
/** Value-level assertion for block scopes, where a type alias cannot be exported. */
declare function expectType<T>(value: T): void
declare function expectEqual<A, B>(..._: Equal<A, B> extends true ? [] : [never]): void

declare const buffer: ArrayBuffer

// 1. No config. Today's types, unchanged.
const plain = readIsoBoxes(buffer)
export type _1 = Expect<Equal<typeof plain, ParsedIsoBox[]>>
export type _1b = Expect<Equal<typeof plain, ParsedIsoBox<'number'>[]>>
for (const box of plain) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, number>()
		void (box.baseMediaDecodeTime + 1)
	}
}

// 2. Config with readers only. Today's types, unchanged.
const defaults = readIsoBoxes(buffer, { readers: { tfdt: readTfdt, mfhd: readMfhd } })
for (const box of defaults) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, number>()
	}
	if (box.type === 'mfhd') {
		expectEqual<typeof box.sequenceNumber, number>()
	}
}

// 3. Explicit 'number'. Same as 2.
const explicitNumber = readIsoBoxes(buffer, { int64: 'number', readers: { tfdt: readTfdt } })
for (const box of explicitNumber) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, number>()
	}
}

// 4. 'bigint' with the built-in reader. The field is bigint, other fields are not.
const big = readIsoBoxes(buffer, { int64: 'bigint', readers: { tfdt: readTfdt, mfhd: readMfhd } })
for (const box of big) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, bigint>()
		expectEqual<typeof box.version, number>()
		void (box.baseMediaDecodeTime + BigInt(1))
	}
	if (box.type === 'mfhd') {
		expectEqual<typeof box.sequenceNumber, number>()
	}
}

// 5. 'bigint' with no readers. The default union follows the option, including containers.
const bigPlain = readIsoBoxes(buffer, { int64: 'bigint' })
export type _5 = Expect<Equal<typeof bigPlain, ParsedIsoBox<'bigint'>[]>>
for (const box of bigPlain) {
	if (box.type === 'traf') {
		for (const child of box.boxes) {
			if (child.type === 'tfdt') {
				expectEqual<typeof child.baseMediaDecodeTime, bigint>()
			}
		}
	}
	// Type guards follow the option too.
	if (isIsoBoxType('tfdt', box)) {
		expectEqual<typeof box.baseMediaDecodeTime, bigint>()
	}
}

// 6. A custom reader written today (non-generic, `view: IsoBoxReadView`) still compiles,
//    with and without the option, and keeps its own return type.
const readTfdtCustom = (view: IsoBoxReadView) => {
	const { version, flags } = view.readFullBox()
	return {
		type: 'tfdt' as const,
		version,
		flags,
		baseMediaDecodeTime: view.readUint(8),
		extra: 'x',
	}
}
const custom = readIsoBoxes(buffer, { readers: { tfdt: readTfdtCustom } })
for (const box of custom) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, number>()
		expectEqual<typeof box.extra, string>()
	}
}
// With the option on, a custom reader that returns number keeps returning number.
// The option only changes the built-in readers.
const customBig = readIsoBoxes(buffer, { int64: 'bigint', readers: { tfdt: readTfdtCustom } })
for (const box of customBig) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, number>()
		expectEqual<typeof box.extra, string>()
	}
}

// 7. The readUint64 custom reader from the guide keeps working and keeps its bigint.
const readTfdt64 = (view: IsoBoxReadView) => {
	const { version, flags } = view.readFullBox()
	const baseMediaDecodeTime = version === 1 ? view.readUint64() : BigInt(view.readUint(4))
	return { type: 'tfdt' as const, version, flags, baseMediaDecodeTime }
}
const guide = readIsoBoxes(buffer, { readers: { tfdt: readTfdt64 } })
for (const box of guide) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, bigint>()
	}
}

// 8. A custom reader can opt in to the option by being generic, like the built-in readers.
const readTfdtAware = <I extends IsoInt64>(view: IsoBoxReadView<I>) => {
	const { version, flags } = view.readFullBox()
	return {
		type: 'tfdt' as const,
		version,
		flags,
		baseMediaDecodeTime: view.readWideUint(version === 1 ? 8 : 4),
	}
}
const aware = readIsoBoxes(buffer, { int64: 'bigint', readers: { tfdt: readTfdtAware } })
for (const box of aware) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, bigint>()
	}
}
const awareNumber = readIsoBoxes(buffer, { readers: { tfdt: readTfdtAware } })
for (const box of awareNumber) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, number>()
	}
}

// 9. The option value is checked.
// @ts-expect-error 'string' is not a IsoInt64
readIsoBoxes(buffer, { int64: 'string' })

// 10. A box read with bigint is not assignable to the number type, and the other way round.
declare const tfdtBig: TrackFragmentBaseMediaDecodeTimeBox<'bigint'>
declare const tfdtNum: TrackFragmentBaseMediaDecodeTimeBox
// @ts-expect-error a bigint box is not a number box
export const asNumber: TrackFragmentBaseMediaDecodeTimeBox = tfdtBig
// @ts-expect-error a number box is not a bigint box
export const asBig: TrackFragmentBaseMediaDecodeTimeBox<'bigint'> = tfdtNum

// 11. Today's one-parameter public types still resolve.
export type _11 = Expect<
	Equal<ParsedBox<TrackFragmentBaseMediaDecodeTimeBox>['baseMediaDecodeTime'], number>
>

// 12. A variable typed with today's view type accepts only a number view.
declare const bigView: IsoBoxReadView<'bigint'>
// @ts-expect-error a bigint view is not a number view
export const numView: IsoBoxReadView = bigView
