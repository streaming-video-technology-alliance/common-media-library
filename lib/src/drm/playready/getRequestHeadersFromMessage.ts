import { UTF_16 } from '../../utils/UTF_16.js';
import type { UTF_8 } from '../../utils/UTF_8.js';
import { decodeText } from '../../utils/decodeText.js';
import { getElementsByName } from '../../xml/getElementsByName.js';
import { parseXml } from '../../xml/parseXml.js';
import { CONTENT_TYPE } from '../common/CONTENT_TYPE.js';
import { HTTP_HEADERS } from '../common/HTTP_HEADERS.js';
import { TEXT_XML_UTF8 } from '../common/TEXT_XML_UTF8.js';

/**
 * Gets the PlayReady license request headers from the MediaKeyMessageEvent.
 *
 * @param message - An ArrayBuffer from the content decryption module.
 * @param encoding - The message encoding type. Default is UTF-16.
 * @returns Request headers.
 *
 * @group DRM
 * @beta
 *
 * @example
 * {@includeCode ../../../test/drm/playready/getRequestHeadersFromMessage.test.ts#example}
 */
export function getRequestHeadersFromMessage(
	message: ArrayBuffer,
	encoding: typeof UTF_8 | typeof UTF_16 = UTF_16,
): Record<string, string> {
	const headers: Record<string, string> = {};

	// If message format configured/defaulted to utf-16 AND number of bytes is odd,
	// assume 'unwrapped' raw CDM message.
	if (encoding === UTF_16 && message && message.byteLength % 2 === 1) {
		headers[CONTENT_TYPE] = TEXT_XML_UTF8;
		return headers;
	}

	const msg = decodeText(message, { encoding });
	const xml = parseXml(msg);
	const httpHeaders = getElementsByName(xml, HTTP_HEADERS)[0].childNodes;

	for (const header of httpHeaders) {
		const name = getElementsByName(header, 'name')[0]?.childNodes[0]?.nodeValue;
		const value = getElementsByName(header, 'value')[0]?.childNodes[0]?.nodeValue;

		if (name && value) {
			headers[name] = value;
		}
	}
	// Some versions of the PlayReady CDM return 'Content' instead of 'Content-Type'.
	// This does not adhere to the W3C spec and license servers may reject the request.
	if (headers.hasOwnProperty('Content')) {
		headers[CONTENT_TYPE] = headers['Content'];
		delete headers['Content'];
	}
	// Set 'Content-Type' header by default if not provided in the the CDM message
	// or if the message is unwrapped.
	if (!headers.hasOwnProperty(CONTENT_TYPE)) {
		headers[CONTENT_TYPE] = TEXT_XML_UTF8;
	}

	return headers;
}
