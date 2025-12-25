import { assert, describe, readElng, findBox, it, readMeta, readPrsl } from '../util/box.ts'

describe('readElng', function () {
	it('should correctly parse the box from sample data', function () {
		const box = findBox<any>('SRMP_AC4.mp4', [readElng, readMeta, readPrsl])

		assert.strictEqual(box.type, 'elng')
		assert.strictEqual(box.extendedLanguage.localeCompare('en'), 0)
	})
})
