import { assert, describe, it, readIsoBoxes, readTrun, writeTrun } from '../util/box.ts'
import { trunBox } from '../util/versionBoxes.ts'

describe('writeTrun', function () {
	for (const version of [0, 1, 2]) {
		it(`should write the source bytes after a read of a version ${version} box`, function () {
			const source = trunBox(version)
			const [box] = readIsoBoxes(source, { readers: { trun: readTrun } })

			assert.strictEqual(box.type, 'trun')
			assert.deepStrictEqual(new Uint8Array(writeTrun(box).buffer), source)
		})
	}
})
