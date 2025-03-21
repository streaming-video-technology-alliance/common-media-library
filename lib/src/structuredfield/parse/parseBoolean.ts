import { BOOLEAN } from '../utils/BOOLEAN.js';
import { ParsedValue } from './ParsedValue.js';
import { parseError } from './parseError.js';

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
export function parseBoolean(src: string): ParsedValue<boolean> {
	let i = 0;
	if (src[i] !== '?') {
		throw parseError(src, BOOLEAN);
	}
	i++;
	if (src[i] === '1') {
		return {
			value: true,
			src: src.substring(++i),
		};
	}
	if (src[i] === '0') {
		return {
			value: false,
			src: src.substring(++i),
		};
	}
	throw parseError(src, BOOLEAN);
}
