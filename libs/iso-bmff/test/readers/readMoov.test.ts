import { assert, describe, isContainer, it, parseFile, readMoov } from '../util/box.ts'

describe('readMoov', function () {
	it('should correctly parse the box', function () {
		const box = parseFile('captions.mp4', { readers: { moov: readMoov } }).at(-3)

		assert.ok(box)
		assert.strictEqual(box.type, 'moov')
		assert.strictEqual(box.size, 1028)
		assert(isContainer(box))
		assert.strictEqual(box.boxes.length, 2)
	})
})
