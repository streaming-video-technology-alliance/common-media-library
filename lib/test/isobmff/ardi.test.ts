import { ardi, assert, describe, findBox, it, meta, prsl } from './util/box';
describe('ardi box', function () {
	it('should correctly parse the box from sample data', function () {
		const box = findBox<any>('SRMP_AC4.mp4', [prsl, meta, ardi]).value.find((box: any) => box.type === 'ardi');
		assert.ok(box);
		assert.strictEqual(box.type, 'ardi');
		assert.strictEqual(box.value.audioRenderingIndication <= 4, true);
	});
});
