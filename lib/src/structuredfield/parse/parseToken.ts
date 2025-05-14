import type { SfDecodeOptions } from '../SfDecodeOptions';
import { SfToken } from '../SfToken.ts';
import { TOKEN } from '../utils/TOKEN.ts';
import type { ParsedValue } from './ParsedValue';
import { parsedValue } from './ParsedValue.ts';
import { parseError } from './parseError.ts';

// 4.2.6.  Parsing a Token
//
// Given an ASCII string as input_string, return a Token. input_string
// is modified to remove the parsed value.
//
// 1.  If the first character of input_string is not ALPHA or "*", fail
//     parsing.
//
// 2.  Let output_string be an empty string.
//
// 3.  While input_string is not empty:
//
//     1.  If the first character of input_string is not in tchar, ":"
//         or "/", return output_string.
//
//     2.  Let char be the result of consuming the first character of
//         input_string.
//
//     3.  Append char to output_string.
//
// 4.  Return output_string.
export function parseToken(src: string, options?: SfDecodeOptions): ParsedValue<symbol | SfToken> {
	if (/^[a-zA-Z*]$/.test(src[0]) === false) {
		throw parseError(src, TOKEN);
	}

	const re = /^([!#$%&'*+\-.^_`|~\w:/]+)/g;
	const value = (re.exec(src) as any)[1];
	src = src.substring(re.lastIndex);

	return parsedValue(
		options?.useSymbol === false ? new SfToken(value) : Symbol.for(value),
		src,
	);
}
