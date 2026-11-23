import { readFile } from 'node:fs/promises'
import { expectType, type Equal } from './util/expectType.ts'
import { load } from './util/load.ts'
import { rawBytes } from './util/rawBytes.ts'
import { reduceUint8Arrays } from './util/reduceUint8Arrays.ts'
import { boxBytes } from './util/wideBoxes.ts'
import {
	assert,
	createIsoBoxReadCursor,
	describe,
	filterBoxes,
	it,
	readInt64AsBigInt,
	readTfdt,
	readUint8,
	seekIsoBox,
	type IsoBoxReadCursor,
} from './util/box.ts'

const TFDT_PATH = ['moof', 'traf', 'tfdt']
const STSD_PATH = ['moov', 'trak', 'mdia', 'minf', 'stbl', 'stsd']

function tfdtTime(): number {
	const [tfdt] = filterBoxes('mss_moof_tfdt.mp4', 'tfdt', { readers: { tfdt: readTfdt } })

	return tfdt?.baseMediaDecodeTime ?? -1
}

describe('seekIsoBox', function () {
	it('should return a cursor for the first box at the path', async function () {
		// #region example
		const segment = await readFile(new URL('./fixtures/mss_moof_tfdt.mp4', import.meta.url))

		const cursor = seekIsoBox(segment, ['moof', 'traf', 'tfdt'])
		const time = cursor ? readTfdt(cursor).baseMediaDecodeTime : null
		// #endregion example

		assert.strictEqual(time, tfdtTime())
	})

	it('should cover the bytes of the box from start to end', function () {
		const data = load('mss_moof_tfdt.mp4')
		const [original] = rawBytes('mss_moof_tfdt.mp4', 'tfdt')
		const cursor = seekIsoBox(data, TFDT_PATH)

		assert.ok(cursor && original)
		assert.strictEqual(cursor.pos, cursor.start + 8)
		assert.deepStrictEqual(
			new Uint8Array(
				cursor.view.buffer,
				cursor.view.byteOffset + cursor.start,
				cursor.end - cursor.start,
			),
			original,
		)
	})

	it('should read 64-bit fields with the int64 option', function () {
		const cursor = seekIsoBox(load('mss_moof_tfdt.mp4'), TFDT_PATH, { int64: readInt64AsBigInt })

		assert.ok(cursor)

		const time = readTfdt(cursor).baseMediaDecodeTime

		expectType<Equal<typeof time, bigint>>(true)
		assert.strictEqual(time, BigInt(tfdtTime()))
	})

	it('should return null for a missing box', function () {
		const data = load('mss_moof_tfdt.mp4')

		assert.strictEqual(seekIsoBox(data, ['moof', 'traf', 'sidx']), null)
		assert.strictEqual(seekIsoBox(data, ['moov']), null)
	})

	it('should return null for a truncated box', function () {
		const data = new Uint8Array(load('mss_moof_tfdt.mp4'))
		const tfdt = seekIsoBox(data, TFDT_PATH)

		assert.ok(tfdt)
		assert.strictEqual(seekIsoBox(data.subarray(0, tfdt.start + 10), TFDT_PATH), null)
	})

	it('should count the positions from the first byte of a subarray input', function () {
		const data = new Uint8Array(load('mss_moof_tfdt.mp4'))
		const input = reduceUint8Arrays([new Uint8Array(5), data]).subarray(5)
		const expected = seekIsoBox(data, TFDT_PATH)
		const cursor = seekIsoBox(input, TFDT_PATH)

		assert.ok(cursor && expected)
		assert.strictEqual(cursor.start, expected.start)
		assert.strictEqual(cursor.pos, expected.pos)
		assert.strictEqual(cursor.end, expected.end)
		assert.strictEqual(readTfdt(cursor).baseMediaDecodeTime, tfdtTime())
	})

	it('should search from the position of a cursor and not move that cursor', function () {
		// #region cursor
		const stsd = seekIsoBox(load('test_frag.mp4'), ['moov', 'trak', 'mdia', 'minf', 'stbl', 'stsd'])

		if (stsd) {
			stsd.pos += 8 // version, flags, and entry_count
		}

		const avc1 = stsd && seekIsoBox(stsd, ['avc1'])
		// #endregion cursor

		assert.ok(stsd && avc1)
		assert.strictEqual(stsd.pos, stsd.start + 16)
		assert.strictEqual(avc1.end - avc1.start, 136)
		assert.strictEqual(avc1.start, stsd.pos)
		assert.notStrictEqual(avc1, stsd)
	})

	it('should keep the int64 option of a cursor input', function () {
		const cursor = createIsoBoxReadCursor(load('mss_moof_tfdt.mp4'), { int64: readInt64AsBigInt })
		const tfdt = seekIsoBox(cursor, TFDT_PATH)

		assert.ok(tfdt)
		expectType<Equal<typeof tfdt, IsoBoxReadCursor<bigint>>>(true)
		assert.strictEqual(readTfdt(tfdt).baseMediaDecodeTime, BigInt(tfdtTime()))
		assert.strictEqual(cursor.pos, 0)
	})

	it('should return a cursor at the first byte of usertype for a uuid box', function () {
		const usertype = new Uint8Array(16).fill(7)
		const cursor = seekIsoBox(boxBytes('uuid', usertype, new Uint8Array([0xcc])), ['uuid'])

		assert.ok(cursor)
		assert.strictEqual(cursor.pos, 8)
		assert.strictEqual(readUint8(cursor), 7)
	})

	it('should return a cursor after the header of a box with a largesize', function () {
		const large = new Uint8Array(17)
		const view = new DataView(large.buffer)

		view.setUint32(0, 1)
		view.setUint32(4, 0x6d646174) // mdat
		view.setUint32(12, 17)
		large[16] = 0xaa

		const cursor = seekIsoBox(reduceUint8Arrays([boxBytes('free'), large]), ['mdat'])

		assert.ok(cursor)
		assert.strictEqual(cursor.start, 8)
		assert.strictEqual(cursor.pos, 24)
		assert.strictEqual(readUint8(cursor), 0xaa)
	})

	it('should return a cursor at the position of the input for an empty path', function () {
		const cursor = seekIsoBox(boxBytes('free'), [])

		assert.ok(cursor)
		assert.strictEqual(cursor.start, 0)
		assert.strictEqual(cursor.pos, 0)
		assert.strictEqual(cursor.end, 8)
	})

	it('should throw a RangeError for a type that does not have 4 characters', function () {
		assert.throws(() => seekIsoBox(boxBytes('free'), ['fre']), /"fre"/)
		assert.throws(() => seekIsoBox(boxBytes('free'), ['freee']), RangeError)
	})

	it('should throw a RangeError for a bad type after a missing box', function () {
		assert.throws(() => seekIsoBox(boxBytes('free'), ['moov', 'x']), /"x"/)
	})

	it('should search only inside the parent box', function () {
		assert.strictEqual(seekIsoBox(load('mss_moof_tfdt.mp4'), ['moof', 'mdat']), null)
	})

	it('should return null for a child that passes the end of its parent', function () {
		const child = new Uint8Array([0, 0, 0, 16, 0x62, 0x62, 0x62, 0x62])
		const data = reduceUint8Arrays([boxBytes('aaaa', child), boxBytes('free', new Uint8Array(8))])

		assert.strictEqual(seekIsoBox(data, ['aaaa', 'bbbb']), null)
	})

	it('should find a box past the boxes of other types', function () {
		const data = load('test_frag.mp4')

		assert.ok(seekIsoBox(data, STSD_PATH))
	})
})
