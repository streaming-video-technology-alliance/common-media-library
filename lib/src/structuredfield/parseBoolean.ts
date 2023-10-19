import { ParsedValue } from './ParsedValue.js';

// 4.2.8.  Parsing a Boolean
//
// Given an ASCII string as input_string, return a Boolean. input_string
// is modified to remove the parsed value.
//
// 1.  If the first character of input_string is not "?", fail parsing.
//
// 2.  Discard the first character of input_string.
//
// 3.  If the first character of input_string matches "1", discard the
//     first character, and return true.
//
// 4.  If the first character of input_string matches "0", discard the
//     first character, and return false.
//
// 5.  No value has matched; fail parsing.
export function parseBoolean(input_string: string): ParsedValue<boolean> {
	let i = 0;
	if (input_string[i] !== '?') {
		throw new Error(`failed to parse "${input_string}" as Boolean`);
	}
	i++;
	if (input_string[i] === '1') {
		return {
			value: true,
			input_string: input_string.substring(++i),
		};
	}
	if (input_string[i] === '0') {
		return {
			value: false,
			input_string: input_string.substring(++i),
		};
	}
	throw new Error(`failed to parse "${input_string}" as Boolean`);
}