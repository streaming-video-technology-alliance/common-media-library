// Compile-time assertions for model.ts. `tsc --noEmit` on this file is the test.
// Every `@ts-expect-error` line must fail to compile, and every other line must compile.
import {
	createInt64OverflowReader,
	createSampleEntryReader,
	defaultReaderConfig,
	IsoBoxReadView,
	isIsoBoxType,
	readInt64AsBigInt,
	readIsoBoxes,
	readMfhd,
	readTfdt,
	writeIsoBox,
	writeTfdt,
	type IsoBoxReaderMap,
	type IsoBoxReadViewConfig,
	type IsoInt64,
	type IsoInt64Reader,
	type ParsedBox,
	type ParsedIsoBox,
	type TrackFragmentBaseMediaDecodeTimeBox,
} from './model.ts'

type Equal<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Expect<T extends true> = T
declare function expectEqual<A, B>(..._: Equal<A, B> extends true ? [] : [never]): void

declare const buffer: ArrayBuffer
declare const log: (error: RangeError) => void

// 1. No config. Today's types, unchanged.
const plain = readIsoBoxes(buffer)
export type _1 = Expect<Equal<typeof plain, ParsedIsoBox[]>>
export type _1b = Expect<Equal<typeof plain, ParsedIsoBox<number>[]>>
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

// 3. A function that returns a number. Same types as 2.
const explicitNumber = readIsoBoxes(buffer, {
	int64: createInt64OverflowReader(log),
	readers: { tfdt: readTfdt },
})
for (const box of explicitNumber) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, number>()
	}
}

// 4. The bigint function with the built-in readers. The field is bigint, other fields are not.
//    The order of the configuration keys does not matter.
const big = readIsoBoxes(buffer, {
	int64: readInt64AsBigInt,
	readers: { tfdt: readTfdt, mfhd: readMfhd },
})
const bigReversed = readIsoBoxes(buffer, { readers: { tfdt: readTfdt }, int64: readInt64AsBigInt })
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

// 5. The bigint function with no readers. The default union follows it, including containers.
const bigPlain = readIsoBoxes(buffer, { int64: readInt64AsBigInt })
export type _5 = Expect<Equal<typeof bigPlain, ParsedIsoBox<bigint>[]>>
for (const box of bigPlain) {
	if (box.type === 'traf') {
		for (const child of box.boxes) {
			if (child.type === 'tfdt') {
				expectEqual<typeof child.baseMediaDecodeTime, bigint>()
			}
		}
	}
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
	int64: readInt64AsBigInt,
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

// 7. A custom reader written today still compiles without the option and keeps its own return type.
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
// With the bigint function, a reader of the number view is rejected.
// @ts-expect-error a reader of the number view cannot take a bigint view
readIsoBoxes(buffer, { int64: readInt64AsBigInt, readers: { tfdt: readTfdtCustom } })
// With a function that returns a number, the same reader is accepted.
void readIsoBoxes(buffer, {
	int64: createInt64OverflowReader(log),
	readers: { tfdt: readTfdtCustom },
})

// 8. The default configuration selects its mode with an argument.
for (const box of readIsoBoxes(buffer, defaultReaderConfig())) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, number>()
	}
}
for (const box of readIsoBoxes(buffer, defaultReaderConfig({ int64: readInt64AsBigInt }))) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, bigint>()
	}
}
for (const box of readIsoBoxes(
	buffer,
	defaultReaderConfig({ int64: createInt64OverflowReader(log) }),
)) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, number>()
	}
}
// The number configuration does not spread into the bigint mode.
// @ts-expect-error readers of the number view cannot read a bigint view
readIsoBoxes(buffer, { ...defaultReaderConfig(), int64: readInt64AsBigInt })

// 9. The readUint64 custom reader from the guide keeps working and keeps its bigint, without the option.
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

// 10. A custom reader that follows the option is generic, like the built-in readers of affected boxes.
const readTfdtAware = <V extends IsoInt64>(view: IsoBoxReadView<V>) => {
	const { version, flags } = view.readFullBox()
	return {
		type: 'tfdt' as const,
		version,
		flags,
		baseMediaDecodeTime: view.readWideUint(version === 1 ? 8 : 4),
		extra: 'x',
	}
}
for (const box of readIsoBoxes(buffer, {
	int64: readInt64AsBigInt,
	readers: { tfdt: readTfdtAware },
})) {
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
const readBigOnly = (view: IsoBoxReadView<bigint>) => ({
	type: 'x' as const,
	value: view.readWideUint(8) + BigInt(1),
})
// @ts-expect-error a reader of the bigint view needs the option
readIsoBoxes(buffer, { readers: { x: readBigOnly } })
for (const box of readIsoBoxes(buffer, { int64: readInt64AsBigInt, readers: { x: readBigOnly } })) {
	if (box.type === 'x') {
		expectEqual<typeof box.value, bigint>()
	}
}

// 12. The option value is checked, and a bigint type cannot be claimed without the option.
// @ts-expect-error a string literal is not a value of the option
readIsoBoxes(buffer, { int64: 'bigint' })
// @ts-expect-error a function that returns a string is not a value of the option
readIsoBoxes(buffer, { int64: () => 'x' })
// @ts-expect-error the bigint instantiation requires the option
readIsoBoxes<bigint>(buffer, {})
// @ts-expect-error the bigint instantiation requires the option
new IsoBoxReadView<bigint>(buffer)
void new IsoBoxReadView<bigint>(buffer, { int64: readInt64AsBigInt })

// 12b. The overflow function changes no type, and its callback gets `RangeError` from context.
export const withOverflow = readIsoBoxes(buffer, {
	int64: createInt64OverflowReader(error => {
		throw error
	}),
	readers: { tfdt: readTfdt, mfhd: readMfhd },
})
export type _12b = Expect<Equal<typeof withOverflow, typeof defaults>>
export const withReporter = readIsoBoxes(buffer, {
	int64: createInt64OverflowReader(error => void error.message),
})
export type _12c = Expect<Equal<typeof withReporter, ParsedIsoBox[]>>
// @ts-expect-error the callback is required
createInt64OverflowReader()

// 13. A box read with bigint is not assignable to the number type, and the other way round.
declare const tfdtBig: TrackFragmentBaseMediaDecodeTimeBox<bigint>
declare const tfdtNum: TrackFragmentBaseMediaDecodeTimeBox
// @ts-expect-error a bigint box is not a number box
export const asNumber: TrackFragmentBaseMediaDecodeTimeBox = tfdtBig
// @ts-expect-error a number box is not a bigint box
export const asBig: TrackFragmentBaseMediaDecodeTimeBox<bigint> = tfdtNum

// 14. Today's one-parameter public types still resolve.
export type _14 = Expect<
	Equal<ParsedBox<TrackFragmentBaseMediaDecodeTimeBox>['baseMediaDecodeTime'], number>
>

// 15. Views. A view of one mode is not a view of the other mode. Both are views of either mode.
declare const bigView: IsoBoxReadView<bigint>
declare const numView: IsoBoxReadView
// @ts-expect-error a bigint view is not a number view
export const asNumView: IsoBoxReadView = bigView
// @ts-expect-error a number view is not a bigint view
export const asBigView: IsoBoxReadView<bigint> = numView
export const eitherFromBig: IsoBoxReadView<IsoInt64> = bigView
export const eitherFromNum: IsoBoxReadView<IsoInt64> = numView
void readMfhd(bigView)
void readMfhd(numView)
expectEqual<ReturnType<typeof readTfdt<bigint>>['baseMediaDecodeTime'], bigint>()

// 16. Writers take a box of either mode.
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

// 17. A view that the adopter constructs infers its mode from the function.
export const viewDefault = new IsoBoxReadView(buffer)
export const viewBig = new IsoBoxReadView(buffer, { int64: readInt64AsBigInt })
export const viewChecked = new IsoBoxReadView(buffer, { int64: createInt64OverflowReader(log) })
expectEqual<typeof viewDefault, IsoBoxReadView<number>>()
expectEqual<typeof viewBig, IsoBoxReadView<bigint>>()
expectEqual<typeof viewChecked, IsoBoxReadView<number>>()
expectEqual<ReturnType<typeof viewBig.readWideUint>, bigint>()
expectEqual<ReturnType<typeof viewBig.readWideInt>, bigint>()

// 18. The exported functions take a view of either mode.
expectEqual<ReturnType<typeof readInt64AsBigInt>, bigint>()
void readInt64AsBigInt(bigView, 8, false)
void readInt64AsBigInt(numView, 4, true)
void createInt64OverflowReader(log)(numView, 8, true)
// The exported functions match the option type.
export const asReaderBig: IsoInt64Reader<bigint> = readInt64AsBigInt
export const asReaderNum: IsoInt64Reader = createInt64OverflowReader(log)
// @ts-expect-error the bigint function is not a number function
export const asReaderWrong: IsoInt64Reader = readInt64AsBigInt

// 19. A function that the adopter writes, declared with the option type.
const readAsBigInt: IsoInt64Reader<bigint> = (view, size) =>
	size === 8 ? view.readUint64() : BigInt(view.readUint(size))
for (const box of readIsoBoxes(buffer, { int64: readAsBigInt, readers: { tfdt: readTfdt } })) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, bigint>()
	}
}

// 20. A configuration or a readers map that the adopter stores in a variable keeps its mode.
const storedDefault = { readers: { tfdt: readTfdt, mfhd: readMfhd } }
for (const box of readIsoBoxes(buffer, storedDefault)) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, number>()
		void (box.baseMediaDecodeTime + 1)
	}
	if (box.type === 'mfhd') {
		expectEqual<typeof box.sequenceNumber, number>()
	}
}
const storedBig = { int64: readInt64AsBigInt, readers: { tfdt: readTfdt } }
for (const box of readIsoBoxes(buffer, storedBig)) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, bigint>()
	}
}
const storedReaders = { tfdt: readTfdt }
for (const box of readIsoBoxes(buffer, { readers: storedReaders })) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, number>()
	}
}
for (const box of readIsoBoxes(buffer, { int64: readInt64AsBigInt, readers: storedReaders })) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, bigint>()
	}
}
// A stored custom reader of the number view keeps its own type.
const storedCustom = { tfdt: readTfdtCustom, other: readTfdt64 }
for (const box of readIsoBoxes(buffer, { readers: storedCustom })) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, number | bigint>()
	}
}
for (const box of readIsoBoxes(buffer, { readers: { tfdt: readTfdtCustom } })) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.extra, string>()
	}
}

// 21. Known limit. A stored generic custom reader with extra fields gets the union type.
const storedAware = { tfdt: readTfdtAware }
for (const box of readIsoBoxes(buffer, { readers: storedAware })) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, number | bigint>()
	}
}

// A type argument in the stored map selects the mode.
const storedAwareNumber = { tfdt: readTfdtAware<number> }
for (const box of readIsoBoxes(buffer, { readers: storedAwareNumber })) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, number>()
	}
}
const storedAwareBig = { tfdt: readTfdtAware<bigint> }
for (const box of readIsoBoxes(buffer, { int64: readInt64AsBigInt, readers: storedAwareBig })) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, bigint>()
		expectEqual<typeof box.extra, string>()
	}
}
// A custom reader that returns less than the built-in type keeps its own type.
const readTfdtBare = () => ({ type: 'tfdt' as const })
for (const box of readIsoBoxes(buffer, { readers: { tfdt: readTfdtBare } })) {
	if (box.type === 'tfdt') {
		// @ts-expect-error the custom reader returns no version field
		void box.version
	}
}

// 22. An inline function for the option, in both key orders.
for (const box of readIsoBoxes(buffer, {
	int64: view => view.readUint64(),
	readers: { tfdt: readTfdt },
})) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, bigint>()
	}
}
for (const box of readIsoBoxes(buffer, {
	readers: { tfdt: readTfdt },
	int64: view => view.readUint64(),
})) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, bigint>()
	}
}

// 23. A reader of an unaffected box has no type parameter and takes a view of either mode.
//     `readMfhd` has that form. The same holds for a custom reader that does not follow the option.
const readFreeEither = (view: IsoBoxReadView<IsoInt64>) => ({
	type: 'free' as const,
	size: view.readUint(4),
})
for (const box of readIsoBoxes(buffer, { readers: { tfdt: readTfdt, free: readFreeEither } })) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, number>()
	}
}
for (const box of readIsoBoxes(buffer, {
	int64: readInt64AsBigInt,
	readers: { tfdt: readTfdt, mfhd: readMfhd, free: readFreeEither },
})) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, bigint>()
	}
	if (box.type === 'mfhd') {
		expectEqual<typeof box.sequenceNumber, number>()
	}
	if (box.type === 'free') {
		expectEqual<typeof box.size, number>()
	}
}
void readFreeEither(bigView)
void readFreeEither(numView)
// A typed configuration and a typed map accept such a reader in both modes.
export const typedBig: IsoBoxReadViewConfig<bigint> = {
	int64: readInt64AsBigInt,
	readers: { tfdt: readTfdt, mfhd: readMfhd, free: readFreeEither },
}
export const typedNumber: IsoBoxReadViewConfig = { readers: { tfdt: readTfdt, mfhd: readMfhd } }
export const typedBigMap: IsoBoxReaderMap<bigint> = { mfhd: readMfhd, free: readFreeEither }
// Readers next to the spread of the default configuration.
for (const box of readIsoBoxes(buffer, {
	...defaultReaderConfig({ int64: readInt64AsBigInt }),
	readers: { tfdt: readTfdt, mfhd: readMfhd },
})) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, bigint>()
	}
}
// A reader of the view of either mode that reads a wide field gets the union type, in both modes.
// A reader that follows the option is generic, as in case 10.
const readUnionEither = (view: IsoBoxReadView<IsoInt64>) => ({
	type: 'cust' as const,
	value: view.readWideUint(8),
})
for (const box of readIsoBoxes(buffer, {
	int64: readInt64AsBigInt,
	readers: { cust: readUnionEither },
})) {
	if (box.type === 'cust') {
		expectEqual<typeof box.value, number | bigint>()
	}
}
// The rejected form, a generic reader of an unaffected box, also registers in both modes.
declare function readMfhdGeneric<V extends IsoInt64>(
	view: IsoBoxReadView<V>,
): { type: 'mfhd'; sequenceNumber: number }
void readIsoBoxes(buffer, { readers: { mfhd: readMfhdGeneric } })
void readIsoBoxes(buffer, { int64: readInt64AsBigInt, readers: { mfhd: readMfhdGeneric } })

// 24. A reader from a factory, such as `createAudioSampleEntryReader`, registers in both modes.
//     The factory returns a reader with no type parameter that takes a view of either mode.
for (const box of readIsoBoxes(buffer, {
	readers: { tfdt: readTfdt, 'ec-3': createSampleEntryReader('ec-3') },
})) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, number>()
	}
	if (box.type === 'ec-3') {
		expectEqual<typeof box.dataReferenceIndex, number>()
	}
}
for (const box of readIsoBoxes(buffer, {
	int64: readInt64AsBigInt,
	readers: { tfdt: readTfdt, 'ec-3': createSampleEntryReader('ec-3') },
})) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, bigint>()
	}
	if (box.type === 'ec-3') {
		expectEqual<typeof box.dataReferenceIndex, number>()
	}
}
// A reader from a factory in a stored map keeps the mode of the call.
const storedFactory = { tfdt: readTfdt, 'ec-3': createSampleEntryReader('ec-3') }
for (const box of readIsoBoxes(buffer, { int64: readInt64AsBigInt, readers: storedFactory })) {
	if (box.type === 'tfdt') {
		expectEqual<typeof box.baseMediaDecodeTime, bigint>()
	}
}
// A map of the type `IsoBoxReaderMap` takes a reader from a factory by assignment.
// `@svta/cml-drm` builds its readers map in this way.
const dynamicReaders: IsoBoxReaderMap = {}
dynamicReaders['ec-3'] = createSampleEntryReader('ec-3')
void dynamicReaders
// The factory of today returns a reader of the number view. The bigint function rejects that reader.
declare function createSampleEntryReaderToday<T extends string>(
	type: T,
): (view: IsoBoxReadView) => { type: T; dataReferenceIndex: number }
const readerToday = createSampleEntryReaderToday('ec-3')
void readIsoBoxes(buffer, { readers: { 'ec-3': readerToday } })
// @ts-expect-error a reader of the number view cannot take a bigint view
readIsoBoxes(buffer, { int64: readInt64AsBigInt, readers: { 'ec-3': readerToday } })
