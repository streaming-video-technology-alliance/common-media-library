// Compile-time assertions for model.ts. `tsc --noEmit` on this file is the test.
// Every `@ts-expect-error` line must fail to compile, and every other line must compile.
import {
	defaultReaderConfig,
	IsoBoxReadView,
	isIsoBoxType,
	readIsoBoxes,
	readMfhd,
	readTfdt,
	writeIsoBox,
	writeTfdt,
	type IsoInt64,
	type ParsedBox,
	type ParsedIsoBox,
	type TrackFragmentBaseMediaDecodeTimeBox,
} from './model.ts'

type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Expect<T extends true> = T
/** Value-level assertion for block scopes, where a type alias cannot be exported. */
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

// 4. 'bigint' with the built-in readers. The field is bigint, other fields are not.
//    The order of the configuration keys does not matter.
const big = readIsoBoxes(buffer, { int64: 'bigint', readers: { tfdt: readTfdt, mfhd: readMfhd } })
const bigReversed = readIsoBoxes(buffer, { readers: { tfdt: readTfdt }, int64: 'bigint' })
for (const box of [...big, ...bigReversed]) {
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

// 6. An inline reader gets its `view` parameter from context, in both modes.
const inlineNumber = readIsoBoxes(buffer, {
	readers: { test: view => ({ type: 'test' as const, value: view.readUint(4) }) },
})
for (const box of inlineNumber) {
	if (box.type === 'test') {
		expectEqual<typeof box.value, number>()
	}
}
const inlineBig = readIsoBoxes(buffer, {
	int64: 'bigint',
	readers: {
		test: view => ({ type: 'test' as const, value: view.readUint(4), wide: view.readWideUint(8) }),
	},
})
for (const box of inlineBig) {
	if (box.type === 'test') {
		expectEqual<typeof box.value, number>()
		expectEqual<typeof box.wide, bigint>()
	}
}

// 7. A custom reader written today, `(view: IsoBoxReadView) => ...`, still compiles without
//    the option and keeps its own return type, including a field the built-in type lacks.
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
// With the option on, a reader of the number view is rejected. The view it would receive
// is a bigint view. This is the one new compile error for existing code, and only in
// combination with the option.
// @ts-expect-error a reader of the number view cannot take a bigint view
readIsoBoxes(buffer, { int64: 'bigint', readers: { tfdt: readTfdtCustom } })

// 8. The default configuration selects its mode with an argument.
for (const box of readIsoBoxes(buffer, defaultReaderConfig())) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, number>()
	}
}
for (const box of readIsoBoxes(buffer, defaultReaderConfig({ int64: 'bigint' }))) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, bigint>()
	}
}
// The number configuration does not spread into the bigint mode.
// @ts-expect-error readers of the number view cannot read a bigint view
readIsoBoxes(buffer, { ...defaultReaderConfig(), int64: 'bigint' })

// 9. The readUint64 custom reader from the guide keeps working and keeps its bigint,
//    without the option.
const readTfdt64 = (view: IsoBoxReadView) => {
	const { version, flags } = view.readFullBox()
	const baseMediaDecodeTime = version === 1 ? view.readUint64() : BigInt(view.readUint(4))
	return { type: 'tfdt' as const, version, flags, baseMediaDecodeTime }
}
for (const box of readIsoBoxes(buffer, { readers: { tfdt: readTfdt64 } })) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, bigint>()
	}
}

// 10. A custom reader that follows the option is generic, like the built-in readers.
//     It may return more fields than the built-in type.
const readTfdtAware = <I extends IsoInt64>(view: IsoBoxReadView<I>) => {
	const { version, flags } = view.readFullBox()
	return {
		type: 'tfdt' as const,
		version,
		flags,
		baseMediaDecodeTime: view.readWideUint(version === 1 ? 8 : 4),
		extra: 'x',
	}
}
for (const box of readIsoBoxes(buffer, { int64: 'bigint', readers: { tfdt: readTfdtAware } })) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, bigint>()
		expectEqual<typeof box.extra, string>()
	}
}
for (const box of readIsoBoxes(buffer, { readers: { tfdt: readTfdtAware } })) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, number>()
	}
}

// 11. A reader that needs a bigint view cannot be registered without the option.
const readBigOnly = (view: IsoBoxReadView<'bigint'>) => ({
	type: 'x' as const,
	value: view.readWideUint(8) + BigInt(1),
})
// @ts-expect-error a reader of the bigint view needs the option
readIsoBoxes(buffer, { readers: { x: readBigOnly } })
for (const box of readIsoBoxes(buffer, { int64: 'bigint', readers: { x: readBigOnly } })) {
	if (box.type === 'x') {
		expectEqual<typeof box.value, bigint>()
	}
}

// 12. The option value is checked, and a bigint type cannot be claimed without the option.
// @ts-expect-error 'string' is not an IsoInt64
readIsoBoxes(buffer, { int64: 'string' })
// @ts-expect-error the bigint instantiation requires the option
readIsoBoxes<'bigint'>(buffer, {})
// @ts-expect-error the bigint instantiation requires the option
new IsoBoxReadView<'bigint'>(buffer)
void new IsoBoxReadView<'bigint'>(buffer, { int64: 'bigint' })

// 12b. The overflow option changes no type.
export const withOverflow = readIsoBoxes(buffer, {
	int64Overflow: 'throw',
	readers: { tfdt: readTfdt },
})
export type _12b = Expect<Equal<typeof withOverflow, typeof defaults>>
export const withReporter = readIsoBoxes(buffer, { int64Overflow: error => void error.message })
export type _12c = Expect<Equal<typeof withReporter, ParsedIsoBox[]>>
// @ts-expect-error 'warn' is not a value of int64Overflow
readIsoBoxes(buffer, { int64Overflow: 'warn' })

// 13. A box read with bigint is not assignable to the number type, and the other way round.
declare const tfdtBig: TrackFragmentBaseMediaDecodeTimeBox<'bigint'>
declare const tfdtNum: TrackFragmentBaseMediaDecodeTimeBox
// @ts-expect-error a bigint box is not a number box
export const asNumber: TrackFragmentBaseMediaDecodeTimeBox = tfdtBig
// @ts-expect-error a number box is not a bigint box
export const asBig: TrackFragmentBaseMediaDecodeTimeBox<'bigint'> = tfdtNum

// 14. Today's one-parameter public types still resolve.
export type _14 = Expect<
	Equal<ParsedBox<TrackFragmentBaseMediaDecodeTimeBox>['baseMediaDecodeTime'], number>
>

// 15. Views. A view of one mode is not a view of the other mode. Both are views of either mode,
//     so a reader of an unaffected box, or a generic reader, takes a bigint view directly.
declare const bigView: IsoBoxReadView<'bigint'>
declare const numView: IsoBoxReadView
// @ts-expect-error a bigint view is not a number view
export const asNumView: IsoBoxReadView = bigView
// @ts-expect-error a number view is not a bigint view
export const asBigView: IsoBoxReadView<'bigint'> = numView
export const eitherFromBig: IsoBoxReadView<IsoInt64> = bigView
export const eitherFromNum: IsoBoxReadView<IsoInt64> = numView
void readMfhd(bigView)
void readMfhd(numView)
expectEqual<ReturnType<typeof readTfdt<'bigint'>>['baseMediaDecodeTime'], bigint>()

// 16. Writers take a box of either mode, so a box read with bigint writes back without conversion.
for (const box of big) {
	if (box.type === 'tfdt') {
		void writeIsoBox(box)
		void writeTfdt(box)
	}
}
for (const box of defaults) {
	if (box.type === 'tfdt') {
		void writeIsoBox(box)
		void writeTfdt(box)
	}
}
void writeIsoBox(tfdtBig)
void writeIsoBox(tfdtNum)
for (const box of bigPlain) void writeIsoBox(box)
for (const box of plain) void writeIsoBox(box)
