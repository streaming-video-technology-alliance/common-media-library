import { assert, describe, it, readIsoBoxes, readSidx } from '../util/box.ts'
import { sidxBox } from '../util/versionBoxes.ts'

describe('readSidx', function () {
	for (const version of [0, 1, 2]) {
		it(`should read the fields of a version ${version} box`, function () {
			const [box] = readIsoBoxes(sidxBox(version), { readers: { sidx: readSidx } })

			assert.strictEqual(box.type, 'sidx')
			assert.strictEqual(box.version, version)
			assert.strictEqual(box.referenceId, 1)
			assert.strictEqual(box.timescale, 2)
			assert.strictEqual(box.earliestPresentationTime, 3)
			assert.strictEqual(box.firstOffset, 4)
			assert.strictEqual(box.references.length, 1)
			assert.strictEqual(box.references[0].referencedSize, 100)
			assert.strictEqual(box.references[0].subsegmentDuration, 5)
			assert.strictEqual(box.references[0].startsWithSap, 1)
			assert.strictEqual(box.references[0].sapType, 1)
		})
	}
})
