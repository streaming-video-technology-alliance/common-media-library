import { assert, describe, it, readCtts, readIsoBoxes, writeCtts } from '../util/box.ts'
import { boxBytes } from '../util/wideBoxes.ts'
import { cttsBox } from '../util/versionBoxes.ts'

describe('writeCtts', function () {
	for (const version of [0, 1]) {
		it(`should write the source bytes after a read of a version ${version} box`, function () {
			const source = cttsBox(version)
			const [box] = readIsoBoxes(source, { readers: { ctts: readCtts } })

			assert.strictEqual(box.type, 'ctts')
			assert.deepStrictEqual(new Uint8Array(writeCtts(box).buffer), source)
		})
	}

	it('should write only entry_count after a read of a version 2 box', function () {
		const [box] = readIsoBoxes(cttsBox(2), { readers: { ctts: readCtts } })

		assert.strictEqual(box.type, 'ctts')
		assert.deepStrictEqual(
			new Uint8Array(writeCtts(box).buffer),
			boxBytes('ctts', [2, 1], [0, 3], [1, 4]),
		)
	})

	it('should write no entries for a version 2 box', function () {
		const writer = writeCtts({
			type: 'ctts',
			version: 2,
			flags: 0,
			entryCount: 1,
			entries: [{ sampleCount: 1, sampleOffset: -2 }],
		})

		assert.deepStrictEqual(new Uint8Array(writer.buffer), boxBytes('ctts', [2, 1], [0, 3], [1, 4]))
	})
})
