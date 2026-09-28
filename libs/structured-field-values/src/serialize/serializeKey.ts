import { KEY } from '../utils/KEY.ts'
import { serializeError } from './serializeError.ts'

// 4.1.1.3.  Serializing a Key
//
// Given a key as input_key, return an ASCII string suitable for use in
// a HTTP field value.
//
// 1.  Convert input_key into a sequence of ASCII characters; if
//     conversion fails, fail serialization.
//
// 2.  If input_key contains characters not in lcalpha, DIGIT, "_", "-",
//     ".", or "*" fail serialization.
//
// 3.  If the first character of input_key is not lcalpha or "*", fail
//     serialization.
//
// 4.  Let output be an empty string.
//
// 5.  Append input_key to output.
//
// 6.  Return output.
/**
 * @internal
 */
export function serializeKey(value: string): string {
	if (typeof value !== 'string' || value.length === 0) {
		throw serializeError(value, KEY)
	}

	// lcalpha / "*"
	let code = value.charCodeAt(0)
	if ((code < 0x61 || code > 0x7a) && code !== 0x2a) {
		throw serializeError(value, KEY)
	}

	// lcalpha / DIGIT / "_" / "-" / "." / "*"
	for (let i = 1; i < value.length; i++) {
		code = value.charCodeAt(i)
		if ((code < 0x61 || code > 0x7a) && (code < 0x30 || code > 0x39) && code !== 0x5f && code !== 0x2d && code !== 0x2e && code !== 0x2a) {
			throw serializeError(value, KEY)
		}
	}

	return value
}
