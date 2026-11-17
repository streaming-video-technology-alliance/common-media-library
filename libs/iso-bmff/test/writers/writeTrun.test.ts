import { assert, describe, it, readIsoBoxes, readTrun, writeTrun } from '../util/box.ts'
import { trunBox } from '../util/versionBoxes.ts'
import { boxBytes } from '../util/wideBoxes.ts'

describe('writeTrun', function () {
	for (const version of [0, 1, 2]) {
		it(`should write the source bytes after a read of a version ${version} box`, function () {
			const source = trunBox(version)
			const [box] = readIsoBoxes(source, { readers: { trun: readTrun } })

			assert.strictEqual(box.type, 'trun')
			assert.deepStrictEqual(new Uint8Array(writeTrun(box).buffer), source)
		})
	}

	it('should write a negative data offset and composition time offset as signed fields', function () {
		const writer = writeTrun({
			type: 'trun',
			version: 1,
			flags: 0x801,
			sampleCount: 1,
			dataOffset: -8,
			samples: [{ sampleCompositionTimeOffset: -1 }],
		})
		const bytes = new Uint8Array(writer.buffer)
		const [box] = readIsoBoxes(bytes, { readers: { trun: readTrun } })

		assert.deepStrictEqual(
			bytes,
			boxBytes('trun', [1, 1], [0x801, 3], [1, 4], [0xfffffff8, 4], [0xffffffff, 4]),
		)
		assert.strictEqual(box.type, 'trun')
		assert.strictEqual(box.dataOffset, -8)
		assert.strictEqual(box.samples[0].sampleCompositionTimeOffset, -1)
	})

	it('should keep the bytes of a version 0 composition time offset above 2^31', function () {
		const writer = writeTrun({
			type: 'trun',
			version: 0,
			flags: 0x800,
			sampleCount: 1,
			samples: [{ sampleCompositionTimeOffset: 3_000_000_000 }],
		})

		assert.deepStrictEqual(
			new Uint8Array(writer.buffer),
			boxBytes('trun', [0, 1], [0x800, 3], [1, 4], [0xb2d05e00, 4]),
		)
	})
})
