import {
	assert,
	createDefaultReaderConfig,
	describe,
	filterIsoBoxes,
	isContainer,
	isIsoBoxType,
	it,
	readInt64AsBigInt,
	readIsoBoxes,
	readUint8,
	type AdditionalMetadataContainerBox,
	type GroupsListBox,
	type IsoBoxReadCursor,
	type ParsedIsoBox,
	type SubTrack,
	type UserDataBox,
} from './util/box.ts'
import { expectType, type Equal } from './util/expectType.ts'

// The type check of the repo is part of this test.
// Every `@ts-expect-error` line must fail to compile, and every other line must compile.

// 2^54 + 1. A `number` rounds this value to 2^54.
const EXACT = BigInt('18014398509481985')
const ROUNDED = 18014398509481984

// A traf box that holds a version 1 tfdt box, and a moov box that holds a udta box with the same tfdt box.
const TFDT = [
	0x00, 0x00, 0x00, 0x14, 0x74, 0x66, 0x64, 0x74, 0x01, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00,
	0x00, 0x00, 0x00, 0x01,
]
const TRAF = [0x00, 0x00, 0x00, 0x1c, 0x74, 0x72, 0x61, 0x66, ...TFDT]
const UDTA = [0x00, 0x00, 0x00, 0x1c, 0x75, 0x64, 0x74, 0x61, ...TFDT]
const MOOV = [0x00, 0x00, 0x00, 0x24, 0x6d, 0x6f, 0x6f, 0x76, ...UDTA]
const buffer = new Uint8Array([...TRAF, ...MOOV]).buffer

describe('isContainer', function () {
	it('reads a field of a child of a moof box', function () {
		// #region example
		// A moof box that holds an mfhd box with the sequence number 7.
		const bytes = new Uint8Array([
			0,
			0,
			0,
			24,
			0x6d,
			0x6f,
			0x6f,
			0x66, // moof
			0,
			0,
			0,
			16,
			0x6d,
			0x66,
			0x68,
			0x64,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			7, // mfhd
		])

		const sequenceNumbers: number[] = []
		for (const box of readIsoBoxes(bytes, createDefaultReaderConfig())) {
			if (isContainer(box)) {
				for (const child of box.boxes) {
					if (isIsoBoxType('mfhd', child)) {
						sequenceNumbers.push(child.sequenceNumber)
					}
				}
			}
		}
		// #endregion example

		assert.deepStrictEqual(sequenceNumbers, [7])
	})

	it('reads a field of a child of a container', function () {
		const times: number[] = []

		for (const box of readIsoBoxes(buffer, createDefaultReaderConfig())) {
			if (isContainer(box)) {
				for (const child of box.boxes) {
					if (isIsoBoxType('tfdt', child)) {
						times.push(child.baseMediaDecodeTime)
					}
				}
			}
		}

		assert.deepStrictEqual(times, [ROUNDED])
	})

	it('gives each child of a container a box type', function () {
		let count = 0
		for (const box of readIsoBoxes(buffer, createDefaultReaderConfig())) {
			if (isContainer(box)) {
				for (const child of box.boxes) {
					// @ts-expect-error a box has no field with this name
					assert.strictEqual(child.noSuchField, undefined)
					count++
				}
			}
		}
		assert.strictEqual(count, 2)
	})

	it('keeps the number fields of a child with no option', function () {
		let count = 0
		for (const box of readIsoBoxes(buffer, createDefaultReaderConfig())) {
			if (isContainer(box)) {
				for (const child of box.boxes) {
					if (isIsoBoxType('tfdt', child)) {
						expectType<Equal<typeof child.baseMediaDecodeTime, number>>(true)
						assert.strictEqual(child.baseMediaDecodeTime, ROUNDED)
						count++
					}
				}
			}
		}
		assert.strictEqual(count, 1)
	})

	it('keeps the bigint fields of a child with readInt64AsBigInt', function () {
		let count = 0
		for (const box of readIsoBoxes(
			buffer,
			createDefaultReaderConfig({ int64: readInt64AsBigInt }),
		)) {
			if (isContainer(box)) {
				for (const child of box.boxes) {
					if (isIsoBoxType('tfdt', child)) {
						expectType<Equal<typeof child.baseMediaDecodeTime, bigint>>(true)
						assert.strictEqual(child.baseMediaDecodeTime, EXACT)
						count++
					}
				}
			}
		}
		assert.strictEqual(count, 1)
	})

	it('gives each child of a udta box a box type with number fields', function () {
		let count = 0
		for (const box of readIsoBoxes(buffer, createDefaultReaderConfig())) {
			if (isIsoBoxType('moov', box)) {
				for (const child of box.boxes) {
					if (isIsoBoxType('udta', child)) {
						for (const inner of child.boxes) {
							// @ts-expect-error a box has no field with this name
							assert.strictEqual(inner.noSuchField, undefined)
							if (isIsoBoxType('tfdt', inner)) {
								expectType<Equal<typeof inner.baseMediaDecodeTime, number>>(true)
								assert.strictEqual(inner.baseMediaDecodeTime, ROUNDED)
								count++
							}
						}
					}
				}
			}
		}
		assert.strictEqual(count, 1)
	})

	it('gives each child of a udta box bigint fields with readInt64AsBigInt', function () {
		let count = 0
		for (const box of readIsoBoxes(
			buffer,
			createDefaultReaderConfig({ int64: readInt64AsBigInt }),
		)) {
			if (isIsoBoxType('moov', box)) {
				for (const child of box.boxes) {
					if (isIsoBoxType('udta', child)) {
						for (const inner of child.boxes) {
							if (isIsoBoxType('tfdt', inner)) {
								expectType<Equal<typeof inner.baseMediaDecodeTime, bigint>>(true)
								assert.strictEqual(inner.baseMediaDecodeTime, EXACT)
								count++
							}
						}
					}
				}
			}
		}
		assert.strictEqual(count, 1)
	})

	it('types each child of the udta, grpl, strk, and meco boxes as ParsedIsoBox', function () {
		expectType<Equal<UserDataBox['boxes'][number], ParsedIsoBox>>(true)
		expectType<Equal<GroupsListBox['boxes'][number], ParsedIsoBox>>(true)
		expectType<Equal<SubTrack['boxes'][number], ParsedIsoBox>>(true)
		expectType<Equal<AdditionalMetadataContainerBox['boxes'][number], ParsedIsoBox>>(true)

		expectType<Equal<UserDataBox<bigint>['boxes'][number], ParsedIsoBox<bigint>>>(true)
		expectType<Equal<GroupsListBox<bigint>['boxes'][number], ParsedIsoBox<bigint>>>(true)
		expectType<Equal<SubTrack<bigint>['boxes'][number], ParsedIsoBox<bigint>>>(true)
		expectType<
			Equal<AdditionalMetadataContainerBox<bigint>['boxes'][number], ParsedIsoBox<bigint>>
		>(true)
	})

	it('takes the result of a custom reader', function () {
		const readers = {
			abcd: (cursor: IsoBoxReadCursor) => ({ type: 'abcd' as const, x: readUint8(cursor) }),
		}
		const boxes = readIsoBoxes(buffer, { readers })

		assert.deepStrictEqual(
			filterIsoBoxes(boxes, isContainer).map(box => box.type),
			['traf', 'moov', 'udta'],
		)

		for (const box of boxes) {
			if (isContainer(box)) {
				assert.ok(Array.isArray(box.boxes))
			}
		}
	})

	it('keeps a custom result with a container type and no boxes field', function () {
		const readers = { traf: () => ({ type: 'traf' as const, note: 1 }) }
		let count = 0

		for (const box of readIsoBoxes(buffer, { readers })) {
			if (isContainer(box) && box.type === 'traf') {
				// @ts-expect-error the custom traf result has no boxes field
				assert.strictEqual(box.boxes, undefined)
				assert.strictEqual(box.note, 1)
				count++
			}
		}

		assert.strictEqual(count, 1)
	})
})
