import { assert, describe, elng, findBox, it } from './util/box';

describe('elng box', function () {
	it('should correctly parse the box from sample data', function () {
		const box = findBox('SRMP_AC4.mp4', elng);

		assert.strictEqual(box.type, 'elng');
		assert.strictEqual(box.value.extendedLanguage.localeCompare('en'), 0);
	});
});
