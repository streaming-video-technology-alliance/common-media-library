import {
	assert,
	createInt64OverflowReader,
	defaultReaderConfig,
	defaultWriterConfig,
	describe,
	it,
	IsoBoxReadView,
	readInt64AsBigInt,
	readIsoBoxes,
	writeIsoBox,
	writeIsoBoxes,
	writeTfdt,
} from './util/box.ts'
import { bigintFields, boxBytes, valueAt, WIDE_BOXES, wideValues } from './util/wideBoxes.ts'

// 2^54 + 1. A `number` cannot hold this value or the values 2 apart from it.
const HIGH = BigInt('18014398509481985')
// A value that fits in a 4-byte field.
const LOW = BigInt(1000)
const MESSAGE = '64-bit value is outside the safe integer range'

describe('int64 option', function () {
	for (const box of WIDE_BOXES) {
		const { type, paths } = box
		const high = wideValues(box, HIGH)
		const low = wideValues(box, LOW)
		const expected = (values: bigint[]): Record<string, bigint> =>
			Object.fromEntries(paths.map((path, i) => [path, values[i]]))

		describe(type, function () {
			it('should read every 64-bit field above 2^53 exactly with readInt64AsBigInt', function () {
				const [parsed] = readIsoBoxes(
					box.bytes(high, 8),
					defaultReaderConfig({ int64: readInt64AsBigInt }),
				)

				assert.ok(parsed)
				assert.strictEqual(parsed.type, type)
				assert.strictEqual(parsed.view.bytesRemaining, 0)
				assert.deepStrictEqual(bigintFields(parsed), expected(high))
			})

			it('should read the rounded number with no option', function () {
				const [parsed] = readIsoBoxes(box.bytes(high, 8), defaultReaderConfig())

				assert.ok(parsed)
				assert.strictEqual(parsed.view.bytesRemaining, 0)
				assert.deepStrictEqual(bigintFields(parsed), {})

				for (const [i, path] of paths.entries()) {
					assert.strictEqual(valueAt(parsed, path), Number(high[i]))
					assert.notStrictEqual(BigInt(Number(high[i])), high[i])
				}
			})

			it('should read the same fields with and without the overflow function', function () {
				const errors: RangeError[] = []
				const [checked] = readIsoBoxes(
					box.bytes(high, 8),
					defaultReaderConfig({
						int64: createInt64OverflowReader(error => void errors.push(error)),
					}),
				)
				const [plain] = readIsoBoxes(box.bytes(high, 8), defaultReaderConfig())

				assert.ok(checked && plain)
				assert.strictEqual(checked.view.bytesRemaining, 0)
				assert.deepStrictEqual({ ...checked, view: null }, { ...plain, view: null })
				assert.strictEqual(errors.length, paths.length)

				for (const error of errors) {
					assert.ok(error instanceof RangeError)
					assert.strictEqual(error.message, MESSAGE)
				}
			})

			it('should not call the overflow callback for values in the safe range', function () {
				const safe = wideValues(box, BigInt(Number.MAX_SAFE_INTEGER) - BigInt(8), BigInt(1))
				const [parsed] = readIsoBoxes(
					box.bytes(safe, 8),
					defaultReaderConfig({
						int64: createInt64OverflowReader(() => assert.fail('no value overflows')),
					}),
				)

				assert.ok(parsed)

				for (const [i, path] of paths.entries()) {
					assert.strictEqual(valueAt(parsed, path), Number(safe[i]))
					assert.strictEqual(BigInt(Number(safe[i])), safe[i])
				}
			})

			it('should stop the read when the overflow callback throws', function () {
				const errors: RangeError[] = []

				assert.throws(
					() =>
						readIsoBoxes(
							box.bytes(high, 8),
							defaultReaderConfig({
								int64: createInt64OverflowReader(error => {
									errors.push(error)
									throw error
								}),
							}),
						),
					(error: unknown) => error === errors[0],
				)
				assert.strictEqual(errors.length, 1)
			})

			it('should write a box with bigint fields back to the same bytes', function () {
				const source = box.bytes(high, 8)
				const config = defaultReaderConfig({ int64: readInt64AsBigInt })
				const [parsed] = readIsoBoxes(source, config)

				assert.ok(parsed)

				const written = writeIsoBox(parsed, defaultWriterConfig())

				assert.deepStrictEqual(written, source)
				assert.deepStrictEqual(bigintFields(readIsoBoxes(written, config)[0]), expected(high))
			})

			it('should write a box with number fields back to the same bytes', function () {
				const safe = wideValues(box, BigInt(Number.MAX_SAFE_INTEGER) - BigInt(8), BigInt(1))
				const source = box.bytes(safe, 8)
				const [parsed] = readIsoBoxes(source, defaultReaderConfig())

				assert.ok(parsed)
				assert.deepStrictEqual(writeIsoBox(parsed, defaultWriterConfig()), source)
			})

			if (box.fixed) {
				return
			}

			it('should write a version 0 box with bigint fields back to the same bytes', function () {
				const source = box.bytes(low, 4)
				const [parsed] = readIsoBoxes(source, defaultReaderConfig({ int64: readInt64AsBigInt }))

				assert.ok(parsed)
				assert.deepStrictEqual(writeIsoBox(parsed, defaultWriterConfig()), source)
			})

			it('should write a version 0 box with number fields back to the same bytes', function () {
				const source = box.bytes(low, 4)
				const [parsed] = readIsoBoxes(source, defaultReaderConfig())

				assert.ok(parsed)
				assert.deepStrictEqual(writeIsoBox(parsed, defaultWriterConfig()), source)
			})

			it('should throw a RangeError for a bigint that does not fit a version 0 field', function () {
				const [parsed] = readIsoBoxes(
					box.bytes(high, 8),
					defaultReaderConfig({ int64: readInt64AsBigInt }),
				)

				assert.ok(parsed)
				assert.throws(
					() => writeIsoBox({ ...parsed, version: 0 } as typeof parsed, defaultWriterConfig()),
					RangeError,
				)
			})

			it('should read a version 0 field as a bigint with readInt64AsBigInt', function () {
				const [parsed] = readIsoBoxes(
					box.bytes(low, 4),
					defaultReaderConfig({ int64: readInt64AsBigInt }),
				)

				assert.ok(parsed)
				assert.strictEqual(parsed.view.bytesRemaining, 0)
				assert.strictEqual(valueAt(parsed, 'version'), 0)
				assert.deepStrictEqual(bigintFields(parsed), expected(low))
			})

			it('should read a version 0 field as a number with no option', function () {
				const [parsed] = readIsoBoxes(box.bytes(low, 4), defaultReaderConfig())

				assert.ok(parsed)
				assert.deepStrictEqual(bigintFields(parsed), {})

				for (const [i, path] of paths.entries()) {
					assert.strictEqual(valueAt(parsed, path), Number(low[i]))
				}
			})

			it('should not call the overflow callback for a version 0 box', function () {
				const [parsed] = readIsoBoxes(
					box.bytes(low, 4),
					defaultReaderConfig({
						int64: createInt64OverflowReader(() => assert.fail('a 4-byte field never overflows')),
					}),
				)

				assert.ok(parsed)

				for (const [i, path] of paths.entries()) {
					assert.strictEqual(valueAt(parsed, path), Number(low[i]))
				}
			})
		})
	}

	it('should cover the eleven box types with 64-bit fields', function () {
		assert.deepStrictEqual(WIDE_BOXES.map(box => box.type).sort(), [
			'elst',
			'emsg',
			'mdhd',
			'mehd',
			'mvhd',
			'prft',
			'sidx',
			'tfdt',
			'tfhd',
			'tfra',
			'tkhd',
		])
	})

	it('should read the signed mediaTime of an elst box exactly', function () {
		const elst = WIDE_BOXES.find(box => box.type === 'elst')
		assert.ok(elst)

		const min = -(BigInt(2) ** BigInt(63))
		const max = BigInt(2) ** BigInt(63) - BigInt(1)
		const [parsed] = readIsoBoxes(
			elst.bytes([BigInt(1), BigInt(-1), BigInt(2), min], 8),
			defaultReaderConfig({ int64: readInt64AsBigInt }),
		)
		const [other] = readIsoBoxes(
			elst.bytes([max, max, BigInt(0), -HIGH], 8),
			defaultReaderConfig({ int64: readInt64AsBigInt }),
		)

		assert.ok(parsed && other)
		assert.strictEqual(parsed.type, 'elst')
		assert.strictEqual(other.type, 'elst')
		assert.strictEqual(parsed.entries[0].mediaTime, BigInt(-1))
		assert.strictEqual(parsed.entries[1].mediaTime, min)
		assert.strictEqual(other.entries[0].segmentDuration, max)
		assert.strictEqual(other.entries[0].mediaTime, max)
		assert.strictEqual(other.entries[1].mediaTime, -HIGH)
		assert.strictEqual(parsed.entries[0].mediaRateInteger, 1)
	})

	it('should read the version 0 mediaTime of an elst box as a negative bigint', function () {
		const elst = WIDE_BOXES.find(box => box.type === 'elst')
		assert.ok(elst)

		const [parsed] = readIsoBoxes(
			elst.bytes([1, -1, 0xffffffff, -2147483648], 4),
			defaultReaderConfig({ int64: readInt64AsBigInt }),
		)

		assert.ok(parsed)
		assert.strictEqual(parsed.type, 'elst')
		assert.deepStrictEqual(
			parsed.entries.map(entry => [entry.segmentDuration, entry.mediaTime]),
			[
				[BigInt(1), BigInt(-1)],
				[BigInt(0xffffffff), BigInt(-2147483648)],
			],
		)
	})

	it('should leave an absent baseDataOffset undefined in both modes', function () {
		const bytes = boxBytes('tfhd', [0, 1], [0, 3], [1, 4])
		const [big] = readIsoBoxes(bytes, defaultReaderConfig({ int64: readInt64AsBigInt }))
		const [plain] = readIsoBoxes(bytes, defaultReaderConfig())

		assert.ok(big && plain)
		assert.strictEqual(big.type, 'tfhd')
		assert.strictEqual(plain.type, 'tfhd')
		assert.strictEqual(big.baseDataOffset, undefined)
		assert.strictEqual(plain.baseDataOffset, undefined)
	})

	it('should keep the version 0 fields of an emsg box as numbers', function () {
		const bytes = boxBytes(
			'emsg',
			[0, 1],
			[0, 3],
			new Uint8Array([0x75, 0x00, 0x76, 0x00]),
			[90000, 4],
			[5, 4],
			[10, 4],
			[1, 4],
		)
		const [parsed] = readIsoBoxes(bytes, defaultReaderConfig({ int64: readInt64AsBigInt }))

		assert.ok(parsed)
		assert.strictEqual(parsed.type, 'emsg')
		assert.strictEqual(parsed.version, 0)
		assert.strictEqual(parsed.presentationTimeDelta, 5)
		assert.deepStrictEqual(bigintFields(parsed), {})
	})

	it('should apply the option to the child boxes of a container', function () {
		const tfdt = WIDE_BOXES.find(box => box.type === 'tfdt')
		assert.ok(tfdt)

		const traf = boxBytes('traf', tfdt.bytes([HIGH], 8))
		const moof = boxBytes('moof', boxBytes('mfhd', [0, 1], [0, 3], [7, 4]), traf)
		const [parsed] = readIsoBoxes(moof, defaultReaderConfig({ int64: readInt64AsBigInt }))

		assert.ok(parsed)
		assert.strictEqual(parsed.type, 'moof')
		assert.deepStrictEqual(bigintFields(parsed), { 'boxes.1.boxes.0.baseMediaDecodeTime': HIGH })

		const [, child] = parsed.boxes
		assert.strictEqual(child.type, 'traf')
		const [time] = child.boxes
		assert.strictEqual(time.type, 'tfdt')
		assert.strictEqual(time.baseMediaDecodeTime, HIGH)
	})

	it('should write a container with bigint fields back to the same bytes', function () {
		const tfdt = WIDE_BOXES.find(box => box.type === 'tfdt')
		const tfhd = WIDE_BOXES.find(box => box.type === 'tfhd')
		assert.ok(tfdt && tfhd)

		const traf = boxBytes('traf', tfhd.bytes([HIGH], 8), tfdt.bytes([HIGH + BigInt(2)], 8))
		const moof = boxBytes('moof', boxBytes('mfhd', [0, 1], [0, 3], [7, 4]), traf)
		const boxes = readIsoBoxes(moof, defaultReaderConfig({ int64: readInt64AsBigInt }))

		assert.deepStrictEqual(writeIsoBoxes(boxes, defaultWriterConfig()), [moof])
	})

	it('should write a box object with a bigint field', function () {
		const writer = writeTfdt({ type: 'tfdt', version: 1, flags: 0, baseMediaDecodeTime: HIGH })
		const bytes = writeIsoBox(
			{ type: 'tfdt', version: 1, flags: 0, baseMediaDecodeTime: HIGH },
			defaultWriterConfig(),
		)

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			boxBytes('tfdt', [1, 1], [0, 3], [HIGH, 8]),
		)
		assert.deepStrictEqual(bytes, boxBytes('tfdt', [1, 1], [0, 3], [HIGH, 8]))
	})

	it('should write boxes with number fields and bigint fields in one list', function () {
		const tfdt = WIDE_BOXES.find(box => box.type === 'tfdt')
		assert.ok(tfdt)

		const source = tfdt.bytes([HIGH], 8)
		const [big] = readIsoBoxes(source, defaultReaderConfig({ int64: readInt64AsBigInt }))
		const [plain] = readIsoBoxes(tfdt.bytes([LOW], 8), defaultReaderConfig())

		assert.ok(big && plain)
		assert.deepStrictEqual(writeIsoBoxes([big, plain], defaultWriterConfig()), [
			source,
			tfdt.bytes([LOW], 8),
		])
	})

	it('should apply the option to a view that the caller constructs', function () {
		const tfdt = WIDE_BOXES.find(box => box.type === 'tfdt')
		assert.ok(tfdt)

		const config = defaultReaderConfig({ int64: readInt64AsBigInt })
		const [parsed] = [...new IsoBoxReadView(tfdt.bytes([HIGH], 8), config)]

		assert.ok(parsed)
		assert.strictEqual(parsed.type, 'tfdt')
		assert.strictEqual(parsed.baseMediaDecodeTime, HIGH)
	})

	it('should not change the size or the largesize of a box', function () {
		const mdat = new Uint8Array(24)
		const view = new DataView(mdat.buffer)
		view.setUint32(0, 1)
		mdat.set([0x6d, 0x64, 0x61, 0x74], 4)
		view.setBigUint64(8, BigInt(24))

		const [parsed] = readIsoBoxes(mdat, defaultReaderConfig({ int64: readInt64AsBigInt }))

		assert.ok(parsed)
		assert.strictEqual(parsed.size, 1)
		assert.strictEqual(parsed.largesize, 24)
	})
})
