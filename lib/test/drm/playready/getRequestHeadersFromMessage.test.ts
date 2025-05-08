
import { getRequestHeadersFromMessage } from '@svta/common-media-library/drm/playready/getRequestHeadersFromMessage';
import { createUTF16Buffer } from './utils/createUTF16Buffer.ts';
import { PLAYREADY_HEADERS } from './data/PLAYREADY_HEADERS.ts';
import { PLAYREADY_KEY_MESSAGE } from './data/PLAYREADY_KEY_MESSAGE.ts';
import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'node:test';

describe('getRequestHeadersFromMessage', () => {
	it('returns request headers from the PlayReadyKeyMessage', () => {
		const message = createUTF16Buffer(PLAYREADY_KEY_MESSAGE);
		const result = getRequestHeadersFromMessage(message);
		deepStrictEqual(result, PLAYREADY_HEADERS);
	});
});
