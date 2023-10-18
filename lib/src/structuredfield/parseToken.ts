import { ParsedValue } from './ParsedValue';

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
export function parseToken(input_string: string): ParsedValue<symbol> {
	if (/^[a-zA-Z*]$/.test(input_string[0]) === false) {
		throw new Error(`failed to parse "${input_string}" as Token`);
	}
	const re = /^([!#$%&'*+\-.^_`|~\w:/]+)/g;
	const output_string = (re.exec(input_string) as any)[1];
	input_string = input_string.substring(re.lastIndex);
	return {
		value: Symbol.for(output_string),
		input_string,
	};
}
