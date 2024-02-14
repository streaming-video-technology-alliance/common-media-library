import { DecodedId3Frame } from '../DecodedId3Frame.js';
import { RawId3Frame } from './RawFrame.js';
import { toUint8 } from '../../../src/id3/util/utf8.js';
import { BufferSource } from 'stream/web';

interface MetadataFrame {
	key: string;
	description: string;
	data: string | ArrayBuffer;
	mimeType: string | null;
	pictureType: number | null;
}

export function decodeId3ImageFrame(
	frame: RawId3Frame
): DecodedId3Frame<string | ArrayBuffer> | undefined {
	const metadataFrame: MetadataFrame = {
		key: frame.type,
		description: '',
		data: '',
		mimeType: null,
		pictureType: null,
	};

	/**
	 * Format:
	 * [0]       = {Text Encoding}
	 * [1 - X]   = {MIME Type}\0
	 * [X+1]     = {Picture Type}
	 * [X+2 - Y] = {Description}\0
	 * [Y - ?]   = {Picture Data or Picture URL}
	 */

	const utf8Encoding = 0x03;

	if (frame.size < 2) {
		return undefined;
	}
	if (frame.data[0] !== utf8Encoding) {
		console.log('Ignore frame with unrecognized character ' + 'encoding');
		return undefined;
	}

	const mimeTypeEndIndex = frame.data.subarray(1).indexOf(0);
	if (mimeTypeEndIndex === -1) {
		return undefined;
	}
	const mimeType = fromUTF8(toUint8(frame.data, 1, mimeTypeEndIndex));
	const pictureType = frame.data[2 + mimeTypeEndIndex];
	const descriptionEndIndex = frame.data
		.subarray(3 + mimeTypeEndIndex)
		.indexOf(0);
	if (descriptionEndIndex === -1) {
		return undefined;
	}
	const description = fromUTF8(
		toUint8(frame.data, 3 + mimeTypeEndIndex, descriptionEndIndex)
	);

	let data;
	if (mimeType === '-->') {
		data = fromUTF8(
			toUint8(frame.data, 4 + mimeTypeEndIndex + descriptionEndIndex)
		);
	} 
	else {
		data = toArrayBuffer(
			frame.data.subarray(4 + mimeTypeEndIndex + descriptionEndIndex)
		);
	}

	metadataFrame.mimeType = mimeType;
	metadataFrame.pictureType = pictureType;
	metadataFrame.description = description;
	metadataFrame.data = data;
	return metadataFrame;
}

function fromUTF8(data?: BufferSource) {
	if (!data) {
		return '';
	}

	let uint8 = toUint8(data);
	// If present, strip off the UTF-8 BOM.
	if (uint8[0] == 0xef && uint8[1] == 0xbb && uint8[2] == 0xbf) {
		uint8 = uint8.subarray(3);
	}

	// Homebrewed UTF-8 decoder based on
	// https://en.wikipedia.org/wiki/UTF-8#Encoding
	// Unlike decodeURIComponent, won't throw on bad encoding.
	// In this way, it is similar to TextDecoder.

	let decoded = '';
	for (let i = 0; i < uint8.length; ++i) {
		// By default, the 'replacement character' codepoint.
		let codePoint = 0xfffd;

		// Top bit is 0, 1-byte encoding.
		if ((uint8[i] & 0x80) == 0) {
			codePoint = uint8[i];

			// Top 3 bits of byte 0 are 110, top 2 bits of byte 1 are 10,
			// 2-byte encoding.
		} 
		else if (
			uint8.length >= i + 2 &&
			(uint8[i] & 0xe0) == 0xc0 &&
			(uint8[i + 1] & 0xc0) == 0x80
		) {
			codePoint = ((uint8[i] & 0x1f) << 6) | (uint8[i + 1] & 0x3f);
			i += 1; // Consume one extra byte.

			// Top 4 bits of byte 0 are 1110, top 2 bits of byte 1 and 2 are 10,
			// 3-byte encoding.
		} 
		else if (
			uint8.length >= i + 3 &&
			(uint8[i] & 0xf0) == 0xe0 &&
			(uint8[i + 1] & 0xc0) == 0x80 &&
			(uint8[i + 2] & 0xc0) == 0x80
		) {
			codePoint =
				((uint8[i] & 0x0f) << 12) |
				((uint8[i + 1] & 0x3f) << 6) |
				(uint8[i + 2] & 0x3f);
			i += 2; // Consume two extra bytes.

			// Top 5 bits of byte 0 are 11110, top 2 bits of byte 1, 2 and 3 are 10,
			// 4-byte encoding.
		} 
		else if (
			uint8.length >= i + 4 &&
			(uint8[i] & 0xf1) == 0xf0 &&
			(uint8[i + 1] & 0xc0) == 0x80 &&
			(uint8[i + 2] & 0xc0) == 0x80 &&
			(uint8[i + 3] & 0xc0) == 0x80
		) {
			codePoint =
				((uint8[i] & 0x07) << 18) |
				((uint8[i + 1] & 0x3f) << 12) |
				((uint8[i + 2] & 0x3f) << 6) |
				(uint8[i + 3] & 0x3f);
			i += 3; // Consume three extra bytes.
		}

		// JavaScript strings are a series of UTF-16 characters.
		if (codePoint <= 0xffff) {
			decoded += String.fromCharCode(codePoint);
		} 
		else {
			// UTF-16 surrogate-pair encoding, based on
			// https://en.wikipedia.org/wiki/UTF-16#Description
			const baseCodePoint = codePoint - 0x10000;
			const highPart = baseCodePoint >> 10;
			const lowPart = baseCodePoint & 0x3ff;
			decoded += String.fromCharCode(0xd800 + highPart);
			decoded += String.fromCharCode(0xdc00 + lowPart);
		}
	}

	return decoded;
}

type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array | Uint8ClampedArray;

export function toArrayBuffer(view: ArrayBuffer | TypedArray): ArrayBuffer{
	if (view instanceof ArrayBuffer) {
		return view;
	} 
	else {
		if (view.byteOffset == 0 && view.byteLength == view.buffer.byteLength) {
			// This is a TypedArray over the whole buffer.
			return view.buffer;
		}
		// This is a 'view' on the buffer.  Create a new buffer that only contains
		// the data.  Note that since this isn't an ArrayBuffer, the 'new' call
		// will allocate a new buffer to hold the copy.
		return new Uint8Array(view).buffer;
	}
}
