import { getRequestHeadersFromMessage } from '@svta/common-media-library/drm';
import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { PLAYREADY_HEADERS } from './data/PLAYREADY_HEADERS.ts';
import { PLAYREADY_KEY_MESSAGE } from './data/PLAYREADY_KEY_MESSAGE.ts';
import { stringToUtf16Buffer } from './utils/stringToUtf16Buffer.ts';

describe('getRequestHeadersFromMessage', () => {
	it('returns request headers from the PlayReadyKeyMessage', () => {
		const message = stringToUtf16Buffer(PLAYREADY_KEY_MESSAGE);
		//#region example
		const result = getRequestHeadersFromMessage(message);
		deepStrictEqual(result, PLAYREADY_HEADERS);
		//#endregion example
	});
});
