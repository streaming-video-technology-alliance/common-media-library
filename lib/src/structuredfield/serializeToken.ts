import { err } from './err.js';

// 4.1.7.  Serializing a Token
//
// Given a Token as input_token, return an ASCII string suitable for use
// in a HTTP field value.
//
// 1.  Convert input_token into a sequence of ASCII characters; if
//     conversion fails, fail serialization.
//
// 2.  If the first character of input_token is not ALPHA or "*", or the
//     remaining portion contains a character not in tchar, ":" or "/",
//     fail serialization.
//
// 3.  Let output be an empty string.
//
// 4.  Append input_token to output.
//
// 5.  Return output.
const TOKEN = /^([a-zA-Z*])([!#$%&'*+\-.^_`|~\w:/]*)$/;

export function serializeToken(token: symbol) {
	const value = Symbol.keyFor(token);
	if (value && TOKEN.test(value) === false) {
		throw new Error(err`failed to serialize "${value}" as token`);
	}
	return value;
}
