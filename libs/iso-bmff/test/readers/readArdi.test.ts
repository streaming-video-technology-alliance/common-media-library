import { assert, describe, findBox, it, readArdi, readMeta, readPrsl } from '../util/box.ts'

describe('readArdi', function () {
	it('should correctly parse the box from sample data', function () {
		const box = findBox('SRMP_AC4.mp4', 'ardi', { ardi: readArdi, prsl: readPrsl, meta: readMeta })
		assert.ok(box)
		assert.strictEqual(box.type, 'ardi')
		assert.strictEqual(box.audioRenderingIndication <= 4, true)
	})
})
