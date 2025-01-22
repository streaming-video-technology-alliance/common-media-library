import { assert, describe, findBox, it, labl, meta, prsl, type Box } from './util/box';

describe('labl box', function () {
	it('should correctly parse the box from sample data', function () {
		const box = findBox('SRMP_AC4.mp4', [meta, prsl, labl])
			.boxes?.filter((box: Box) => box.type === 'grpl')[0]
			.boxes?.filter((box: Box) => box.groupId === 234)[0];

		assert.ok(box);
		assert.ok(box.boxes);

		const boxes = box.boxes.filter((box: Box) => box.type === 'labl');

		assert.strictEqual(boxes[0].type, 'labl');
		assert.strictEqual(boxes[0].isGroupLabel, false);
		assert.strictEqual(boxes[0].language, 'en');
		assert.strictEqual(boxes[0].label, 'Spanish');
		assert.strictEqual(boxes[1].type, 'labl');
		assert.strictEqual(boxes[1].isGroupLabel, false);
		assert.strictEqual(boxes[1].language, 'es');
		assert.strictEqual(boxes[1].label, 'Español');
	});
});
