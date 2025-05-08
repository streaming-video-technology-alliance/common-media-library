import { getLicenseRequestFromMessage } from '@svta/common-media-library/drm/playready/getLicenseRequestFromMessage.js';
import { base64decode } from '@svta/common-media-library/utils/base64decode';
import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'node:test';
import { ENCODING_UTF16 } from '../../../dist/text/ENCODING_UTF16.ts';
import { PLAYREADY_KEY_MESSAGE } from './data/PLAYREADY_KEY_MESSAGE.ts';
import { stringToUtf16Buffer } from './utils/stringToUtf16Buffer.ts';

describe('getLicenseRequestFromMessage', () => {
	it('returns the original message if byte length is odd and encoding is UTF-16', () => {
		const message = stringToUtf16Buffer('jAm0n');
		const result = getLicenseRequestFromMessage(message, ENCODING_UTF16);
		strictEqual(result, message);
	});

	it('finds the Challenge in the PlayReadyKeyMessage and returns the value as ArrayBuffer', () => {
		const message = stringToUtf16Buffer(PLAYREADY_KEY_MESSAGE);
		//#region example
		const result = getLicenseRequestFromMessage(message);
		deepStrictEqual(result, base64decode('1beR1c0').buffer as ArrayBuffer);
		//#endregion example
	});
});
