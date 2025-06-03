import { assert, describe, emsg, findBox, it, type EventMessageBox } from './util/box.ts';

describe('emsg box', function () {
	it('should correctly parse the box from sample data', function () {
		const box = findBox<EventMessageBox>('emsg.m4s', [emsg]);

		assert.strictEqual(box.type, 'emsg');
		assert.strictEqual(box.size, 74);
		assert.strictEqual(box.version, 0);
		assert.strictEqual(box.schemeIdUri, 'urn:mpeg:dash:event:2012');
		assert.strictEqual(box.value, '1');
		assert.strictEqual(box.eventDuration, 65535);
		assert.strictEqual(box.id, 1);
		assert.strictEqual(box.timescale, 1);
		assert.strictEqual(box.presentationTimeDelta, 1);
		assert.deepEqual(box.messageData, new Uint8Array([50, 48, 49, 52, 45, 48, 54, 45, 49, 49, 84, 49, 51, 58, 48, 54, 58, 50, 52]));
	});
});
