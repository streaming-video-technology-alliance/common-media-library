import { assert, describe, findBox, it, kind, meta, prsl } from './util/box';

describe('kind box', function () {
	it('should correctly parse the box from sample data', function () {
		const box = findBox<any>('SRMP_AC4.mp4', [kind, meta, prsl]);

		assert.strictEqual(box.type, 'kind');
		assert.strictEqual(box.schemeUri, 'urn:mpeg:dash:role:2011');
		assert.strictEqual(box.value, 'main');
	});
});
