import { base64decode } from '@svta/common-media-library/utils/base64decode';
import { getLicenseRequestFromMessage } from '@svta/common-media-library/drm/playready/getLicenseRequestFromMessage';
import { createUTF16Buffer } from './utils/createUTF16Buffer.ts';
import { ENCODING_UTF16 } from '@svta/common-media-library/drm/common/ENCODING_UTF16';
import { PLAYREADY_KEY_MESSAGE } from './data/PLAYREADY_KEY_MESSAGE.ts';
import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'node:test';

describe('getLicenseRequestFromMessage', () => {
	it('returns the original message if byte length is odd and encoding is UTF-16', () => {
		const message = createUTF16Buffer('jAm0n');
		const result = getLicenseRequestFromMessage(message, ENCODING_UTF16);
		strictEqual(result, message);
	});

	it('finds the Challenge in the PlayReadyKeyMessage and returns the value as ArrayBuffer', () => {
		const message = createUTF16Buffer(PLAYREADY_KEY_MESSAGE);
		//#region example
		const result = getLicenseRequestFromMessage(message);
		deepStrictEqual(result, base64decode('1beR1c0').buffer as ArrayBuffer);
		//#endregion example
	});
});
