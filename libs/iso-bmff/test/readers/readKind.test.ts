import { assert, describe, findBox, it, readKind, readMeta, readPrsl } from '../util/box.ts'

describe('readKind', function () {
	it('should correctly parse the box from sample data', function () {
		const box = findBox('SRMP_AC4.mp4', 'kind', { kind: readKind, meta: readMeta, prsl: readPrsl })

		assert.strictEqual(box.type, 'kind')
		assert.strictEqual(box.schemeUri, 'urn:mpeg:dash:role:2011')
		assert.strictEqual(box.value, 'main')
	})
})
