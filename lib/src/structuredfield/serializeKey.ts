import { err } from './err.js';

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
const KEY = /^[a-z*][a-z0-9\-_.*]*$/;

export function serializeKey(value: string) {
	if (KEY.test(value) === false) {
		throw new Error(err`failed to serialize "${value}" as Key`);
	}
	return value;
}
