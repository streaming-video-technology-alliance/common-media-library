import { assert, describe, findBox, it, mdat, parseBoxes } from './util/box';

describe('vttc box', function () {
	it('should correctly parse the box from sample data', function () {
		const { data } = findBox('webvtt.m4s', mdat);
		const boxes = parseBoxes(data);
		assert.strictEqual(boxes[0].type, 'vttc');
	});
});
