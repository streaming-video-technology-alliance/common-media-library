import { assert, describe, elng, findBox, it, meta, prsl } from './util/box.ts';

describe('elng box', function () {
	it('should correctly parse the box from sample data', function () {
		const box = findBox<any>('SRMP_AC4.mp4', [elng, meta, prsl]);

		assert.strictEqual(box.type, 'elng');
		assert.strictEqual(box.extendedLanguage.localeCompare('en'), 0);
	});
});
