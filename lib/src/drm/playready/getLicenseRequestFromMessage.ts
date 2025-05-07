import { base64decode } from '../../utils/base64decode.ts';
import { parseXml, getElementsByName as getElementsByName } from '../../xml.ts';
import { CHALLENGE } from '../common/CHALLENGE.ts';
import type { ENCODING_UTF8 } from '../common/ENCODING_UTF8.ts';
import { ENCODING_UTF16 } from '../common/ENCODING_UTF16.ts';
import { PLAYREADY_KEY_MESSAGE } from '../common/PLAYREADY_KEY_MESSAGE.ts';

/**
 * Gets the PlayReady license request from the MediaKeyMessageEvent.
 *
 * @param message - An ArrayBuffer from the content decryption module.
 * @param encoding - The message encoding type. Default is UTF-16.
 * @returns The license request as an ArrayBuffer.
 *
 * @group DRM
 * @beta
 *
 */
export function getLicenseRequestFromMessage(
	message: ArrayBuffer,
	encoding: typeof ENCODING_UTF8 | typeof ENCODING_UTF16 = ENCODING_UTF16,
): ArrayBuffer | null {

	// If encoding is configured for UTF-16 and the number of bytes is odd,
	// assume an 'unwrapped' raw CDM message.
	if (encoding === ENCODING_UTF16 && message?.byteLength % 2 === 1) {
		return message;
	}

	const msg = (() => {
		if (typeof TextDecoder !== 'undefined') {
			return new TextDecoder(encoding).decode(message);
		}
		const buffer = encoding === ENCODING_UTF16 ? new Uint16Array(message) : new Uint8Array(message);
		return String.fromCharCode(...buffer);
	})();

	const xml = parseXml(msg);
	const playReadyKeyMessage = getElementsByName(xml, PLAYREADY_KEY_MESSAGE)[0];

	if (!playReadyKeyMessage) {
		// The message from the CDM is not wrapped and contains the direct challenge.
		return message;
	}

	const challengeNode = getElementsByName(playReadyKeyMessage, CHALLENGE)[0];
	const challengeValue = challengeNode?.childNodes[0]?.nodeValue;

	if (challengeValue) {
		return base64decode(challengeValue).buffer as ArrayBuffer;
	}

	return message;
}
