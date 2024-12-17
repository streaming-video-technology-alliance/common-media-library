// import { assert, describe, it } from './util/box';

// describe('labl box', function () {
// 	it('should correctly parse the box from sample data', function () {
// 		const parsedFile = loadParsedFixture('./test/fixtures/SRMP_AC4.mp4');
// 		const box = parsedFile.fetchAll('prsl').filter((b) => b.group_id === 234)[0];
// 		assert.ok(box);
// 		assert.ok(box.boxes);

// 		const boxes = box.boxes.filter((b) => b.type === 'labl');
// 		assert.strictEqual(boxes[0].type, 'labl');
// 		assert.strictEqual(boxes[0].is_group_label, false);
// 		assert.strictEqual(boxes[0].language.localeCompare('en')).toBe(0);
// 		assert.strictEqual(boxes[0].label, 'Spanish');
// 		assert.strictEqual(boxes[1].type, 'labl');
// 		assert.strictEqual(boxes[1].is_group_label, false);
// 		assert.strictEqual(boxes[1].language.localeCompare('es')).toBe(0);
// 		assert.strictEqual(boxes[1].label, 'Español');
// 	});
// });
