import { symbolToStr } from '../../cta/utils/symbolToStr.ts';
import type { SfToken } from '../SfToken.ts';
import { TOKEN } from '../utils/TOKEN.ts';
import { serializeError } from './serializeError.ts';

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
export function serializeToken(token: symbol): string;
export function serializeToken(token: SfToken): string;
export function serializeToken(token: symbol | SfToken) {
	const value = symbolToStr(token);
	if (/^([a-zA-Z*])([!#$%&'*+\-.^_`|~\w:/]*)$/.test(value) === false) {
		throw serializeError(value, TOKEN);
	}
	return value;
}
