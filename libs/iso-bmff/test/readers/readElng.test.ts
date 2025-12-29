import { assert, describe, findBox, it, readElng, readMeta, readPrsl } from '../util/box.ts'

describe('readElng', function () {
	it('should correctly parse the box from sample data', function () {
		const box = findBox('SRMP_AC4.mp4', 'elng', { elng: readElng, meta: readMeta, prsl: readPrsl })

		assert.strictEqual(box.type, 'elng')
		assert.strictEqual(box.extendedLanguage.localeCompare('en'), 0)
	})
})
