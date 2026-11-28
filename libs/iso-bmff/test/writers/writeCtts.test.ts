import { writeWith } from '../util/writeWith.ts'
import {
	assert,
	isIsoBoxType,
	describe,
	it,
	readCtts,
	readIsoBoxes,
	writeCtts,
} from '../util/box.ts'
import { boxBytes } from '../util/wideBoxes.ts'
import { cttsBox } from '../util/versionBoxes.ts'

describe('writeCtts', function () {
	for (const version of [0, 1]) {
		it(`should write the source bytes after a read of a version ${version} box`, function () {
			const source = cttsBox(version)
			const [box] = readIsoBoxes(source, { readers: { ctts: readCtts } })

			assert.ok(isIsoBoxType('ctts', box))
			assert.deepStrictEqual(new Uint8Array(writeWith(writeCtts, box).buffer), source)
		})
	}

	it('should write only entry_count after a read of a version 2 box', function () {
		const [box] = readIsoBoxes(cttsBox(2), { readers: { ctts: readCtts } })

		assert.ok(isIsoBoxType('ctts', box))
		assert.deepStrictEqual(
			new Uint8Array(writeWith(writeCtts, box).buffer),
			boxBytes('ctts', [2, 1], [0, 3], [1, 4]),
		)
	})

	it('should write no entries for a version 2 box', function () {
		const writer = writeWith(writeCtts, {
			type: 'ctts',
			version: 2,
			flags: 0,
			entryCount: 1,
			entries: [{ sampleCount: 1, sampleOffset: -2 }],
		})

		assert.deepStrictEqual(new Uint8Array(writer.buffer), boxBytes('ctts', [2, 1], [0, 3], [1, 4]))
	})

	it('should throw a RangeError for a version 2 box with no entryCount', function () {
		assert.throws(
			() => writeWith(writeCtts, { type: 'ctts', version: 2, flags: 0, entries: [] }),
			/^RangeError: .*writeUint32.* received undefined$/,
		)
	})

	it('should throw a RangeError for a negative sample offset of a version 0 box', function () {
		assert.throws(
			() =>
				writeWith(writeCtts, {
					type: 'ctts',
					version: 0,
					flags: 0,
					entries: [{ sampleCount: 1, sampleOffset: -1 }],
				}),
			/^RangeError: .*writeUint32.* received -1$/,
		)
	})

	it('should write a negative sample offset of a version 1 box as a signed field', function () {
		const writer = writeWith(writeCtts, {
			type: 'ctts',
			version: 1,
			flags: 0,
			entries: [{ sampleCount: 1, sampleOffset: -1 }],
		})
		const bytes = new Uint8Array(writer.buffer)
		const [box] = readIsoBoxes(bytes, { readers: { ctts: readCtts } })

		assert.deepStrictEqual(bytes, boxBytes('ctts', [1, 1], [0, 3], [1, 4], [1, 4], [0xffffffff, 4]))
		assert.ok(isIsoBoxType('ctts', box))
		assert.strictEqual(box.entries[0].sampleOffset, -1)
	})

	it('should keep the bytes of a version 0 sample offset above 2^31', function () {
		const writer = writeWith(writeCtts, {
			type: 'ctts',
			version: 0,
			flags: 0,
			entries: [{ sampleCount: 1, sampleOffset: 3_000_000_000 }],
		})

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			boxBytes('ctts', [0, 1], [0, 3], [1, 4], [1, 4], [0xb2d05e00, 4]),
		)
	})
})
