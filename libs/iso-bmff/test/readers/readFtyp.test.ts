import { assert, describe, findBox, it, readFtyp } from '../util/box.ts'

describe('readFtyp', function () {
	it('should correctly parse the box', function () {
		const box = findBox('captions.mp4', 'ftyp', { readers: { ftyp: readFtyp } })

		assert.strictEqual(box.type, 'ftyp')
		assert.strictEqual(box.size, 20)
		assert.strictEqual(box.majorBrand, 'isom')
		assert.strictEqual(box.minorVersion, 1)
		assert.deepStrictEqual(box.compatibleBrands, ['isom'])
	})
})
