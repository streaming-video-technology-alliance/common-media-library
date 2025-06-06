import { assert, describe, findBox, iden, it, mdat, parseBoxes } from './util/box.ts';

describe('iden box', function () {
	it('should correctly parse the box from sample data', function () {
		const { data } = findBox('vttc.mp4', mdat);
		const boxes = parseBoxes(data, { parsers: { iden } });
		assert.strictEqual(boxes[0].boxes[0].cueId, '70');
	});
});
