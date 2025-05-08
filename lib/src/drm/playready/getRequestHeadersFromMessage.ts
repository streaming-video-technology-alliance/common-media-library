import { CONTENT_TYPE } from '../common/CONTENT_TYPE.ts';
import type { ENCODING_UTF8 } from '../common/ENCODING_UTF8.ts';
import { ENCODING_UTF16 } from '../common/ENCODING_UTF16.ts';
import { HTTP_HEADERS } from '../common/HTTP_HEADERS.ts';
import { TEXT_XML_UTF8 } from '../common/TEXT_XML_UTF8.ts';
import { getElementsByName } from '../../xml/getElementsByName.ts';
import { parseXml } from '../../xml/parseXml.ts';

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
 */
export function getRequestHeadersFromMessage(
	message: ArrayBuffer,
	encoding: typeof ENCODING_UTF8 | typeof ENCODING_UTF16 = ENCODING_UTF16,
): Record<string, string> {
	const headers: Record<string, string> = {};

	// If message format configured/defaulted to utf-16 AND number of bytes is odd,
	// assume 'unwrapped' raw CDM message.
	if (encoding === ENCODING_UTF16 && message && message.byteLength % 2 === 1) {
		headers[CONTENT_TYPE] = TEXT_XML_UTF8;
		return headers;
	}
	const msg = (() => {
		if (typeof TextDecoder !== 'undefined') {
			return new TextDecoder(encoding).decode(message);
		}
		const buffer = encoding === ENCODING_UTF16 ? new Uint16Array(message) : new Uint8Array(message);
		return String.fromCharCode(...buffer);
	})();

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
