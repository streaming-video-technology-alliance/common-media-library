import { ardi, assert, describe, findBox, it, meta, prsl } from './util/box.ts';
describe('ardi box', function () {
	it('should correctly parse the box from sample data', function () {
		const box = findBox<any>('SRMP_AC4.mp4', [ardi, prsl, meta]);
		assert.ok(box);
		assert.strictEqual(box.type, 'ardi');
		assert.strictEqual(box.audioRenderingIndication <= 4, true);
	});
});
