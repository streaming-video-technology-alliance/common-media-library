import type { Encoding } from '../../utils/Encoding.js';
import { UTF_16 } from '../../utils/UTF_16.js';
import { arrayBufferToString } from '../../utils/arrayBufferToString.js';
import { base64decode } from '../../utils/base64decode.js';
import { getElementsByName } from '../../xml/getElementsByName.js';
import { parseXml } from '../../xml/parseXml.js';
import { CHALLENGE } from '../common/CHALLENGE.js';
import { PLAYREADY_KEY_MESSAGE } from '../common/PLAYREADY_KEY_MESSAGE.js';

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
 * @example
 * {@includeCode ../../../test/drm/playready/getLicenseRequestFromMessage.test.ts#example}
 */
export function getLicenseRequestFromMessage(
	message: ArrayBuffer,
	encoding: Encoding = UTF_16,
): ArrayBuffer {

	// If encoding is configured for UTF-16 and the number of bytes is odd,
	// assume an 'unwrapped' raw CDM message.
	if (encoding === UTF_16 && message?.byteLength % 2 === 1) {
		return message;
	}

	const msg = arrayBufferToString(message, encoding);
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
