import { hdlr } from '@svta/common-media-library';
import { assert, describe, findBox, it } from './util/box';

describe('hdlr box', function () {
	it('should correctly parse the box', function () {
		const box = findBox('captions.mp4', hdlr);

		assert.strictEqual(box.type, 'hdlr');
		assert.strictEqual(box.size, 68);

		assert.strictEqual(box.preDefined, 0);
		assert.strictEqual(box.handlerType, 'subt');
		assert.deepStrictEqual(box.reserved, [0, 0, 0]);
		assert.strictEqual(box.name, '*xml:ext=ttml@GPAC0.5.1-DEV-rev5545');
	});

	it('should handle null-terminated strings that are not null-terminated and might exceed box boundaries', function () {
		const box = findBox('240fps_go_pro_hero_4.mp4', hdlr);

		assert.ok(box);
		assert.strictEqual(box.name, '\tGoPro AVC');
	});
});
