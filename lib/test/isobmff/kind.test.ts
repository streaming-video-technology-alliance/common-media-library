import { assert, describe, findBox, it, kind } from './util/box';

describe('kind box', function () {
	it('should correctly parse the box from sample data', function () {
		const box = findBox('SRMP_AC4.mp4', kind);

		assert.strictEqual(box.type, 'kind');
		assert.strictEqual(box.value.schemeUri, 'urn:mpeg:dash:role:2011');
		assert.strictEqual(box.value.value, 'main');
	});
});
