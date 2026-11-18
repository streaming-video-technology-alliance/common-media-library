import { assert, describe, findBox, it, readFtyp, type TypeBox } from '../util/box.ts'

describe('readFtyp', function () {
	it('should correctly parse the box', function () {
		const box = findBox('captions.mp4', 'ftyp', { readers: { ftyp: readFtyp } })

		assert.strictEqual(box.type, 'ftyp')
		assert.strictEqual(box.size, 20)
		assert.strictEqual(box.majorBrand, 'isom')
		assert.strictEqual(box.minorVersion, 1)
		assert.deepStrictEqual(box.compatibleBrands, ['isom'])
	})

	it('should accept only ftyp and styp as the type of TypeBox', function () {
		const types: TypeBox<'ftyp' | 'styp'>['type'][] = ['ftyp', 'styp']
		// @ts-expect-error TypeBox accepts only 'ftyp' and 'styp'
		const moov: TypeBox<'moov'>['type'] = 'moov'

		assert.deepStrictEqual([...types, moov], ['ftyp', 'styp', 'moov'])
	})
})
