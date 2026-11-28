import { expectType, type Equal } from './util/expectType.ts'
import { load } from './util/load.ts'
import { reduceUint8Arrays } from './util/reduceUint8Arrays.ts'
import { boxBytes } from './util/wideBoxes.ts'
import {
	assert,
	createIsoBoxReadCursor,
	describe,
	isIsoBoxType,
	it,
	iterateChildBoxes,
	nextIsoBox,
	readIsoBoxes,
	readChildBoxes,
	readInt64AsBigInt,
	readTfdt,
	readTfhd,
	readTrun,
	seekIsoBox,
	type IsoBoxReadCursor,
	type MovieBox,
	type ParsedIsoBox,
} from './util/box.ts'

const USERTYPE = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
const MFHD = boxBytes('mfhd', new Uint8Array([0, 0, 0, 0, 0, 0, 0, 7]))
const MDAT = boxBytes('mdat', new Uint8Array([0xaa, 0xbb]))

function tfhd(trackId: number): Uint8Array {
	return boxBytes('tfhd', [0, 1], [0, 3], [trackId, 4])
}

describe('iterateChildBoxes', function () {
	it('should yield the type and a cursor of each box', function () {
		// #region example
		const traf = seekIsoBox(load('mss_moof_tfdt.mp4'), ['moof', 'traf'])
		const sizes: Record<string, number> = {}
		let samples = 0

		assert.ok(traf)

		for (const [type, child] of iterateChildBoxes(traf)) {
			sizes[type] = child.end - child.start // tfhd, tfdt, and trun with the size of each box

			if (type === 'trun') {
				samples = readTrun(child).samples.length
			}
		}
		// #endregion example

		assert.deepStrictEqual(Object.keys(sizes), ['tfhd', 'tfdt', 'trun'])
		assert.strictEqual(samples, 93)
	})

	it('should read the second traf box of a moof box', function () {
		const moof = boxBytes('moof', MFHD, boxBytes('traf', tfhd(1)), boxBytes('traf', tfhd(2)))
		const cursor = seekIsoBox(moof, ['moof'])
		const trackIds: number[] = []

		assert.ok(cursor)

		for (const [type, traf] of iterateChildBoxes(cursor)) {
			if (type === 'traf') {
				const header = seekIsoBox(traf, ['tfhd'])

				trackIds.push(header ? readTfhd(header).trackId : -1)
			}
		}

		assert.deepStrictEqual(trackIds, [1, 2])
	})

	it('should set start, pos, and end to the bytes of each box', function () {
		const bytes = reduceUint8Arrays([MFHD, MDAT])
		const cursor = createIsoBoxReadCursor(bytes)
		const spans = [...iterateChildBoxes(cursor)].map(([type, child]) => [
			type,
			child.start,
			child.pos,
			child.end,
		])

		assert.deepStrictEqual(spans, [
			['mfhd', 0, 8, MFHD.length],
			['mdat', MFHD.length, MFHD.length + 8, bytes.length],
		])
	})

	it('should not move the input cursor and yield independent cursors', function () {
		const cursor = createIsoBoxReadCursor(reduceUint8Arrays([MFHD, MDAT]))
		const cursors: IsoBoxReadCursor[] = []

		for (const [, child] of iterateChildBoxes(cursor)) {
			cursors.push(child)
			child.pos = child.end
		}

		assert.strictEqual(cursor.pos, 0)
		assert.strictEqual(cursors.length, 2)
		assert.notStrictEqual(cursors[0], cursors[1])
		assert.strictEqual(cursors[0]?.pos, MFHD.length)
	})

	it('should stop before a truncated box', function () {
		const cursor = createIsoBoxReadCursor(reduceUint8Arrays([MFHD, MDAT.subarray(0, 9)]))
		const types = [...iterateChildBoxes(cursor)].map(([type]) => type)

		assert.deepStrictEqual(types, ['mfhd'])
	})

	it('should start at the position of the cursor', function () {
		const cursor = createIsoBoxReadCursor(reduceUint8Arrays([MFHD, MDAT]))

		nextIsoBox(cursor)

		const types = [...iterateChildBoxes(cursor)].map(([type]) => type)

		assert.deepStrictEqual(types, ['mdat'])
	})

	it('should set pos to the first byte of usertype for a uuid box', function () {
		const uuid = boxBytes('uuid', USERTYPE, new Uint8Array([9]))
		const [entry] = [...iterateChildBoxes(createIsoBoxReadCursor(uuid))]

		assert.ok(entry)
		assert.strictEqual(entry[0], 'uuid')
		assert.strictEqual(entry[1].pos, 8)
		assert.strictEqual(entry[1].end, uuid.length)
	})

	it('should keep the readers and the int64 option of the cursor', function () {
		const readers = { tfdt: readTfdt }
		const cursor = createIsoBoxReadCursor(load('mss_moof_tfdt.mp4'), {
			readers,
			int64: readInt64AsBigInt,
		})
		let times = 0

		for (const [type, moof] of iterateChildBoxes(cursor)) {
			if (type !== 'moof') {
				continue
			}

			assert.strictEqual(moof.readers, readers)
			assert.strictEqual(moof.int64, readInt64AsBigInt)

			const traf = seekIsoBox(moof, ['traf'])

			assert.ok(traf)

			for (const [childType, child] of iterateChildBoxes(traf)) {
				if (childType === 'tfdt') {
					const time = readTfdt(child).baseMediaDecodeTime

					expectType<Equal<typeof time, bigint>>(true)
					assert.strictEqual(typeof time, 'bigint')
					times++
				}
			}

			// The readers map of the cursor reads the tfdt box.
			const tfdt = readChildBoxes(traf).find(box => isIsoBoxType('tfdt', box))

			assert.ok(tfdt)
		}

		assert.strictEqual(times, 1)
	})

	it('should set pos after the largesize field of a box with a size of 1', function () {
		const large = new Uint8Array(20)
		const view = new DataView(large.buffer)

		view.setUint32(0, 1)
		large.set([0x6d, 0x64, 0x61, 0x74], 4)
		view.setUint32(12, 20)

		const [entry] = [...iterateChildBoxes(createIsoBoxReadCursor(reduceUint8Arrays([large, MFHD])))]

		assert.ok(entry)
		assert.strictEqual(entry[0], 'mdat')
		assert.strictEqual(entry[1].start, 0)
		assert.strictEqual(entry[1].pos, 16)
		assert.strictEqual(entry[1].end, 20)
	})

	it('should read the position of the cursor at the call', function () {
		const cursor = createIsoBoxReadCursor(reduceUint8Arrays([MFHD, MDAT]))
		const iterator = iterateChildBoxes(cursor)

		// A move of the input cursor after the call does not change the iteration.
		readChildBoxes(cursor)

		assert.deepStrictEqual(
			[...iterator].map(([type]) => type),
			['mfhd', 'mdat'],
		)
	})

	it('should keep the depth limit of readChildBoxes for the cursors of a reader', function () {
		// 300 moov boxes, each inside the one before.
		let bytes = boxBytes('free')

		for (let i = 0; i < 300; i++) {
			bytes = boxBytes('moov', bytes)
		}

		const readers = {
			moov: (cursor: IsoBoxReadCursor): MovieBox => {
				const boxes: ParsedIsoBox[] = []

				for (const [, child] of iterateChildBoxes(cursor)) {
					boxes.push(...readChildBoxes({ ...child, pos: child.start }))
				}

				return { type: 'moov', boxes }
			},
		}

		assert.throws(() => readIsoBoxes(bytes, { readers }), {
			name: 'RangeError',
			message: 'The box moov is deeper than the limit of 128 levels',
		})
	})
})
