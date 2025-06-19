import { assert, describe, findBox, it, mdat, parseBoxes, sttg, type ContainerBox, type WebVttSettingsBox } from './util/box.ts';

describe('sttg box', function () {
	it('should correctly parse the box from sample data', function () {
		const { data } = findBox('vttc.mp4', mdat);
		const boxes = parseBoxes(data, { parsers: { sttg } }) as ContainerBox<WebVttSettingsBox>[];
		assert.strictEqual(boxes[1].boxes[1].settings, 'align:left line:89% position:25% size:65%');
	});
});
