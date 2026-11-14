import {
	assert,
	defaultReaderConfig,
	describe,
	isContainer,
	it,
	readInt64AsBigInt,
	readIsoBoxes,
	type AdditionalMetadataContainerBox,
	type GroupsListBox,
	type IsoBox,
	type SubTrackBox,
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
	it('reads a field of a child of a container', function () {
		// #region example
		const times: number[] = []

		for (const box of readIsoBoxes(buffer, defaultReaderConfig())) {
			if (isContainer(box)) {
				for (const child of box.boxes) {
					if (child.type === 'tfdt') {
						times.push(child.baseMediaDecodeTime)
					}
				}
			}
		}
		// #endregion example

		assert.deepStrictEqual(times, [ROUNDED])
	})

	it('gives each child of a container a box type', function () {
		let count = 0
		for (const box of readIsoBoxes(buffer, defaultReaderConfig())) {
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
		for (const box of readIsoBoxes(buffer, defaultReaderConfig())) {
			if (isContainer(box)) {
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

	it('keeps the bigint fields of a child with readInt64AsBigInt', function () {
		let count = 0
		for (const box of readIsoBoxes(buffer, defaultReaderConfig({ int64: readInt64AsBigInt }))) {
			if (isContainer(box)) {
				for (const child of box.boxes) {
					if (child.type === 'tfdt') {
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
		for (const box of readIsoBoxes(buffer, defaultReaderConfig())) {
			if (box.type === 'moov') {
				for (const child of box.boxes) {
					if (child.type === 'udta') {
						for (const inner of child.boxes) {
							// @ts-expect-error a box has no field with this name
							assert.strictEqual(inner.noSuchField, undefined)
							if (inner.type === 'tfdt') {
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
		for (const box of readIsoBoxes(buffer, defaultReaderConfig({ int64: readInt64AsBigInt }))) {
			if (box.type === 'moov') {
				for (const child of box.boxes) {
					if (child.type === 'udta') {
						for (const inner of child.boxes) {
							if (inner.type === 'tfdt') {
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

	it('types each child of the udta, grpl, strk, and meco boxes as IsoBox', function () {
		expectType<Equal<UserDataBox['boxes'][number], IsoBox>>(true)
		expectType<Equal<GroupsListBox['boxes'][number], IsoBox>>(true)
		expectType<Equal<SubTrackBox['boxes'][number], IsoBox>>(true)
		expectType<Equal<AdditionalMetadataContainerBox['boxes'][number], IsoBox>>(true)

		expectType<Equal<UserDataBox<bigint>['boxes'][number], IsoBox<bigint>>>(true)
		expectType<Equal<GroupsListBox<bigint>['boxes'][number], IsoBox<bigint>>>(true)
		expectType<Equal<SubTrackBox<bigint>['boxes'][number], IsoBox<bigint>>>(true)
		expectType<Equal<AdditionalMetadataContainerBox<bigint>['boxes'][number], IsoBox<bigint>>>(true)
	})
})
