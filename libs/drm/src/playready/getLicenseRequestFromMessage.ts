import type { Encoding } from '@svta/cml-utils'
import { decodeBase64, decodeText, UTF_16 } from '@svta/cml-utils'
import { getElementsByName, parseXml } from '@svta/cml-xml'
import { CHALLENGE } from '../common/CHALLENGE.ts'
import { PLAYREADY_KEY_MESSAGE } from '../common/PLAYREADY_KEY_MESSAGE.ts'

/**
 * Gets the PlayReady license request from the MediaKeyMessageEvent.
 *
 * @param message - An ArrayBuffer from the content decryption module.
 * @param encoding - The message encoding type. Default is UTF-16.
 * @returns The license request as an ArrayBuffer.
 *
 * @public
 *
 * @example
 * {@includeCode ../../test/playready/getLicenseRequestFromMessage.test.ts#example}
 */
export function getLicenseRequestFromMessage(
	message: ArrayBuffer,
	encoding: Encoding = UTF_16,
): ArrayBuffer {

	// If encoding is configured for UTF-16 and the number of bytes is odd,
	// assume an 'unwrapped' raw CDM message.
	if (encoding === UTF_16 && message?.byteLength % 2 === 1) {
		return message
	}

	const msg = decodeText(message, { encoding })
	const xml = parseXml(msg)
	const playReadyKeyMessage = getElementsByName(xml, PLAYREADY_KEY_MESSAGE)[0]

	if (!playReadyKeyMessage) {
		// The message from the CDM is not wrapped and contains the direct challenge.
		return message
	}

	const challengeNode = getElementsByName(playReadyKeyMessage, CHALLENGE)[0]
	const challengeValue = challengeNode?.childNodes[0]?.nodeValue

	if (challengeValue) {
		return decodeBase64(challengeValue).buffer as ArrayBuffer
	}

	return message
}
