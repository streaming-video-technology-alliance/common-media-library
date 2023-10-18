import { ParsedValue } from './ParsedValue.js';

// 4.2.4.  Parsing an Integer or Decimal
//
// Given an ASCII string as input_string, return an Integer or Decimal.
// input_string is modified to remove the parsed value.
//
// NOTE: This algorithm parses both Integers (Section 3.3.1) and
// Decimals (Section 3.3.2), and returns the corresponding structure.
//
// 1.   Let type be "integer".
//
// 2.   Let sign be 1.
//
// 3.   Let input_number be an empty string.
//
// 4.   If the first character of input_string is "-", consume it and
//      set sign to -1.
//
// 5.   If input_string is empty, there is an empty integer; fail
//      parsing.
//
// 6.   If the first character of input_string is not a DIGIT, fail
//      parsing.
//
// 7.   While input_string is not empty:
//
//      1.  Let char be the result of consuming the first character of
//          input_string.
//
//      2.  If char is a DIGIT, append it to input_number.
//
//      3.  Else, if type is "integer" and char is ".":
//
//          1.  If input_number contains more than 12 characters, fail
//              parsing.
//
//          2.  Otherwise, append char to input_number and set type to
//              "decimal".
//
//      4.  Otherwise, prepend char to input_string, and exit the loop.
//
//      5.  If type is "integer" and input_number contains more than 15
//          characters, fail parsing.
//
//      6.  If type is "decimal" and input_number contains more than 16
//          characters, fail parsing.
//
// 8.   If type is "integer":
//
//      1.  Parse input_number as an integer and let output_number be
//          the product of the result and sign.
//
//      2.  If output_number is outside the range -999,999,999,999,999
//          to 999,999,999,999,999 inclusive, fail parsing.
//
// 9.   Otherwise:
//
//      1.  If the final character of input_number is ".", fail parsing.
//
//      2.  If the number of characters after "." in input_number is
//          greater than three, fail parsing.
//
//      3.  Parse input_number as a decimal number and let output_number
//          be the product of the result and sign.
//
// 10.  Return output_number.
export function parseIntegerOrDecimal(input_string: string): ParsedValue<number> {
	const orig_string = input_string;
	let sign = 1;
	let input_number = '';
	let output_number;
	const i = 0;

	if (input_string[i] === '-') {
		sign = -1;
		input_string = input_string.substring(1);
	}

	if (input_string.length <= 0) {
		throw new Error(`failed to parse "${orig_string}" as Integer or Decimal`);
	}

	const re_integer = /^(\d+)?/g;
	const result_integer = re_integer.exec(input_string) as any;
	if (result_integer[0].length === 0) {
		throw new Error(`failed to parse "${orig_string}" as Integer or Decimal`);
	}
	input_number += result_integer[1];
	input_string = input_string.substring(re_integer.lastIndex);

	if (input_string[0] === '.') {
		// decimal
		if (input_number.length > 12) {
			throw new Error(`failed to parse "${orig_string}" as Integer or Decimal`);
		}
		const re_decimal = /^(\.\d+)?/g;
		const result_decimal = re_decimal.exec(input_string) as any;
		input_string = input_string.substring(re_decimal.lastIndex);
		// 9.2.  If the number of characters after "." in input_number is greater than three, fail parsing.
		if (result_decimal[0].length === 0 || result_decimal[1].length > 4) {
			throw new Error(`failed to parse "${orig_string}" as Integer or Decimal`);
		}
		input_number += result_decimal[1];
		// 7.6.  If type is "decimal" and input_number contains more than 16 characters, fail parsing.
		if (input_number.length > 16) {
			throw new Error(`failed to parse "${orig_string}" as Integer or Decimal`);
		}
		output_number = parseFloat(input_number) * sign;
	}
	else {
		// integer
		// 7.5.  If type is "integer" and input_number contains more than 15 characters, fail parsing.
		if (input_number.length > 15) {
			throw new Error(`failed to parse "${orig_string}" as Integer or Decimal`);
		}
		output_number = parseInt(input_number) * sign;
		if (output_number < -999999999999999n || 999999999999999n < output_number) {
			throw new Error(`failed to parse "${input_number}" as Integer or Decimal`);
		}
	}
	return {
		value: output_number,
		input_string,
	};
}
