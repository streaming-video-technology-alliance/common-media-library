import {
	assert,
	createAudioSampleEntryReader,
	createInt64OverflowReader,
	defaultReaderConfig,
	describe,
	findIsoBox,
	isContainer,
	isIsoBoxType,
	IsoBoxReadView,
	it,
	readInt64AsBigInt,
	readIsoBoxes,
	readEmsg,
	readMfhd,
	readTfdt,
	writeIsoBox,
	writeIsoBoxes,
	writeTfdt,
	type Box,
	type IsoBox,
	type IsoBoxData,
	type IsoBoxReaderMap,
	type IsoBoxReadViewConfig,
	type IsoInt64,
	type IsoInt64Reader,
	type IsoBoxStreamable,
	type ParsedBox,
	type ParsedIsoBox,
	type TrackFragmentBaseMediaDecodeTimeBox,
} from './util/box.ts'
import { expectType, type Equal } from './util/expectType.ts'

// The compile-time assertions of the RFC `int64` reader option. The type check of the repo is the test.
// Every `@ts-expect-error` line must fail to compile, and every other line must compile.
// The tests also run, so each assertion on a type has an assertion on the value next to it.

// 2^54 + 1. A `number` rounds this value to 2^54.
const EXACT = BigInt('18014398509481985')
const ROUNDED = 18014398509481984

// A version 1 tfdt box, an mfhd box, and a traf box that holds the same tfdt box.
const TFDT = [
	0x00, 0x00, 0x00, 0x14, 0x74, 0x66, 0x64, 0x74, 0x01, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x01,
]
const MFHD = [
	0x00, 0x00, 0x00, 0x10, 0x6d, 0x66, 0x68, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x07,
]
const TRAF = [0x00, 0x00, 0x00, 0x1c, 0x74, 0x72, 0x61, 0x66, ...TFDT]
const buffer = new Uint8Array([...TFDT, ...MFHD, ...TRAF]).buffer

const reported: RangeError[] = []
const log = (error: RangeError): void => {
	reported.push(error)
}

/** A custom reader written before the option existed. */
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

/** The custom reader of the reading guide before the option existed. */
const readTfdt64 = (view: IsoBoxReadView) => {
	const { version, flags } = view.readFullBox()
	const baseMediaDecodeTime = version === 1 ? view.readUint64() : BigInt(view.readUint(4))
	return { type: 'tfdt' as const, version, flags, baseMediaDecodeTime }
}

/** A custom reader that follows the option. */
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

/** A custom reader that does not follow the option and takes a view of either mode. */
const readFreeEither = (view: IsoBoxReadView<IsoInt64>) => ({
	type: 'free' as const,
	length: view.bytesRemaining,
})

describe('int64 option types', function () {
	it('1. keeps the types of today with no configuration', function () {
		const plain = readIsoBoxes(buffer)
		expectType<Equal<typeof plain, ParsedIsoBox[]>>(true)
		expectType<Equal<typeof plain, ParsedIsoBox<number>[]>>(true)

		for (const box of plain) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, number>>(true)
			}
		}
	})

	it('2. keeps the types of today with readers only', function () {
		const boxes = readIsoBoxes(buffer, { readers: { tfdt: readTfdt, mfhd: readMfhd } })
		let count = 0

		for (const box of boxes) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, number>>(true)
				assert.strictEqual(box.baseMediaDecodeTime, ROUNDED)
				count++
			}
			if (box.type === 'mfhd') {
				expectType<Equal<typeof box.sequenceNumber, number>>(true)
				assert.strictEqual(box.sequenceNumber, 7)
				count++
			}
		}

		assert.strictEqual(count, 2)
	})

	it('3. keeps number fields with a function that returns a number', function () {
		const boxes = readIsoBoxes(buffer, {
			int64: createInt64OverflowReader(log),
			readers: { tfdt: readTfdt },
		})

		for (const box of boxes) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, number>>(true)
				assert.strictEqual(box.baseMediaDecodeTime, ROUNDED)
			}
		}
	})

	it('4. gives bigint fields with readInt64AsBigInt, in both key orders', function () {
		const big = readIsoBoxes(buffer, {
			int64: readInt64AsBigInt,
			readers: { tfdt: readTfdt, mfhd: readMfhd },
		})
		const reversed = readIsoBoxes(buffer, {
			readers: { tfdt: readTfdt },
			int64: readInt64AsBigInt,
		})
		let count = 0

		for (const box of [...big, ...reversed]) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, bigint>>(true)
				expectType<Equal<typeof box.version, number>>(true)
				assert.strictEqual(box.baseMediaDecodeTime + BigInt(1), EXACT + BigInt(1))
				count++
			}
			if (box.type === 'mfhd') {
				expectType<Equal<typeof box.sequenceNumber, number>>(true)
			}
		}

		assert.strictEqual(count, 2)
		assert.strictEqual(big.find(box => box.type === 'mfhd')?.sequenceNumber, 7)
	})

	it('5. gives the default union the mode of the option, with the containers', function () {
		const boxes = readIsoBoxes(buffer, { int64: readInt64AsBigInt })
		expectType<Equal<typeof boxes, ParsedIsoBox<bigint>[]>>(true)

		for (const box of boxes) {
			if (box.type === 'traf') {
				for (const child of box.boxes) {
					if (child.type === 'tfdt') {
						expectType<Equal<typeof child.baseMediaDecodeTime, bigint>>(true)
					}
				}
			}
			if (box.type === 'moof') {
				for (const traf of box.boxes) {
					if (traf.type === 'traf') {
						for (const child of traf.boxes) {
							if (child.type === 'tfhd') {
								expectType<Equal<typeof child.baseDataOffset, bigint | undefined>>(true)
							}
						}
					}
				}
			}
			if (box.type === 'moov') {
				for (const child of box.boxes) {
					if (child.type === 'mvhd') {
						expectType<Equal<typeof child.duration, bigint>>(true)
					}
					if (child.type === 'mvex') {
						for (const header of child.boxes) {
							if (header.type === 'mehd') {
								expectType<Equal<typeof header.fragmentDuration, bigint>>(true)
							}
						}
					}
					if (child.type === 'trak') {
						for (const part of child.boxes) {
							if (part.type === 'tkhd') {
								expectType<Equal<typeof part.duration, bigint>>(true)
							}
							if (part.type === 'edts') {
								for (const list of part.boxes) {
									assert.strictEqual(list.type, 'elst')
									expectType<Equal<(typeof list.entries)[number]['mediaTime'], bigint>>(true)
									expectType<Equal<(typeof list.entries)[number]['mediaRateInteger'], number>>(true)
								}
							}
							if (part.type === 'mdia') {
								for (const header of part.boxes) {
									if (header.type === 'mdhd') {
										expectType<Equal<typeof header.duration, bigint>>(true)
										expectType<Equal<typeof header.timescale, number>>(true)
									}
								}
							}
						}
					}
				}
			}
			if (box.type === 'mfra') {
				for (const child of box.boxes) {
					if (child.type === 'tfra') {
						expectType<Equal<(typeof child.entries)[number]['time'], bigint>>(true)
						expectType<Equal<(typeof child.entries)[number]['trafNumber'], number>>(true)
					}
				}
			}
			if (box.type === 'sidx') {
				expectType<Equal<typeof box.earliestPresentationTime, bigint>>(true)
				expectType<Equal<typeof box.firstOffset, bigint>>(true)
				expectType<Equal<typeof box.timescale, number>>(true)
			}
			if (box.type === 'prft') {
				expectType<Equal<typeof box.mediaTime, bigint>>(true)
				expectType<Equal<typeof box.ntpTimestampSec, number>>(true)
			}
			if (box.type === 'emsg' && box.version === 1) {
				expectType<Equal<typeof box.presentationTime, bigint>>(true)
			}
			if (box.type === 'emsg' && box.version === 0) {
				expectType<Equal<typeof box.presentationTimeDelta, number>>(true)
			}
		}
	})

	it('5b. narrows a box of either mode with isIsoBoxType', function () {
		for (const box of readIsoBoxes(buffer, { int64: readInt64AsBigInt })) {
			if (isIsoBoxType('tfdt', box)) {
				expectType<Equal<typeof box.baseMediaDecodeTime, bigint>>(true)
				expectType<Equal<typeof box.view, IsoBoxReadView<bigint>>>(true)
			}
			if (isIsoBoxType('traf', box)) {
				for (const child of box.boxes) {
					if (isIsoBoxType('tfdt', child)) {
						expectType<Equal<typeof child.baseMediaDecodeTime, bigint>>(true)
					}
				}
			}
		}

		for (const box of readIsoBoxes(buffer)) {
			if (isIsoBoxType('tfdt', box)) {
				expectType<Equal<typeof box.baseMediaDecodeTime, number>>(true)
				expectType<Equal<typeof box.view, IsoBoxReadView>>(true)
			}
			if (isIsoBoxType('traf', box)) {
				for (const child of box.boxes) {
					if (isIsoBoxType('tfdt', child)) {
						expectType<Equal<typeof child.baseMediaDecodeTime, number>>(true)
					}
				}
			}
		}

		const withReaders = readIsoBoxes(buffer, {
			int64: readInt64AsBigInt,
			readers: { tfdt: readTfdt, mfhd: readMfhd },
		})
		let count = 0
		for (const box of withReaders) {
			if (isIsoBoxType('tfdt', box)) {
				expectType<Equal<typeof box.baseMediaDecodeTime, bigint>>(true)
				assert.strictEqual(box.baseMediaDecodeTime, EXACT)
				count++
			}
		}
		assert.strictEqual(count, 1)

		// A value of an unknown type narrows to the box of the default mode, as today.
		const unknownBox: unknown = { type: 'tfdt', version: 1, flags: 0, baseMediaDecodeTime: 1 }
		if (isIsoBoxType('tfdt', unknownBox)) {
			expectType<Equal<typeof unknownBox, TrackFragmentBaseMediaDecodeTimeBox>>(true)
		} else {
			assert.fail('expected a tfdt box')
		}
	})

	it('5d. narrows a box that can be null or undefined with isIsoBoxType', function () {
		const big = readIsoBoxes(buffer, defaultReaderConfig({ int64: readInt64AsBigInt }))
		const plain = readIsoBoxes(buffer, defaultReaderConfig())
		let count = 0

		const optional = big.at(0)
		expectType<Equal<typeof optional, ParsedIsoBox<bigint> | undefined>>(true)
		if (isIsoBoxType('tfdt', optional)) {
			expectType<Equal<typeof optional.baseMediaDecodeTime, bigint>>(true)
			// @ts-expect-error a bigint field is not a number
			const asNumber: number = optional.baseMediaDecodeTime
			assert.strictEqual(asNumber, EXACT)
			count++
		}

		const found = findIsoBox(big, box => box.size > 0)
		expectType<Equal<typeof found, ParsedIsoBox<bigint> | null>>(true)
		if (isIsoBoxType('tfdt', found)) {
			expectType<Equal<typeof found.baseMediaDecodeTime, bigint>>(true)
			assert.strictEqual(found.baseMediaDecodeTime, EXACT)
			count++
		}

		const first = big.find(box => box.type === 'tfdt')
		if (isIsoBoxType('tfdt', first)) {
			expectType<Equal<typeof first.baseMediaDecodeTime, bigint>>(true)
			assert.strictEqual(first.baseMediaDecodeTime, EXACT)
			count++
		}

		const custom = readIsoBoxes(buffer, { int64: readInt64AsBigInt, readers: { tfdt: readTfdt } })
		const customFirst = custom.at(0)
		if (isIsoBoxType('tfdt', customFirst)) {
			expectType<Equal<typeof customFirst.baseMediaDecodeTime, bigint>>(true)
			assert.strictEqual(customFirst.baseMediaDecodeTime, EXACT)
			count++
		}

		const narrowIsoBox = (box: IsoBox<bigint> | undefined): boolean => {
			if (isIsoBoxType('tfdt', box)) {
				expectType<Equal<typeof box.baseMediaDecodeTime, bigint>>(true)
				return true
			}
			return false
		}
		assert.strictEqual(narrowIsoBox(first), true)
		assert.strictEqual(narrowIsoBox(undefined), false)

		// A box with number fields that can be null or undefined keeps number fields.
		const optionalNumber = plain.at(0)
		if (isIsoBoxType('tfdt', optionalNumber)) {
			expectType<Equal<typeof optionalNumber.baseMediaDecodeTime, number>>(true)
			assert.strictEqual(optionalNumber.baseMediaDecodeTime + 1, ROUNDED + 1)
			count++
		}

		const foundNumber = findIsoBox(plain, box => box.size > 0)
		expectType<Equal<typeof foundNumber, ParsedIsoBox | null>>(true)
		if (isIsoBoxType('tfdt', foundNumber)) {
			expectType<Equal<typeof foundNumber.baseMediaDecodeTime, number>>(true)
			count++
		}
		if (isIsoBoxType<'tfdt'>('tfdt', foundNumber)) {
			expectType<Equal<typeof foundNumber.baseMediaDecodeTime, number>>(true)
			count++
		}

		// A value of the type `Box` narrows to number fields, as before.
		const base: Box = new IsoBoxReadView(buffer).readBox()
		if (isIsoBoxType('tfdt', base)) {
			expectType<Equal<typeof base.baseMediaDecodeTime, number>>(true)
			assert.strictEqual(base.baseMediaDecodeTime, undefined)
			count++
		}

		assert.strictEqual(count, 8)
		assert.strictEqual(isIsoBoxType('tfdt', null), false)
		assert.strictEqual(isIsoBoxType('tfdt', undefined), false)
	})

	it('5c. narrows a box of either mode with isContainer', function () {
		for (const box of readIsoBoxes(buffer, { int64: readInt64AsBigInt })) {
			if (box.type === 'traf' && isContainer(box)) {
				for (const child of box.boxes) {
					if (child.type === 'tfdt') {
						expectType<Equal<typeof child.baseMediaDecodeTime, bigint>>(true)
					}
				}
			}
		}

		let count = 0
		for (const box of readIsoBoxes(buffer, { readers: { tfdt: readTfdt } })) {
			if (box.type === 'traf' && isContainer(box)) {
				for (const child of box.boxes) {
					if (child.type === 'tfdt') {
						expectType<Equal<typeof child.baseMediaDecodeTime, number>>(true)
						assert.strictEqual(child.baseMediaDecodeTime, ROUNDED)
						count++
					}
				}
			}
		}
		assert.strictEqual(count, 1)
	})

	it('6. types the view of an inline reader from the configuration', function () {
		const inlineNumber = readIsoBoxes(buffer, {
			readers: { mfhd: view => ({ type: 'mfhd' as const, value: view.readUint(4) }) },
		})
		for (const box of inlineNumber) {
			if (box.type === 'mfhd') {
				expectType<Equal<typeof box.value, number>>(true)
				assert.strictEqual(box.value, 0)
			}
		}

		const inlineBig = readIsoBoxes(buffer, {
			int64: readInt64AsBigInt,
			readers: {
				mfhd: view => ({
					type: 'mfhd' as const,
					value: view.readUint(4),
					wide: view.readWideUint(4),
				}),
			},
		})
		for (const box of inlineBig) {
			if (box.type === 'mfhd') {
				expectType<Equal<typeof box.value, number>>(true)
				expectType<Equal<typeof box.wide, bigint>>(true)
				assert.strictEqual(box.wide, BigInt(7))
			}
		}
	})

	it('7. accepts a custom reader of today without the option only', function () {
		const custom = readIsoBoxes(buffer, { readers: { tfdt: readTfdtCustom } })
		for (const box of custom) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, number>>(true)
				expectType<Equal<typeof box.extra, string>>(true)
			}
		}

		// @ts-expect-error a reader of the number view cannot take a bigint view
		readIsoBoxes(buffer, { int64: readInt64AsBigInt, readers: { tfdt: readTfdtCustom } })

		const checked = readIsoBoxes(buffer, {
			int64: createInt64OverflowReader(log),
			readers: { tfdt: readTfdtCustom },
		})
		expectType<Equal<typeof checked, typeof custom>>(true)
		assert.strictEqual(checked.length, custom.length)
	})

	it('8. selects the mode of the default configuration with an argument', function () {
		for (const box of readIsoBoxes(buffer, defaultReaderConfig())) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, number>>(true)
				assert.strictEqual(box.baseMediaDecodeTime, ROUNDED)
			}
		}

		for (const box of readIsoBoxes(buffer, defaultReaderConfig({ int64: readInt64AsBigInt }))) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, bigint>>(true)
				assert.strictEqual(box.baseMediaDecodeTime, EXACT)
			}
		}

		const checked = defaultReaderConfig({ int64: createInt64OverflowReader(log) })
		for (const box of readIsoBoxes(buffer, checked)) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, number>>(true)
			}
		}

		// @ts-expect-error readers of the number view cannot read a bigint view
		readIsoBoxes(buffer, { ...defaultReaderConfig(), int64: readInt64AsBigInt })
	})

	it('9. keeps the bigint of a readUint64 custom reader without the option', function () {
		for (const box of readIsoBoxes(buffer, { readers: { tfdt: readTfdt64 } })) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, bigint>>(true)
				assert.strictEqual(box.baseMediaDecodeTime, EXACT)
			}
		}
	})

	it('10. gives a generic custom reader the mode of the option', function () {
		const big = readIsoBoxes(buffer, {
			int64: readInt64AsBigInt,
			readers: { tfdt: readTfdtAware },
		})
		for (const box of big) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, bigint>>(true)
				expectType<Equal<typeof box.extra, string>>(true)
				assert.strictEqual(box.baseMediaDecodeTime, EXACT)
			}
		}

		for (const box of readIsoBoxes(buffer, { readers: { tfdt: readTfdtAware } })) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, number>>(true)
				assert.strictEqual(box.baseMediaDecodeTime, ROUNDED)
			}
		}
	})

	it('11. rejects a reader of the bigint view without the option', function () {
		const readBigOnly = (view: IsoBoxReadView<bigint>) => ({
			type: 'mfhd' as const,
			value: view.readWideUint(4) + BigInt(1),
		})

		// @ts-expect-error a reader of the bigint view needs the option
		assert.throws(() => readIsoBoxes(buffer, { readers: { mfhd: readBigOnly } }), TypeError)

		for (const box of readIsoBoxes(buffer, {
			int64: readInt64AsBigInt,
			readers: { mfhd: readBigOnly },
		})) {
			if (box.type === 'mfhd') {
				expectType<Equal<typeof box.value, bigint>>(true)
				assert.strictEqual(box.value, BigInt(1))
			}
		}
	})

	it('12. checks the value of the option', function () {
		// @ts-expect-error a string literal is not a value of the option
		readIsoBoxes(buffer, { int64: 'bigint' })
		// @ts-expect-error a function that returns a string is not a value of the option
		readIsoBoxes(buffer, { int64: () => 'x' })
		// @ts-expect-error the bigint instantiation requires the option
		readIsoBoxes<bigint>(buffer, {})
		// @ts-expect-error the bigint instantiation requires the option
		void new IsoBoxReadView<bigint>(buffer)
		void new IsoBoxReadView<bigint>(buffer, { int64: readInt64AsBigInt })
	})

	it('12a. rejects a bigint type with no function for the option', function () {
		// @ts-expect-error the bigint instantiation requires a configuration
		readIsoBoxes<bigint>(buffer)
		// @ts-expect-error a bigint result type requires a configuration
		const claimed: ParsedIsoBox<bigint>[] = readIsoBoxes(buffer)
		// @ts-expect-error the bigint instantiation requires the option
		void defaultReaderConfig<bigint>()
		// @ts-expect-error the bigint instantiation requires the option
		void defaultReaderConfig<bigint>({})
		// @ts-expect-error a bigint configuration type requires the option
		const claimedConfig: IsoBoxReadViewConfig<bigint> = defaultReaderConfig()
		// @ts-expect-error a bigint view type requires a configuration
		const claimedView = new IsoBoxReadView<bigint>(buffer)

		assert.strictEqual(claimed.length, 3)
		assert.strictEqual(claimedConfig.int64, undefined)
		assert.strictEqual(claimedView.readWideUint, claimedView.readUint)

		// The calls with no type argument and the calls with the function compile.
		const plain: ParsedIsoBox[] = readIsoBoxes(buffer, undefined)
		const big: ParsedIsoBox<bigint>[] = readIsoBoxes(buffer, { int64: readInt64AsBigInt })
		const either: ParsedIsoBox<IsoInt64>[] = readIsoBoxes<IsoInt64>(buffer)
		const config: IsoBoxReadViewConfig = defaultReaderConfig({})
		const bigConfig: IsoBoxReadViewConfig<bigint> = defaultReaderConfig({
			int64: readInt64AsBigInt,
		})
		const explicit = defaultReaderConfig<bigint>({ int64: readInt64AsBigInt })
		const none = defaultReaderConfig(undefined)

		expectType<Equal<typeof explicit, IsoBoxReadViewConfig<bigint>>>(true)
		expectType<Equal<typeof none, IsoBoxReadViewConfig>>(true)
		assert.strictEqual(plain.length + big.length + either.length, 9)
		assert.strictEqual(config.int64, undefined)
		assert.strictEqual(bigConfig.int64, explicit.int64)
		assert.strictEqual(none.int64, undefined)
	})

	it('12b. changes no type with the overflow function', function () {
		const defaults = readIsoBoxes(buffer, { readers: { tfdt: readTfdt, mfhd: readMfhd } })
		const errors: RangeError[] = []
		const withOverflow = readIsoBoxes(buffer, {
			int64: createInt64OverflowReader(error => {
				expectType<Equal<typeof error, RangeError>>(true)
				errors.push(error)
			}),
			readers: { tfdt: readTfdt, mfhd: readMfhd },
		})
		expectType<Equal<typeof withOverflow, typeof defaults>>(true)
		assert.strictEqual(withOverflow.length, defaults.length)
		// The top-level tfdt box and the tfdt box in the traf box.
		assert.strictEqual(errors.length, 2)

		const withReporter = readIsoBoxes(buffer, {
			int64: createInt64OverflowReader(error => void error.message),
		})
		expectType<Equal<typeof withReporter, ParsedIsoBox[]>>(true)
		assert.strictEqual(withReporter.length, 3)

		// @ts-expect-error the callback is required
		void createInt64OverflowReader()
	})

	it('13. keeps a box of one mode apart from a box of the other mode', function () {
		const tfdtBig: TrackFragmentBaseMediaDecodeTimeBox<bigint> = {
			type: 'tfdt',
			version: 1,
			flags: 0,
			baseMediaDecodeTime: EXACT,
		}
		const tfdtNum: TrackFragmentBaseMediaDecodeTimeBox = {
			type: 'tfdt',
			version: 1,
			flags: 0,
			baseMediaDecodeTime: 1,
		}
		// @ts-expect-error a bigint box is not a number box
		const asNumber: TrackFragmentBaseMediaDecodeTimeBox = tfdtBig
		// @ts-expect-error a number box is not a bigint box
		const asBig: TrackFragmentBaseMediaDecodeTimeBox<bigint> = tfdtNum
		const either: TrackFragmentBaseMediaDecodeTimeBox<IsoInt64>[] = [tfdtBig, tfdtNum]

		assert.deepStrictEqual([asNumber, asBig], either)
	})

	it('14. resolves the public types of today with one type argument', function () {
		expectType<
			Equal<ParsedBox<TrackFragmentBaseMediaDecodeTimeBox>['baseMediaDecodeTime'], number>
		>(true)
		expectType<Equal<ParsedBox['view'], IsoBoxReadView<number>>>(true)
		expectType<Equal<IsoBoxReadViewConfig, IsoBoxReadViewConfig<number>>>(true)
		expectType<Equal<IsoBoxReaderMap, IsoBoxReaderMap<number>>>(true)
		expectType<Equal<IsoInt64Reader, IsoInt64Reader<number>>>(true)
	})

	it('15. keeps a view of one mode apart from a view of the other mode', function () {
		const bigView = new IsoBoxReadView(buffer, { int64: readInt64AsBigInt })
		const numView = new IsoBoxReadView(buffer)
		// @ts-expect-error a bigint view is not a number view
		const asNumView: IsoBoxReadView = bigView
		// @ts-expect-error a number view is not a bigint view
		const asBigView: IsoBoxReadView<bigint> = numView
		const eitherFromBig: IsoBoxReadView<IsoInt64> = bigView
		const eitherFromNum: IsoBoxReadView<IsoInt64> = numView

		assert.strictEqual(asNumView, eitherFromBig)
		assert.strictEqual(asBigView, eitherFromNum)

		bigView.jump(8)
		numView.jump(8)
		assert.strictEqual(readTfdt(bigView).baseMediaDecodeTime, EXACT)
		assert.strictEqual(readTfdt(numView).baseMediaDecodeTime, ROUNDED)
		bigView.jump(8)
		numView.jump(8)
		assert.strictEqual(readMfhd(bigView).sequenceNumber, 7)
		assert.strictEqual(readMfhd(numView).sequenceNumber, 7)

		expectType<Equal<ReturnType<typeof readTfdt<bigint>>['baseMediaDecodeTime'], bigint>>(true)
		expectType<Equal<ReturnType<typeof readTfdt<number>>['baseMediaDecodeTime'], number>>(true)
	})

	it('16. passes a box of either mode to the writers', function () {
		const writers = { tfdt: writeTfdt }
		const big = readIsoBoxes(buffer, {
			int64: readInt64AsBigInt,
			readers: { tfdt: readTfdt, mfhd: readMfhd },
		})
		const defaults = readIsoBoxes(buffer, { readers: { tfdt: readTfdt, mfhd: readMfhd } })
		const tfdtBytes = new Uint8Array(TFDT)

		for (const box of big) {
			if (box.type === 'tfdt') {
				assert.deepStrictEqual(writeIsoBox(box, { writers }), tfdtBytes)
				assert.deepStrictEqual(new Uint8Array(writeTfdt(box).buffer), tfdtBytes)
			}
		}

		for (const box of defaults) {
			if (box.type === 'tfdt') {
				assert.strictEqual(writeIsoBox(box, { writers }).length, 20)
				assert.strictEqual(writeTfdt(box).byteLength, 20)
			}
		}

		const tfdtBig: TrackFragmentBaseMediaDecodeTimeBox<bigint> = {
			type: 'tfdt',
			version: 1,
			flags: 0,
			baseMediaDecodeTime: EXACT,
		}
		const tfdtNum: TrackFragmentBaseMediaDecodeTimeBox = { ...tfdtBig, baseMediaDecodeTime: 1 }
		assert.deepStrictEqual(writeIsoBox(tfdtBig, { writers }), tfdtBytes)
		assert.strictEqual(writeIsoBox(tfdtNum, { writers }).length, 20)

		const bigPlain = readIsoBoxes(buffer, { int64: readInt64AsBigInt })
		const plain = readIsoBoxes(buffer)
		const source = [new Uint8Array(TFDT), new Uint8Array(MFHD), new Uint8Array(TRAF)]
		assert.deepStrictEqual(writeIsoBoxes(bigPlain, { writers: {} }), source)
		assert.deepStrictEqual(writeIsoBoxes(plain, { writers: {} }), source)

		// A list for the writers holds boxes of either mode.
		const mixed: IsoBoxStreamable<IsoInt64>[] = [...bigPlain, ...plain, tfdtBig, tfdtNum]
		assert.strictEqual(writeIsoBoxes(mixed, { writers }).length, 8)
		expectType<Equal<IsoBoxStreamable, IsoBoxStreamable<number>>>(true)
	})

	it('17. infers the mode of a view from the function', function () {
		const viewDefault = new IsoBoxReadView(buffer)
		const viewBig = new IsoBoxReadView(buffer, { int64: readInt64AsBigInt })
		const viewChecked = new IsoBoxReadView(buffer, { int64: createInt64OverflowReader(log) })

		expectType<Equal<typeof viewDefault, IsoBoxReadView<number>>>(true)
		expectType<Equal<typeof viewBig, IsoBoxReadView<bigint>>>(true)
		expectType<Equal<typeof viewChecked, IsoBoxReadView<number>>>(true)
		expectType<Equal<ReturnType<typeof viewBig.readWideUint>, bigint>>(true)
		expectType<Equal<ReturnType<typeof viewBig.readWideInt>, bigint>>(true)
		expectType<Equal<ReturnType<typeof viewDefault.readWideUint>, number>>(true)
		expectType<Equal<Parameters<typeof viewDefault.readWideUint>, [size: 4 | 8]>>(true)
		expectType<Equal<ReturnType<typeof viewBig.slice>, IsoBoxReadView<bigint>>>(true)

		assert.strictEqual(viewDefault.readWideUint, viewDefault.readUint)
		assert.strictEqual(viewDefault.readWideInt, viewDefault.readInt)
		assert.notStrictEqual(viewChecked.readWideUint, viewChecked.readUint)

		for (const box of viewBig) {
			expectType<Equal<typeof box, ParsedIsoBox<bigint>>>(true)
			assert.strictEqual(typeof box.view.readWideUint, 'function')
		}
	})

	it('18. passes a view of either mode to the exported functions', function () {
		const bigView = new IsoBoxReadView(buffer, { int64: readInt64AsBigInt })
		const numView = new IsoBoxReadView(buffer)

		expectType<Equal<ReturnType<typeof readInt64AsBigInt>, bigint>>(true)
		assert.strictEqual(readInt64AsBigInt(bigView, 4, false), BigInt(0x14))
		assert.strictEqual(readInt64AsBigInt(numView, 4, true), BigInt(0x14))
		assert.strictEqual(createInt64OverflowReader(log)(numView, 4, true), 0x74666474)

		const asReaderBig: IsoInt64Reader<bigint> = readInt64AsBigInt
		const asReaderNum: IsoInt64Reader = createInt64OverflowReader(log)
		// @ts-expect-error the bigint function is not a number function
		const asReaderWrong: IsoInt64Reader = readInt64AsBigInt

		assert.strictEqual(asReaderBig, asReaderWrong)
		assert.strictEqual(typeof asReaderNum, 'function')
	})

	it('19. accepts a function of the adopter with the option type', function () {
		const readAsBigInt: IsoInt64Reader<bigint> = (view, size) =>
			size === 8 ? view.readUint64() : BigInt(view.readUint(size))

		for (const box of readIsoBoxes(buffer, { int64: readAsBigInt, readers: { tfdt: readTfdt } })) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, bigint>>(true)
				assert.strictEqual(box.baseMediaDecodeTime, EXACT)
			}
		}
	})

	it('20. keeps the mode of a configuration or a readers map in a variable', function () {
		const storedDefault = { readers: { tfdt: readTfdt, mfhd: readMfhd } }
		for (const box of readIsoBoxes(buffer, storedDefault)) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, number>>(true)
				assert.strictEqual(box.baseMediaDecodeTime + 1, ROUNDED + 1)
			}
			if (box.type === 'mfhd') {
				expectType<Equal<typeof box.sequenceNumber, number>>(true)
			}
		}

		const storedBig = { int64: readInt64AsBigInt, readers: { tfdt: readTfdt } }
		for (const box of readIsoBoxes(buffer, storedBig)) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, bigint>>(true)
				assert.strictEqual(box.baseMediaDecodeTime, EXACT)
			}
		}

		const storedReaders = { tfdt: readTfdt }
		for (const box of readIsoBoxes(buffer, { readers: storedReaders })) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, number>>(true)
			}
		}
		for (const box of readIsoBoxes(buffer, { int64: readInt64AsBigInt, readers: storedReaders })) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, bigint>>(true)
				assert.strictEqual(box.baseMediaDecodeTime, EXACT)
			}
		}

		// A stored custom reader of the number view keeps its own type.
		const storedCustom = { tfdt: readTfdtCustom, mfhd: readTfdt64 }
		for (const box of readIsoBoxes(buffer, { readers: storedCustom })) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, number | bigint>>(true)
			}
		}
		for (const box of readIsoBoxes(buffer, { readers: { tfdt: readTfdtCustom } })) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.extra, string>>(true)
			}
		}
	})

	it('20b. gives a stored reader of a box with two versions the mode of the call', function () {
		const stored = { emsg: readEmsg }

		for (const box of readIsoBoxes(buffer, { int64: readInt64AsBigInt, readers: stored })) {
			if (box.type === 'emsg' && box.version === 1) {
				expectType<Equal<typeof box.presentationTime, bigint>>(true)
			}
			if (box.type === 'emsg' && box.version === 0) {
				expectType<Equal<typeof box.presentationTimeDelta, number>>(true)
			}
		}

		for (const box of readIsoBoxes(buffer, { readers: stored })) {
			if (box.type === 'emsg' && box.version === 1) {
				expectType<Equal<typeof box.presentationTime, number>>(true)
			}
		}

		assert.strictEqual(readIsoBoxes(buffer, { readers: stored }).length, 3)
	})

	it('20c. keeps the any of a reader that returns any', function () {
		const readAny = (view: IsoBoxReadView): any => ({ value: view.readUint(4) })
		const boxes = readIsoBoxes(buffer, { readers: { mfhd: readAny } })

		expectType<Equal<(typeof boxes)[number], any>>(true)
		assert.strictEqual(boxes.length, 3)
	})

	it('20d. gives the return type of a built-in reader a mode with a type argument', function () {
		// The return type of a generic reader with no type argument has the fields of either mode.
		expectType<Equal<ReturnType<typeof readTfdt>['baseMediaDecodeTime'], number | bigint>>(true)
		expectType<Equal<ReturnType<typeof readTfdt<number>>, TrackFragmentBaseMediaDecodeTimeBox>>(
			true,
		)
		expectType<
			Equal<ReturnType<typeof readTfdt<bigint>>, TrackFragmentBaseMediaDecodeTimeBox<bigint>>
		>(true)
		assert.strictEqual(typeof readTfdt, 'function')
	})

	it('20e. keeps the utility types of readIsoBoxes', function () {
		expectType<
			Equal<Parameters<typeof readIsoBoxes>, [raw: IsoBoxData, config?: IsoBoxReadViewConfig]>
		>(true)
		expectType<Equal<ReturnType<typeof readIsoBoxes>, ParsedIsoBox[]>>(true)

		const args: Parameters<typeof readIsoBoxes> = [buffer, { readers: { tfdt: readTfdt } }]
		const boxes: ReturnType<typeof readIsoBoxes> = readIsoBoxes(...args)
		let count = 0

		for (const box of boxes) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, number>>(true)
				assert.strictEqual(box.baseMediaDecodeTime, ROUNDED)
				count++
			}
		}

		assert.strictEqual(count, 1)
	})

	it('20f. gives the utility types of the other generic members the fields of either mode', function () {
		expectType<Equal<ReturnType<typeof defaultReaderConfig>, IsoBoxReadViewConfig<IsoInt64>>>(true)
		expectType<Equal<InstanceType<typeof IsoBoxReadView>, IsoBoxReadView<IsoInt64>>>(true)
		expectType<Equal<Parameters<typeof readTfdt>[0], IsoBoxReadView<IsoInt64>>>(true)
		assert.strictEqual(typeof defaultReaderConfig, 'function')
	})

	it('21. gives a stored generic custom reader the union type', function () {
		const storedAware = { tfdt: readTfdtAware }
		for (const box of readIsoBoxes(buffer, { readers: storedAware })) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, number | bigint>>(true)
			}
		}

		// A type argument in the stored map selects the mode.
		const storedAwareNumber = { tfdt: readTfdtAware<number> }
		for (const box of readIsoBoxes(buffer, { readers: storedAwareNumber })) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, number>>(true)
			}
		}

		const storedAwareBig = { tfdt: readTfdtAware<bigint> }
		for (const box of readIsoBoxes(buffer, { int64: readInt64AsBigInt, readers: storedAwareBig })) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, bigint>>(true)
				expectType<Equal<typeof box.extra, string>>(true)
				assert.strictEqual(box.baseMediaDecodeTime, EXACT)
			}
		}

		// A custom reader that returns less than the built-in type keeps its own type.
		const readTfdtBare = () => ({ type: 'tfdt' as const })
		for (const box of readIsoBoxes(buffer, { readers: { tfdt: readTfdtBare } })) {
			if (box.type === 'tfdt') {
				// @ts-expect-error the custom reader returns no version field
				assert.strictEqual(box.version, undefined)
			}
		}
	})

	it('22. infers the mode from an inline function, in both key orders', function () {
		for (const box of readIsoBoxes(buffer, {
			int64: view => view.readUint64(),
			readers: { tfdt: readTfdt },
		})) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, bigint>>(true)
				assert.strictEqual(box.baseMediaDecodeTime, EXACT)
			}
		}

		for (const box of readIsoBoxes(buffer, {
			readers: { tfdt: readTfdt },
			int64: view => view.readUint64(),
		})) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, bigint>>(true)
			}
		}
	})

	it('23. registers a reader of the view of either mode in both modes', function () {
		for (const box of readIsoBoxes(buffer, { readers: { tfdt: readTfdt, free: readFreeEither } })) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, number>>(true)
			}
		}

		for (const box of readIsoBoxes(buffer, {
			int64: readInt64AsBigInt,
			readers: { tfdt: readTfdt, mfhd: readMfhd, free: readFreeEither },
		})) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, bigint>>(true)
			}
			if (box.type === 'mfhd') {
				expectType<Equal<typeof box.sequenceNumber, number>>(true)
			}
			if (box.type === 'free') {
				expectType<Equal<typeof box.length, number>>(true)
			}
		}

		assert.strictEqual(
			readFreeEither(new IsoBoxReadView(buffer, { int64: readInt64AsBigInt })).length,
			64,
		)
		assert.strictEqual(readFreeEither(new IsoBoxReadView(buffer)).length, 64)

		// A typed configuration and a typed map accept such a reader in both modes.
		const typedBig: IsoBoxReadViewConfig<bigint> = {
			int64: readInt64AsBigInt,
			readers: { tfdt: readTfdt, mfhd: readMfhd, free: readFreeEither },
		}
		const typedNumber: IsoBoxReadViewConfig = { readers: { tfdt: readTfdt, mfhd: readMfhd } }
		const typedBigMap: IsoBoxReaderMap<bigint> = { mfhd: readMfhd, free: readFreeEither }
		assert.ok(typedBig.readers && typedNumber.readers && typedBigMap)

		// Readers next to the spread of the default configuration.
		for (const box of readIsoBoxes(buffer, {
			...defaultReaderConfig({ int64: readInt64AsBigInt }),
			readers: { tfdt: readTfdt, mfhd: readMfhd },
		})) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, bigint>>(true)
			}
		}

		// A reader of the view of either mode that reads a wide field gets the union type, in both modes.
		const readUnionEither = (view: IsoBoxReadView<IsoInt64>) => ({
			type: 'mfhd' as const,
			value: view.readWideUint(4),
		})
		for (const box of readIsoBoxes(buffer, {
			int64: readInt64AsBigInt,
			readers: { mfhd: readUnionEither },
		})) {
			if (box.type === 'mfhd') {
				expectType<Equal<typeof box.value, number | bigint>>(true)
				assert.strictEqual(box.value, BigInt(0))
			}
		}

		// A generic reader of an unaffected box also registers in both modes.
		const readMfhdGeneric = <V extends IsoInt64>(view: IsoBoxReadView<V>) => ({
			type: 'mfhd' as const,
			sequenceNumber: view.readUint(4),
		})
		void readIsoBoxes(buffer, { readers: { mfhd: readMfhdGeneric } })
		void readIsoBoxes(buffer, { int64: readInt64AsBigInt, readers: { mfhd: readMfhdGeneric } })
	})

	it('24. registers a reader from a factory in both modes', function () {
		for (const box of readIsoBoxes(buffer, {
			readers: { tfdt: readTfdt, 'ec-3': createAudioSampleEntryReader('ec-3') },
		})) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, number>>(true)
			}
			if (box.type === 'ec-3') {
				expectType<Equal<typeof box.dataReferenceIndex, number>>(true)
			}
		}

		for (const box of readIsoBoxes(buffer, {
			int64: readInt64AsBigInt,
			readers: { tfdt: readTfdt, 'ec-3': createAudioSampleEntryReader('ec-3') },
		})) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, bigint>>(true)
			}
			if (box.type === 'ec-3') {
				expectType<Equal<typeof box.dataReferenceIndex, number>>(true)
			}
		}

		// A reader from a factory in a stored map keeps the mode of the call.
		const storedFactory = { tfdt: readTfdt, 'ec-3': createAudioSampleEntryReader('ec-3') }
		for (const box of readIsoBoxes(buffer, { int64: readInt64AsBigInt, readers: storedFactory })) {
			if (box.type === 'tfdt') {
				expectType<Equal<typeof box.baseMediaDecodeTime, bigint>>(true)
				assert.strictEqual(box.baseMediaDecodeTime, EXACT)
			}
		}

		// A map of the type `IsoBoxReaderMap` takes a reader from a factory by assignment.
		// `@svta/cml-drm` builds its readers map in this way.
		const dynamicReaders: IsoBoxReaderMap = {}
		dynamicReaders['ec-3'] = createAudioSampleEntryReader('ec-3')
		assert.strictEqual(readIsoBoxes(buffer, { readers: dynamicReaders }).length, 3)

		// A reader of the number view, as the factories of earlier releases return.
		const readerToday = (view: IsoBoxReadView) => ({
			type: 'ec-3' as const,
			dataReferenceIndex: view.readUint(2),
		})
		void readIsoBoxes(buffer, { readers: { 'ec-3': readerToday } })
		// @ts-expect-error a reader of the number view cannot take a bigint view
		readIsoBoxes(buffer, { int64: readInt64AsBigInt, readers: { 'ec-3': readerToday } })
	})
})
