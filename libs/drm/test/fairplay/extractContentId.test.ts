import { extractContentId } from '@svta/cml-drm';
import { UTF_8 } from '@svta/cml-utils';
import { strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

describe('extractContentId', () => {
	it('extracts contentId from UTF-16LE payload', () => {
		//#region example
		const initData = new Uint8Array([0x88, 0x00, 0x73, 0x00, 0x6b, 0x00, 0x64, 0x00, 0x3a, 0x00, 0x2f, 0x00, 0x2f, 0x00, 0x31, 0x00, 0x32, 0x00, 0x33, 0x00, 0x34, 0x00]);

		strictEqual(extractContentId(initData.buffer), '1234');
		//#endregion example
	});

	it('extracts contentId from UTF-8 payload', () => {
		const initData = new Uint8Array([0x88, 0x00, 0x73, 0x6b, 0x64, 0x3a, 0x2f, 0x2f, 0x31, 0x32, 0x33, 0x34]);

		strictEqual(extractContentId(initData.buffer, UTF_8), '1234');
	});
});
