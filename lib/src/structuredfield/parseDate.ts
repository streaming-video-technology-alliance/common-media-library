import { ParsedValue } from './ParsedValue.js';
import { parseIntegerOrDecimal } from './parseIntegerOrDecimal.js';

// 4.2.9.  Parsing a Date
//
// Given an ASCII string as input_string, return a Date. input_string is
// modified to remove the parsed value.
//
// 1.  If the first character of input_string is not "@", fail parsing.
//
// 2.  Discard the first character of input_string.
//
// 3.  Let output_date be the result of running Parsing an Integer or
//     Decimal (Section 4.2.4) with input_string.
//
// 4.  If output_date is a Decimal, fail parsing.
//
// 5.  Return output_date.
export function parseDate(input_string: string): ParsedValue<Date> {
	let i = 0;
	if (input_string[i] !== '@') {
		throw new Error(`failed to parse "${input_string}" as Date`);
	}
	i++;
	const output_date = parseIntegerOrDecimal(input_string.substring(i));
	if (Number.isInteger(output_date.value) === false) {
		throw new Error(`failed to parse "${input_string}" as Date`);
	}
	return {
		value: new Date(output_date.value * 1000),
		input_string: output_date.input_string,
	};
}
