import { base64decode } from '../../utils/base64decode';
import { parseXml, type XmlNode } from '../../xml';
import { CHALLENGE } from '../common/CHALLENGE';
import type { ENCODING_UTF8 } from '../common/ENCODING_UTF8';
import { ENCODING_UTF16 } from '../common/ENCODING_UTF16';
import { LICENSE_ACQUISITION } from '../common/LICENSE_ACQUISITION';
import { PLAYREADY_KEY_MESSAGE } from '../common/PLAYREADY_KEY_MESSAGE';

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

	// If message format configured/defaulted to utf-16 AND number of bytes is odd,
	// assume 'unwrapped' raw CDM message.
	if (encoding === ENCODING_UTF16 && message && message.byteLength % 2 === 1) {
		return message;
	}

	let licenseRequest: ArrayBuffer | null = null;
	const buffer = encoding === ENCODING_UTF16 ? new Uint16Array(message) : new Uint8Array(message);
	const msg = typeof TextDecoder !== 'undefined'
		? new TextDecoder(encoding).decode(message)
		: String.fromCharCode(...buffer);
	const xml = parseXml(msg);

	const playReadyKeyMessage = xml.childNodes.find(
		node => node.nodeName === PLAYREADY_KEY_MESSAGE,
	);

	if (playReadyKeyMessage) {
		let currentNode: XmlNode | undefined = playReadyKeyMessage;
		const targetNodes = [LICENSE_ACQUISITION, CHALLENGE];

		for (const targetNode of targetNodes) {
			currentNode = currentNode.childNodes.find(
				node => node.nodeName === targetNode,
			);
			if (!currentNode) {
				return null;
			}
		}

		const challenge = currentNode.childNodes[0]?.nodeValue;
		if (challenge) {
			const decoded = base64decode(challenge);
			licenseRequest = decoded.buffer as ArrayBuffer;
		}
	}
	else {
		// The message from the CDM is not a wrapped message as on IE11 and Edge,
		// thus the message contains the direct the challenge itself.
		return message;
	}

	return licenseRequest;
}
