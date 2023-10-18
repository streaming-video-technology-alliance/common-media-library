import { ParsedValue } from './ParsedValue.js';
import { SfBareItem } from './SfBareItem.js';
import { err } from './err.js';
import { parseBoolean } from './parseBoolean.js';
import { parseByteSequence } from './parseByteSequence.js';
import { parseDate } from './parseDate.js';
import { parseIntegerOrDecimal } from './parseIntegerOrDecimal.js';
import { parseString } from './parseString.js';
import { parseToken } from './parseToken.js';

// 4.2.3.1.  Parsing a Bare Item
//
// Given an ASCII string as input_string, return a bare Item.
// input_string is modified to remove the parsed value.
//
// 1.  If the first character of input_string is a "-" or a DIGIT,
//     return the result of running Parsing an Integer or Decimal
//     (Section 4.2.4) with input_string.
//
// 2.  If the first character of input_string is a DQUOTE, return the
//     result of running Parsing a String (Section 4.2.5) with
//     input_string.
//
// 3.  If the first character of input_string is ":", return the result
//     of running Parsing a Byte Sequence (Section 4.2.7) with
//     input_string.
//
// 4.  If the first character of input_string is "?", return the result
//     of running Parsing a Boolean (Section 4.2.8) with input_string.
//
// 5.  If the first character of input_string is an ALPHA or "*", return
//     the result of running Parsing a Token (Section 4.2.6) with
//     input_string.
//
// 6.  If the first character of input_string is "@", return the result
//     of running Parsing a Date (Section 4.2.9) with input_string.
//
// 7.  Otherwise, the item type is unrecognized; fail parsing.
export function parseBareItem(input_string: string): ParsedValue<SfBareItem> {
	const first = input_string[0];
	if (first === `"`) {
		return parseString(input_string);
	}
	if (/^[-0-9]/.test(first)) {
		return parseIntegerOrDecimal(input_string);
	}
	if (first === `?`) {
		return parseBoolean(input_string);
	}
	if (first === `:`) {
		return parseByteSequence(input_string);
	}
	if (/^[a-zA-Z*]/.test(first)) {
		return parseToken(input_string);
	}
	if (first === `@`) {
		return parseDate(input_string);
	}
	throw new Error(err`failed to parse "${input_string}" as Bare Item`);
}
