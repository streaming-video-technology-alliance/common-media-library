import { ParsedValue } from './ParsedValue.js';
import { err } from './err.js';

// 4.2.3.3.  Parsing a Key
//
// Given an ASCII string as input_string, return a key. input_string is
// modified to remove the parsed value.
//
// 1.  If the first character of input_string is not lcalpha or "*",
//     fail parsing.
//
// 2.  Let output_string be an empty string.
//
// 3.  While input_string is not empty:
//
//     1.  If the first character of input_string is not one of lcalpha,
//         DIGIT, "_", "-", ".", or "*", return output_string.
//
//     2.  Let char be the result of consuming the first character of
//         input_string.
//
//     3.  Append char to output_string.
//
// 4.  Return output_string.
const KEY = /^[a-z*]$/;
const CHAR = /^[a-z0-9_\-.*]$/;

export function parseKey(input_string: string): ParsedValue<string> {
	let i = 0;
	if (KEY.test(input_string[i]) === false) {
		throw new Error(err`failed to parse "${input_string}" as Key`);
	}
	let output_string = '';
	while (input_string.length > i) {
		if (CHAR.test(input_string[i]) === false) {
			return {
				value: output_string,
				input_string: input_string.substring(i),
			};
		}
		output_string += input_string[i];
		i++;
	}
	return {
		value: output_string,
		input_string: input_string.substring(i),
	};
}
