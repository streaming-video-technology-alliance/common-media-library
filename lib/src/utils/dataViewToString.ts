import type { Encoding } from './Encoding.js';
import { UTF_8 } from './UTF_8.js';

/**
 * Converts a DataView to a string.
 *
 * @param dataView - The DataView to convert.
 * @param encoding - The encoding to use.
 * @returns The string representation of the DataView.
 *
 * @group Utils
 *
 * @beta
 *
 * @example
 * {@includeCode ../../test/utils/dataViewToString.test.ts#example}
 */
export function dataViewToString(dataView: DataView, encoding: Encoding = UTF_8): string {
	if (typeof TextDecoder !== 'undefined') {
		return new TextDecoder(encoding).decode(dataView);
	}

	const a: string[] = [];
	let i = 0;

	if (encoding === UTF_8) {
		/* The following algorithm is essentially a rewrite of the UTF8.decode at
		http://bannister.us/weblog/2007/simple-base64-encodedecode-javascript/
		*/

		while (i < dataView.byteLength) {
			let c = dataView.getUint8(i++);

			if (c < 0x80) {
				// 1-byte character (7 bits)
			}
			else if (c < 0xe0) {
				// 2-byte character (11 bits)
				c = (c & 0x1f) << 6;
				c |= (dataView.getUint8(i++) & 0x3f);
			}
			else if (c < 0xf0) {
				// 3-byte character (16 bits)
				c = (c & 0xf) << 12;
				c |= (dataView.getUint8(i++) & 0x3f) << 6;
				c |= (dataView.getUint8(i++) & 0x3f);
			}
			else {
				// 4-byte character (21 bits)
				c = (c & 0x7) << 18;
				c |= (dataView.getUint8(i++) & 0x3f) << 12;
				c |= (dataView.getUint8(i++) & 0x3f) << 6;
				c |= (dataView.getUint8(i++) & 0x3f);
			}

			a.push(String.fromCharCode(c));
		}
	}
	else { // Just map byte-by-byte (probably wrong)
		while (i < dataView.byteLength) {
			a.push(String.fromCharCode(dataView.getUint8(i++)));
		}
	}

	return a.join('');
};
